const express = require("express");
const router = express.Router();

// SSE Stream mock for Claude AI Chat
router.get("/chat-stream", (req, res) => {
  const message = req.query.message || "Hello";
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Establish stream

  const tokens = [
    "This", " ", "is", " ", "an", " ", "AI-generated", " ", "response", " ",
    "from", " ", "Claude", " ", "3.5", " ", "Haiku,", " ", "processed", " ",
    "by", " ", "the", " ", "Intelligence", " ", "Hub.", " ",
    "I", " ", "can", " ", "readily", " ", "analyze", " ", "documents,", " ",
    "score", " ", "CRM", " ", "leads,", " ", "and", " ", "synthesize", " ",
    "reports."
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
    citations: ["https://docs.outpost-ai.com/research", "https://wikipedia.org"],
  });
});

// Knowledge Base entries
let knowledgeItems = [
  { id: "k-1", title: "Brand Guidelines v2.0", content: "Corporate tone rules and style guidelines.", tags: ["branding", "marketing"] },
  { id: "k-2", title: "API Integrations Specs", content: "Webhooks endpoints and schema details.", tags: ["engineering", "docs"] }
];

router.get("/knowledge", (req, res) => {
  res.status(200).json(knowledgeItems);
});

router.post("/knowledge", (req, res) => {
  const { title, content, tags } = req.body;
  const newItem = { id: `k-${Date.now()}`, title, content, tags: tags || [] };
  knowledgeItems.push(newItem);
  res.status(201).json(newItem);
});

router.delete("/knowledge/:id", (req, res) => {
  const { id } = req.params;
  knowledgeItems = knowledgeItems.filter(item => item.id !== id);
  res.status(200).json({ message: "Knowledge item deleted" });
});

// Prompts
const prompts = [
  { id: "p-1", title: "Cold Outreach", content: "Write a high-converting cold outreach email...", category: "Sales" },
  { id: "p-2", title: "SEO Blog Outline", content: "Generate an outline for a blog post targeting...", category: "Marketing" }
];

router.get("/prompts", (req, res) => {
  res.status(200).json(prompts);
});

router.post("/prompts", (req, res) => {
  const { title, content, category } = req.body;
  const newPrompt = { id: `p-${Date.now()}`, title, content, category };
  res.status(201).json(newPrompt);
});

module.exports = router;
