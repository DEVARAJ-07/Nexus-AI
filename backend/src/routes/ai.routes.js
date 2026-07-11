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
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponseText = "";

  try {
    // 1. Resolve User from Database
    let user = await prisma.user.findFirst({
      where: { name: username }
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `${username}@github.com`,
          name: username
        }
      });
    }

    // 2. Resolve or Create Chat Session
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: chatId }
      });
    }
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: user.id,
          title: message.substring(0, 40)
        }
      });
    }

    // 3. Load Chat History
    const dbMessages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      take: 10
    });

    const chatHistory = dbMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 4. Save User Message to Database
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: message
      }
    });

    // 5. System prompt
    const systemPrompt = `You are Nexus AI, an advanced developer pipeline intelligence engine.
Your environment is fully connected to Supabase and GitHub.
You are chatting with developer: @${username} (User ID: ${user.id}) in Chat Session: ${chat.title}.
Analyze all diagnostic, code pipeline, and log questions directly and with code blocks.`;

    const onToken = (token) => {
      fullResponseText += token;
      res.write(`data: ${JSON.stringify({ token, chatId: chat.id })}\n\n`);
    };

    const onDone = async () => {
      try {
        // Save Assistant Message to Database
        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "assistant",
            content: fullResponseText
          }
        });

        // Save Log in Query Database
        await prisma.query.create({
          data: {
            userId: user.id,
            queryText: message.substring(0, 255),
            response: fullResponseText.substring(0, 1000),
            status: "COMPLETED"
          }
        });
      } catch (err) {
        console.error("Failed to save stream response to DB:", err);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    };

    const onError = async (err) => {
      console.error("Stream emission failed, error:", err);
      try {
        await prisma.query.create({
          data: {
            userId: user.id,
            queryText: message.substring(0, 255),
            response: err.message,
            status: "FAILED"
          }
        });
      } catch (dbErr) {
        console.error(dbErr);
      }
      res.write(`data: ${JSON.stringify({ token: "\nError generating response." })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    };

    // 6. Delegate stream invocation
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
    console.error("Chat stream root error:", error);
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
    console.error("AI Diagnostics route error:", error);
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
    console.error("Research API route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mock knowledge base endpoints for frontend safety
router.get("/knowledge", async (req, res) => {
  res.status(200).json([]);
});
router.post("/knowledge", async (req, res) => {
  res.status(201).json({ id: "mock-kb", title: req.body.title });
});
router.delete("/knowledge/:id", async (req, res) => {
  res.status(200).json({ message: "Knowledge item deleted" });
});

// Mock prompt template endpoints for frontend safety
router.get("/prompts", async (req, res) => {
  res.status(200).json([]);
});
router.post("/prompts", async (req, res) => {
  res.status(201).json({ id: "mock-prompt", title: req.body.title });
});

module.exports = router;
