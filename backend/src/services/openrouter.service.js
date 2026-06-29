const env = require("../config/env");

const isConfigured = env.OPENROUTER_API_KEY && !env.OPENROUTER_API_KEY.includes("placeholder");

/**
 * Maps openrouter- model name to OpenRouter model ID
 */
function getOpenRouterModel(modelName) {
  const model = (modelName || "openrouter-deepseek/deepseek-coder").replace("openrouter-", "");
  // If the user didn't specify a slash (e.g. just typed deepseek-coder), default to the standard DeepSeek V2 model ID
  if (!model.includes("/")) {
    if (model.includes("deepseek")) {
      return "deepseek/deepseek-coder";
    }
    return "meta-llama/llama-3.1-8b-instruct:free";
  }
  return model;
}

/**
 * Chat Stream for OpenRouter models
 */
async function generateChatStream(modelName, systemPrompt, userMessage, history = [], onToken, onDone, onError) {
  if (!isConfigured) {
    return generateFallbackStream(userMessage, onToken, onDone);
  }

  try {
    const model = getOpenRouterModel(modelName);
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(h => ({
        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
        content: h.content
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/google/nexus-ai",
        "X-Title": "Nexus AI DevOps Console"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API returned status ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const clean = line.trim();
        if (clean.startsWith("data: ")) {
          const dataStr = clean.slice(6).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              onToken(token);
            }
          } catch (e) {
            // Ignore incomplete chunks parsing errors
          }
        }
      }
    }
    onDone();
  } catch (error) {
    console.error("OpenRouter Chat Stream Error:", error);
    onError(error);
  }
}

/**
 * Structured log diagnostics using OpenRouter models
 */
async function diagnoseLog(modelName, logContent) {
  if (!isConfigured) {
    return getFallbackDiagnosis(logContent);
  }

  try {
    const model = getOpenRouterModel(modelName);
    const prompt = `You are a DevOps and code repair agent. Analyze the following build log failure:

--- START LOG ---
${logContent}
--- END LOG ---

Identify:
1. The error message.
2. The root cause analysis (1-2 sentences).
3. A Git diff patch that would fix the issue (if possible).
4. The target file path.
5. An array of 4-6 simulation commands to apply and verify.

Return ONLY a JSON object matching this schema (do NOT wrap it in \`\`\`json blocks):
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
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/google/nexus-ai",
        "X-Title": "Nexus AI DevOps Console"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter diagnostics request failed: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("OpenRouter Diagnostics Error, returning fallback:", error);
    return getFallbackDiagnosis(logContent);
  }
}

/**
 * Generate research summary using OpenRouter
 */
async function generateResearchSummary(modelName, topic, depth) {
  if (!isConfigured) {
    return getFallbackResearch(topic, depth);
  }

  try {
    const model = getOpenRouterModel(modelName);
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com/google/nexus-ai",
        "X-Title": "Nexus AI DevOps Console"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter research request failed: ${errText}`);
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
    console.error("OpenRouter Research Error:", error);
    return getFallbackResearch(topic, depth);
  }
}

// Fallback logic if key is missing
function generateFallbackStream(message, onToken, onDone) {
  const fallbackTokens = [
    "Hello! ", "This ", "is ", "Nexus AI. ", "\n\n",
    "[Dev Mode: Fallback OpenRouter Stream]\n",
    "I ", "detected ", "your ", "query: '", message, "'.\n\n",
    "Configure your OPENROUTER_API_KEY in backend/.env to access DeepSeek Coder V2 via OpenRouter."
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
    error: "Build failure (OpenRouter Fallback)",
    analysis: "Configure a valid OPENROUTER_API_KEY in backend/.env to use OpenRouter coding models.",
    diff: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,1 +1,2 @@
 # Nexus AI
+Fix logs with OpenRouter DeepSeek integration`,
    targetFile: "README.md",
    cmdLogs: [
      "Connecting to OpenRouter endpoint...",
      "OpenRouter returned unauthenticated...",
      "Simulating fallback fix patch."
    ]
  };
}

function getFallbackResearch(topic, depth) {
  return {
    summary: `### Research Summary: ${topic}\n\nFallback summary. Configure your OPENROUTER_API_KEY in backend/.env to run this summary via OpenRouter.`,
    citations: []
  };
}

module.exports = {
  generateChatStream,
  diagnoseLog,
  generateResearchSummary
};
