const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const env = require("../config/env");
const axios = require("axios");

// Helper to get or create a workspace
async function getWorkspaceId(req) {
  const headerWorkspaceId = req.headers["x-workspace-id"];
  if (headerWorkspaceId) return headerWorkspaceId;

  let ws = await prisma.workspace.findFirst();
  if (!ws) {
    ws = await prisma.workspace.create({
      data: {
        name: "Default Workspace",
        plan: "FREE",
      },
    });
  }
  return ws.id;
}

// SSE Stream for Claude AI Chat
router.get("/chat-stream", async (req, res) => {
  const message = req.query.message || "Hello";
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish stream

  try {
    const workspaceId = await getWorkspaceId(req);
    const docs = await prisma.document.findMany({
      where: { workspaceId },
      take: 5,
    });
    const knowledge = await prisma.knowledgeItem.findMany({
      where: { workspaceId },
      take: 5,
    });

    const systemPrompt = `You are Nexus AI, an advanced developer pipeline intelligence engine.
Workspace ID: ${workspaceId}

Current Scanned Workspace Documents:
${docs.map(d => `- ${d.name} (${d.fileUrl})`).join("\n")}

Knowledge Base Items:
${knowledge.map(k => `- [${k.title}]: ${k.content}`).join("\n")}

Acknowledge this context if queried. Answer all diagnostic, code pipeline, and log questions directly and with code blocks.`;

    const isMockKey = !env.CLAUDE_API_KEY || env.CLAUDE_API_KEY === "claude_mock_api_key_4082" || env.CLAUDE_API_KEY.includes("mock");

    if (!isMockKey) {
      try {
        const response = await axios({
          method: "post",
          url: "https://api.anthropic.com/v1/messages",
          headers: {
            "x-api-key": env.CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          data: {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
            stream: true,
          },
          responseType: "stream",
        });

        let buffer = "";
        response.data.on("data", chunk => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data:")) {
              try {
                const jsonStr = cleanLine.substring(5).trim();
                if (jsonStr === "[DONE]") continue;
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === "content_block_delta" && parsed.delta && parsed.delta.text) {
                  res.write(`data: ${JSON.stringify({ token: parsed.delta.text })}\n\n`);
                }
              } catch (e) {
                // Incomplete chunk parse error - skip
              }
            }
          }
        });

        response.data.on("end", () => {
          res.write("data: [DONE]\n\n");
          res.end();
        });

        req.on("close", () => {
          if (response.data.destroy) response.data.destroy();
        });
        return;
      } catch (apiError) {
        console.error("Claude API call failed, falling back to mock streaming:", apiError.message);
      }
    }

    // Fallback streaming for development/mock mode
    const tokens = [
      "Hello! ", "This ", "is ", "Nexus AI. ", "\n\n",
      "[Dev Mode: Fallback Stream]\n",
      "I ", "detected ", "your ", "workspace ", "context. ",
      `Currently tracking workspace "${workspaceId}" with ${docs.length} documents. `,
      "\n\nHere is a diagnostic sample analysis based on your query: '", message, "'.\n",
      "Ensure a valid `CLAUDE_API_KEY` is configured in `backend/.env` for real-time Sonnet integration."
    ];

    let currentToken = 0;
    const interval = setInterval(() => {
      if (currentToken < tokens.length) {
        res.write(`data: ${JSON.stringify({ token: tokens[currentToken] })}\n\n`);
        currentToken++;
      } else {
        res.write("data: [DONE]\n\n");
        clearInterval(interval);
        res.end();
      }
    }, 50);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });

  } catch (error) {
    console.error("Chat stream root error:", error);
    res.write(`data: ${JSON.stringify({ token: "\nError establishing connection." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

router.post("/research", (req, res) => {
  const { topic } = req.body;
  res.status(200).json({
    topic,
    summary: `Structured summary about ${topic}. Retrieved citations from active web search probes.`,
    citations: ["https://docs.nexus-ci.com/research", "https://wikipedia.org"],
  });
});

// Knowledge Base entries
router.get("/knowledge", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const items = await prisma.knowledgeItem.findMany({
      where: { workspaceId },
    });
    
    // Seed default knowledge items if database is empty
    if (items.length === 0) {
      const defaultItems = [
        { title: "Brand Guidelines v2.0", content: "Corporate tone rules and style guidelines.", tags: ["branding", "marketing"], workspaceId },
        { title: "API Integrations Specs", content: "Webhooks endpoints and schema details.", tags: ["engineering", "docs"], workspaceId }
      ];
      await prisma.knowledgeItem.createMany({ data: defaultItems });
      const seeded = await prisma.knowledgeItem.findMany({ where: { workspaceId } });
      return res.status(200).json(seeded);
    }
    
    res.status(200).json(items);
  } catch (error) {
    console.error("Fetch knowledge error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/knowledge", async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const workspaceId = await getWorkspaceId(req);
    const newItem = await prisma.knowledgeItem.create({
      data: {
        title,
        content,
        tags: tags || [],
        workspaceId,
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create knowledge error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/knowledge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.knowledgeItem.delete({
      where: { id },
    });
    res.status(200).json({ message: "Knowledge item deleted" });
  } catch (error) {
    console.error("Delete knowledge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Prompts
router.get("/prompts", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const items = await prisma.prompt.findMany({
      where: { workspaceId },
    });

    // Seed default prompts if empty
    if (items.length === 0) {
      const defaultPrompts = [
        { title: "Cold Outreach", content: "Write a high-converting cold outreach email...", category: "Sales", workspaceId },
        { title: "SEO Blog Outline", content: "Generate an outline for a blog post targeting...", category: "Marketing", workspaceId }
      ];
      await prisma.prompt.createMany({ data: defaultPrompts });
      const seeded = await prisma.prompt.findMany({ where: { workspaceId } });
      return res.status(200).json(seeded);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Fetch prompts error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/prompts", async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const workspaceId = await getWorkspaceId(req);
    const newPrompt = await prisma.prompt.create({
      data: {
        title,
        content,
        category,
        workspaceId,
      },
    });
    res.status(201).json(newPrompt);
  } catch (error) {
    console.error("Create prompt error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

