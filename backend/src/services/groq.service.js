const env = require("../config/env");

const isConfigured = env.GROQ_API_KEY && !env.GROQ_API_KEY.includes("placeholder");

/**
 * Maps frontend model values to Groq model IDs
 */
function getGroqModelId(modelName) {
  const name = (modelName || "").toLowerCase();
  if (name.includes("3.3") || name.includes("llama-3.3")) {
    return "llama-3.3-70b-versatile";
  }
  if (name.includes("8b") || name.includes("llama-3.1-8b")) {
    return "llama-3.1-8b-instant";
  }
  // Default to stable Llama 3.3 70B
  return "llama-3.3-70b-versatile";
}

/**
 * Generate stream responses for chat using Groq
 */
async function generateChatStream(modelName, systemPrompt, userMessage, history = [], onToken, onDone, onError) {
  if (!isConfigured) {
    return generateFallbackStream(userMessage, onToken, onDone);
  }

  try {
    const groqModel = getGroqModelId(modelName);

    // Format history for Groq (standard OpenAI message list)
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(h => ({
        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
        content: h.content
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep the last incomplete line

      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.startsWith("data: ")) {
          const dataStr = cleanLine.substring(6).trim();
          if (dataStr === "[DONE]") {
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              onToken(token);
            }
          } catch (e) {
            // Skip parse errors on incomplete chunks
          }
        }
      }
    }
    onDone();
  } catch (error) {
    console.error("Groq Chat Stream Error:", error);
    onError(error);
  }
}

/**
 * Generate structured diagnosis for build logs using Groq
 */
async function diagnoseLog(modelName, logContent) {
  if (!isConfigured) {
    return getFallbackDiagnosis(logContent);
  }

  try {
    const groqModel = getGroqModelId(modelName);

    const prompt = `You are a DevOps and code repair agent. Analyze the following build log failure:

--- START LOG ---
${logContent}
--- END LOG ---

Identify:
1. The error message.
2. The root cause analysis (1-2 sentences).
3. A Git diff patch that would fix the issue (if possible). Make sure it modifies real configurations or code files.
4. The target file path of the file being modified.
5. An array of 4-6 simulation commands showing the steps to apply and verify the patch.

Return ONLY a JSON object matching this schema:
{
  "error": "Short title of the error",
  "analysis": "Explanation of root cause",
  "diff": "Git diff patch text",
  "targetFile": "path/to/target/file",
  "cmdLogs": [
    "Resolving file...",
    "Applying patch...",
    "Running verification...",
    "Completing deployment..."
  ]
}

DO NOT wrap your response with markdown code blocks (e.g. do not write \`\`\`json). Return raw JSON only.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Groq Diagnosis Error, falling back:", error);
    return getFallbackDiagnosis(logContent);
  }
}

/**
 * Generate a web research summary using Groq
 */
async function generateResearchSummary(modelName, topic, depth) {
  if (!isConfigured) {
    return getFallbackResearch(topic, depth);
  }

  try {
    const groqModel = getGroqModelId(modelName);

    const prompt = `Perform a technical research analysis on the topic: "${topic}".
Depth: ${depth === "deep" ? "Comprehensive details and recommendations" : "Quick executive overview"}.

Provide a structured Markdown output.
Include:
1. Executive summary.
2. Key findings.
3. 2-3 citations or reference URLs (e.g. docs.github.com, react.dev, etc.).

Return the output in this format:
--- SUMMARY ---
<Markdown content here>
--- CITATIONS ---
- URL 1
- URL 2`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    
    let summary = text;
    let citations = ["https://docs.nexus-ci.com/research", "https://wikipedia.org"];
    
    if (text.includes("--- SUMMARY ---") && text.includes("--- CITATIONS ---")) {
      const parts = text.split("--- CITATIONS ---");
      summary = parts[0].replace("--- SUMMARY ---", "").trim();
      const citationLines = parts[1].trim().split("\n");
      citations = citationLines
        .map(line => line.replace(/^-\s*/, "").trim())
        .filter(line => line.startsWith("http"));
    }

    return { summary, citations };
  } catch (error) {
    console.error("Groq Research Error:", error);
    return getFallbackResearch(topic, depth);
  }
}

// Fallback logic if key is missing
function generateFallbackStream(message, onToken, onDone) {
  const fallbackTokens = [
    "Hello! ", "This ", "is ", "Nexus AI. ", "\n\n",
    "[Dev Mode: Fallback Groq Stream]\n",
    "I ", "detected ", "your ", "query: '", message, "'.\n\n",
    "Please configure your GROQ_API_KEY in backend/.env to access live Llama 3.1 inference."
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i < fallbackTokens.length) {
      onToken(fallbackTokens[i]);
      i++;
    } else {
      clearInterval(interval);
      onDone();
    }
  }, 40);
}

function getFallbackDiagnosis(logContent) {
  return {
    error: "Build failure (Groq Fallback)",
    analysis: "The server is running in dev fallback mode. Configure a valid GROQ_API_KEY.",
    diff: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,1 +1,2 @@
 # Nexus AI
+Fix logs with Groq pipeline integration`,
    targetFile: "README.md",
    cmdLogs: [
      "Simulating log ingestion...",
      "Analyzing log content...",
      "Resolving errors... success."
    ]
  };
}

function getFallbackResearch(topic, depth) {
  return {
    summary: `### Research Summary: ${topic}\n\nThis is a fallback summary generated in development mode for the topic **${topic}** with **${depth}** depth.\n\nConfigure your GROQ_API_KEY in backend/.env to query live Llama models.`,
    citations: ["https://wikipedia.org/wiki/" + encodeURIComponent(topic)]
  };
}

module.exports = {
  generateChatStream,
  diagnoseLog,
  generateResearchSummary
};
