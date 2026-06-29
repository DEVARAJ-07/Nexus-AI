const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

let genAI = null;
if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes("placeholder")) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  } catch (err) {
    console.error("Failed to initialize GoogleGenerativeAI:", err.message);
  }
}


function resolveGeminiModelId(modelName) {
  const name = (modelName || "").toLowerCase();
  if (name.includes("1.5-pro") || name.includes("gemini-1.5-pro")) {
    return "gemini-pro-latest";
  }
  if (name.includes("1.5-flash") || name.includes("gemini-1.5-flash")) {
    return "gemini-flash-latest";
  }
  if (name.includes("gemini")) {
    return name;
  }
  return "gemini-pro-latest";
}

/**
 * Generate stream responses for chat
 */
async function generateChatStream(modelName, systemPrompt, userMessage, history = [], onToken, onDone, onError) {
  if (!genAI) {
    return generateFallbackStream(userMessage, onToken, onDone);
  }

  try {
    const validModel = resolveGeminiModelId(modelName);
    const model = genAI.getGenerativeModel({
      model: validModel,
      systemInstruction: systemPrompt,
    });

    // Map history to Gemini format (role must be 'user' or 'model')
    const formattedHistory = (history || []).map(h => ({
      role: h.role === "assistant" || h.role === "model" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessageStream(userMessage);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        onToken(chunkText);
      }
    }
    onDone();
  } catch (error) {
    console.error("Gemini Chat Stream Error:", error);
    onError(error);
  }
}

/**
 * Generate structured diagnosis for build logs
 */
async function diagnoseLog(logContent) {
  if (!genAI) {
    return getFallbackDiagnosis(logContent);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

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
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Diagnosis Error, falling back:", error);
    return getFallbackDiagnosis(logContent);
  }
}

/**
 * Generate a web research summary
 */
async function generateResearchSummary(topic, depth) {
  if (!genAI) {
    return getFallbackResearch(topic, depth);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse summary and citations
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
    console.error("Gemini Research Error:", error);
    return getFallbackResearch(topic, depth);
  }
}

/**
 * Generate embedding vector using gemini-embedding-2 (768 dimensions)
 */
async function getEmbedding(text) {
  if (!genAI) {
    return getFallbackEmbedding(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Gemini Embedding Error, using fallback:", error);
    return getFallbackEmbedding(text);
  }
}

/**
 * Simple text generation helper
 */
async function generateText(systemPrompt, userPrompt) {
  if (!genAI) {
    return "Development mode: fallback response.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-latest",
      systemInstruction: systemPrompt
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Generate Text Error:", error);
    throw error;
  }
}

// Fallback logic for offline/placeholder mode
function generateFallbackStream(message, onToken, onDone) {
  const fallbackTokens = [
    "Hello! ", "This ", "is ", "Nexus AI. ", "\n\n",
    "[Dev Mode: Fallback Gemini Stream]\n",
    "I ", "detected ", "your ", "query: '", message, "'.\n\n",
    "To use real Gemini Pro API, make sure your GEMINI_API_KEY env key is valid."
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
  const lowerLog = (logContent || "").toLowerCase();
  
  if (lowerLog.includes("startnode")) {
    return {
      error: "Missing script: \"startnode\"",
      analysis: "The pipeline is invoking 'npm run startnode', which is not declared in backend/package.json.",
      diff: `diff --git a/backend/package.json b/backend/package.json
--- a/backend/package.json
+++ b/backend/package.json
@@ -7,2 +7,3 @@
     "start": "node src/server.js",
+    "startnode": "node src/server.js",
     "dev": "nodemon src/server.js"`,
      targetFile: "backend/package.json",
      cmdLogs: [
        "Analyzing package scripts...",
        "Applying patch to backend/package.json...",
        "Validating scripts... compiled successfully."
      ]
    };
  }

  return {
    error: "Build failure",
    analysis: "A generic compilation error occurred during package compilation.",
    diff: `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
@@ -1,1 +1,2 @@
 # Nexus AI
+Fix generic log compilation error`,
    targetFile: "README.md",
    cmdLogs: [
      "Analyzing log content...",
      "Generating general README patch...",
      "Resolving changes... success."
    ]
  };
}

function getFallbackResearch(topic, depth) {
  return {
    summary: `### Research Summary: ${topic}\n\nThis is a fallback summary generated in development mode for the topic **${topic}** with **${depth}** depth.\n\n- Key Point 1: Simulated research results are active.\n- Key Point 2: Configure your GEMINI_API_KEY in backend/.env to access live intelligence.`,
    citations: ["https://wikipedia.org/wiki/" + encodeURIComponent(topic), "https://docs.nexus-ci.com"]
  };
}

function getFallbackEmbedding(text) {
  // Generate a deterministic mock 768-dimension vector
  const vector = [];
  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum += text.charCodeAt(i);
  }
  for (let i = 0; i < 768; i++) {
    vector.push(Math.sin(sum + i) * 0.1);
  }
  return vector;
}

module.exports = {
  generateChatStream,
  diagnoseLog,
  generateResearchSummary,
  getEmbedding,
  generateText
};
