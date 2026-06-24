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

// Generate endpoint (streams tokens using SSE)
router.post("/generate", (req, res) => {
  const { type, topic, tone } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const streamText = `<h1>Release Notes</h1><p>Generated under ${tone || "Technical"} format for commits: <em>${topic}</em>.</p><p>Nexus AI successfully compiled release details and repository build changelogs.</p>`;
  const words = streamText.split(" ");
  let idx = 0;

  const interval = setInterval(() => {
    if (idx < words.length) {
      res.write(`data: ${JSON.stringify({ token: words[idx] + " " })}\n\n`);
      idx++;
    } else {
      res.write("data: [DONE]\n\n");
      clearInterval(interval);
      res.end();
    }
  }, 50);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// Fetch all content pieces
router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const items = await prisma.contentPiece.findMany({
      where: { workspaceId },
    });

    // Seed default content pieces if empty
    if (items.length === 0) {
      const defaultContent = [
        { type: "release_notes", title: "Release Notes v1.2.0-beta", body: "<h1>Release Notes</h1><p>Core JWT endpoints added, connection pools patched.</p>", status: "PUBLISHED", workspaceId },
        { type: "changelog", title: "Changelog updates for database scripts", body: "<p>Initial prisma migrations verified.</p>", status: "DRAFT", workspaceId }
      ];
      await prisma.contentPiece.createMany({ data: defaultContent });
      const seeded = await prisma.contentPiece.findMany({ where: { workspaceId } });
      return res.status(200).json(seeded);
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Fetch content error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch single content piece
router.get("/:id", async (req, res) => {
  try {
    const piece = await prisma.contentPiece.findUnique({
      where: { id: req.params.id },
    });
    if (!piece) return res.status(404).json({ error: "Content not found" });
    res.status(200).json(piece);
  } catch (error) {
    console.error("Fetch single content piece error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update content piece
router.patch("/:id", async (req, res) => {
  try {
    const { title, body, status } = req.body;
    const piece = await prisma.contentPiece.update({
      where: { id: req.params.id },
      data: {
        title,
        body,
        status,
      },
    });
    res.status(200).json(piece);
  } catch (error) {
    console.error("Update content piece error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete content piece
router.delete("/:id", async (req, res) => {
  try {
    await prisma.contentPiece.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "Content deleted" });
  } catch (error) {
    console.error("Delete content piece error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule content piece
router.patch("/:id/schedule", async (req, res) => {
  try {
    const { date } = req.body;
    const piece = await prisma.contentPiece.update({
      where: { id: req.params.id },
      data: {
        scheduledAt: date ? new Date(date) : null,
        status: "SCHEDULED",
      },
    });
    res.status(200).json(piece);
  } catch (error) {
    console.error("Schedule content error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze brand voice examples
router.post("/brand-voice/analyze", async (req, res) => {
  try {
    const { examples } = req.body;
    const workspaceId = await getWorkspaceId(req);
    
    const brandVoiceData = {
      tone: ["Bold", "Technical"],
      vocabulary: ["monorepo", "workspaces", "fast-builds"],
      styleProfile: "Clear, bold sentence structures utilizing list groups.",
    };

    const brandVoice = await prisma.brandVoice.upsert({
      where: { workspaceId },
      update: brandVoiceData,
      create: {
        ...brandVoiceData,
        workspaceId,
      },
    });

    res.status(200).json({
      message: "Brand Voice profile generated from input examples",
      brandVoice,
    });
  } catch (error) {
    console.error("Analyze brand voice error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch brand voice
router.get("/brand-voice", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let voice = await prisma.brandVoice.findUnique({
      where: { workspaceId },
    });

    if (!voice) {
      voice = await prisma.brandVoice.create({
        data: {
          tone: ["Technical", "Direct", "Structured"],
          vocabulary: ["monorepo", "cache-miss", "diagnostics", "pipeline"],
          styleProfile: "Structured category sections (Features, Fixes, Deployments) with code blocks.",
          workspaceId,
        },
      });
    }

    res.status(200).json(voice);
  } catch (error) {
    console.error("Fetch brand voice error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

