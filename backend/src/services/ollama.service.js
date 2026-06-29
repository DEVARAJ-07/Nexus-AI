const env = require("../config/env");

/**
 * Extracts model name by removing ollama- prefix
 */
function getOllamaModel(modelName) {
  return (modelName || "ollama-qwen2.5-coder").replace("ollama-", "");
}

/**
 * Chat Stream for local Ollama models (via OpenAI-compatible completions stream)
 */
async function generateChatStream(modelName, systemPrompt, userMessage, history = [], onToken, onDone, onError) {
  try {
    const model = getOllamaModel(modelName);
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(h => ({
        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
        content: h.content
      })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch(`${env.OLLAMA_HOST}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Local Ollama returned status ${response.status}`);
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
    console.error("Local Ollama Chat Stream Error:", error.message);
    onError(new Error("Local Ollama connection failed. Make sure Ollama is running locally."));
  }
}

/**
 * Structured log diagnostics using local Ollama
 */
async function diagnoseLog(modelName, logContent) {
  try {
    const model = getOllamaModel(modelName);
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

    const response = await fetch(`${env.OLLAMA_HOST}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama diagnostics request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Ollama Diagnostics Error, returning fallback:", error);
    return getFallbackDiagnosis(logContent);
  }
}

/**
 * Generate research summary using local Ollama
 */
async function generateResearchSummary(modelName, topic, depth) {
  try {
    const model = getOllamaModel(modelName);
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

    const response = await fetch(`${env.OLLAMA_HOST}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama research request failed with status ${response.status}`);
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
    console.error("Ollama Research Error:", error);
    return {
      summary: `### Research Summary: ${topic}\n\nLocal Ollama compilation failed or timed out. Make sure the model is pulled locally.`,
      citations: []
    };
  }
}

function getFallbackDiagnosis(logContent) {
  return {
    error: "Build failure (Ollama Local Fallback)",
    analysis: "Ollama model was offline or returned non-JSON. Verify that your local Ollama daemon is running.",
    diff: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,1 +1,2 @@
 # Nexus AI
+Fix logs with local Ollama pipeline integration`,
    targetFile: "README.md",
    cmdLogs: [
      "Connecting to local daemon...",
      "Ollama model did not respond...",
      "Using local simulation patch."
    ]
  };
}

module.exports = {
  generateChatStream,
  diagnoseLog,
  generateResearchSummary
};
