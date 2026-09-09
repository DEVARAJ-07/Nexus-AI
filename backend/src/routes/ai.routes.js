const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const geminiService = require("../services/gemini.service");
const groqService = require("../services/groq.service");
const ollamaService = require("../services/ollama.service");
const openrouterService = require("../services/openrouter.service");
const fs = require("fs");
const path = require("path");
const mockDocuments = require("../config/documentsStore");

// SSE Stream for AI Chat with DB query caching and history logging
router.get("/chat-stream", async (req, res) => {
  const message = req.query.message || "Hello";
  const model = req.query.model || "groq-llama-3.3-70b";
  const username = req.query.username || "DEVARAJ-07";
  const chatId = req.query.chatId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection-Empty-Action", "keep-alive");

  let fullResponseText = "";
  let user = null;
  let chat = null;
  let chatHistory = [];

  // Try DB persistence gracefully
  try {
    const userEmail = `${username}@github.com`;
    user = await prisma.user.upsert({
      where: { email: userEmail },
      update: { name: username },
      create: { email: userEmail, name: username },
    }).catch(() => null);

    if (user) {
      if (chatId) {
        chat = await prisma.chat.findUnique({ where: { id: chatId } }).catch(() => null);
      }
      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            userId: user.id,
            title: message.substring(0, 40),
          },
        }).catch(() => null);
      }

      if (chat) {
        const dbMessages = await prisma.message.findMany({
          where: { chatId: chat.id },
          orderBy: { createdAt: "asc" },
          take: 10,
        }).catch(() => []);

        chatHistory = dbMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "user",
            content: message,
          },
        }).catch(() => null);
      }
    }
  } catch (dbErr) {
    console.warn("[DB_BYPASS] Chat DB operation skipped:", dbErr.message);
  }

  const systemPrompt = `You are Nexus AI, an advanced developer pipeline intelligence engine.
Your environment is fully connected to Supabase and GitHub.
You are chatting with developer: @${username}.
Analyze all diagnostic, code pipeline, and log questions directly and with code blocks.`;

  const onToken = (token) => {
    fullResponseText += token;
    res.write(`data: ${JSON.stringify({ token, chatId: chat ? chat.id : "local-chat" })}\n\n`);
  };

  const onDone = async () => {
    if (chat && user) {
      try {
        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "assistant",
            content: fullResponseText,
          },
        }).catch(() => null);

        await prisma.query.create({
          data: {
            userId: user.id,
            queryText: message.substring(0, 255),
            response: fullResponseText.substring(0, 1000),
            status: "COMPLETED",
          },
        }).catch(() => null);
      } catch (err) {
        console.error("Failed to save stream response to DB:", err.message);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  };

  const onError = async (err) => {
    console.error("Stream emission failed, error:", err.message);
    if (user) {
      try {
        await prisma.query.create({
          data: {
            userId: user.id,
            queryText: message.substring(0, 255),
            response: err.message,
            status: "FAILED",
          },
        }).catch(() => null);
      } catch (dbErr) {}
    }
    res.write(`data: ${JSON.stringify({ token: "\nError generating response." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  };

  try {
    if (model.startsWith("groq-")) {
      await groqService.generateChatStream(model, systemPrompt, message, chatHistory, onToken, onDone, onError);
    } else if (model.startsWith("ollama-")) {
      await ollamaService.generateChatStream(model, systemPrompt, message, chatHistory, onToken, onDone, onError);
    } else if (model.startsWith("openrouter-")) {
      await openrouterService.generateChatStream(model, systemPrompt, message, chatHistory, onToken, onDone, onError);
    } else {
      await geminiService.generateChatStream(model, systemPrompt, message, chatHistory, onToken, onDone, onError);
    }
  } catch (error) {
    console.error("Chat stream root error:", error.message);
    res.write(`data: ${JSON.stringify({ token: "\nError establishing connection." })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Run Build Log Diagnostics & Code Patch Generation
router.post("/diagnose", async (req, res) => {
  try {
    const { logText, documentId, model } = req.body;
    let textToDiagnose = logText;

    if (documentId) {
      const doc = mockDocuments.find(d => d.id === documentId);
      if (doc) {
        const filePath = path.join(__dirname, "../../../", doc.fileUrl);
        if (fs.existsSync(filePath)) {
          textToDiagnose = fs.readFileSync(filePath, "utf-8");
        }
      }
    }

    if (!textToDiagnose) {
      return res.status(400).json({ error: "No log content available for diagnosis." });
    }

    let diagnosis;
    if (model && model.startsWith("groq-")) {
      diagnosis = await groqService.diagnoseLog(model, textToDiagnose);
    } else if (model && model.startsWith("ollama-")) {
      diagnosis = await ollamaService.diagnoseLog(model, textToDiagnose);
    } else if (model && model.startsWith("openrouter-")) {
      diagnosis = await openrouterService.diagnoseLog(model, textToDiagnose);
    } else {
      diagnosis = await geminiService.diagnoseLog(textToDiagnose);
    }
    
    res.status(200).json(diagnosis);
  } catch (error) {
    console.error("AI Diagnostics route error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Web Research & Summarizer Endpoint
router.post("/research", async (req, res) => {
  try {
    const { topic, depth, model } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    let researchResult;
    if (model && model.startsWith("groq-")) {
      researchResult = await groqService.generateResearchSummary(model, topic, depth || "quick");
    } else if (model && model.startsWith("ollama-")) {
      researchResult = await ollamaService.generateResearchSummary(model, topic, depth || "quick");
    } else if (model && model.startsWith("openrouter-")) {
      researchResult = await openrouterService.generateResearchSummary(model, topic, depth || "quick");
    } else {
      researchResult = await geminiService.generateResearchSummary(topic, depth || "quick");
    }

    res.status(200).json({
      topic,
      summary: researchResult.summary,
      citations: researchResult.citations,
    });
  } catch (error) {
    console.error("AI Research route error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
