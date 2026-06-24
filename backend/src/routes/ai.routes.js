const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

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

// SSE Stream mock for Claude AI Chat
router.get("/chat-stream", (req, res) => {
  const message = req.query.message || "Hello";
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish stream

  const tokens = [
    "This", " ", "is", " ", "an", " ", "AI-generated", " ", "response", " ",
    "from", " ", "Claude", " ", "3.5", " ", "Sonnet,", " ", "processed", " ",
    "by", " ", "the", " ", "Log", " ", "Intelligence", " ", "engine.", " ",
    "I", " ", "can", " ", "readily", " ", "diagnose", " ", "pipeline", " ",
    "failures,", " ", "analyze", " ", "build", " ", "logs,", " ", "and", " ",
    "generate", " ", "code", " ", "patches."
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
  }, 80);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
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

