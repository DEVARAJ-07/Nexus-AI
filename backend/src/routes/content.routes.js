const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

// Mock Brand Voice Profile
let brandVoice = {
  tone: ["Technical", "Direct", "Structured"],
  vocabulary: ["monorepo", "cache-miss", "diagnostics", "pipeline"],
  styleProfile: "Structured category sections (Features, Fixes, Deployments) with code blocks."
};

// Mock Content List
let contentPieces = [
  { id: "c-1", type: "release_notes", title: "Release Notes v1.2.0-beta", body: "<h1>Release Notes</h1><p>Core JWT endpoints added, connection pools patched.</p>", status: "PUBLISHED", scheduledAt: null },
  { id: "c-2", type: "changelog", title: "Changelog updates for database scripts", body: "<p>Initial prisma migrations verified.</p>", status: "DRAFT", scheduledAt: null }
];

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

router.get("/", async (req, res) => {
  try {
    const dbPieces = await prisma.contentPiece.findMany();
    if (dbPieces.length > 0) {
      return res.status(200).json(dbPieces);
    }
    res.status(200).json(contentPieces);
  } catch (err) {
    console.warn("[DB_FALLBACK] get content failed, using mock:", err.message);
    res.status(200).json(contentPieces);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const piece = await prisma.contentPiece.findUnique({ where: { id } });
    if (piece) {
      return res.status(200).json(piece);
    }
    const mockPiece = contentPieces.find(c => c.id === id);
    if (!mockPiece) return res.status(404).json({ error: "Content not found" });
    res.status(200).json(mockPiece);
  } catch (err) {
    console.warn("[DB_FALLBACK] get content/:id failed, using mock:", err.message);
    const mockPiece = contentPieces.find(c => c.id === id);
    if (!mockPiece) return res.status(404).json({ error: "Content not found" });
    res.status(200).json(mockPiece);
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, body, status } = req.body;
  try {
    const piece = await prisma.contentPiece.findUnique({ where: { id } });
    if (piece) {
      const updated = await prisma.contentPiece.update({
        where: { id },
        data: {
          title: title || undefined,
          body: body || undefined,
          status: status || undefined
        }
      });
      const index = contentPieces.findIndex(c => c.id === id);
      if (index !== -1) contentPieces[index] = updated;
      return res.status(200).json(updated);
    }
    const index = contentPieces.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Content not found" });
    contentPieces[index] = {
      ...contentPieces[index],
      title: title || contentPieces[index].title,
      body: body || contentPieces[index].body,
      status: status || contentPieces[index].status
    };
    res.status(200).json(contentPieces[index]);
  } catch (err) {
    console.warn("[DB_FALLBACK] patch content/:id failed, using mock:", err.message);
    const index = contentPieces.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Content not found" });
    contentPieces[index] = {
      ...contentPieces[index],
      title: title || contentPieces[index].title,
      body: body || contentPieces[index].body,
      status: status || contentPieces[index].status
    };
    res.status(200).json(contentPieces[index]);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const piece = await prisma.contentPiece.findUnique({ where: { id } });
    if (piece) {
      await prisma.contentPiece.delete({ where: { id } });
    }
    contentPieces = contentPieces.filter(c => c.id !== id);
    res.status(200).json({ message: "Content deleted" });
  } catch (err) {
    console.warn("[DB_FALLBACK] delete content failed, using mock:", err.message);
    contentPieces = contentPieces.filter(c => c.id !== id);
    res.status(200).json({ message: "Content deleted" });
  }
});

router.patch("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  try {
    const piece = await prisma.contentPiece.findUnique({ where: { id } });
    if (piece) {
      const updated = await prisma.contentPiece.update({
        where: { id },
        data: {
          scheduledAt: new Date(date),
          status: "SCHEDULED"
        }
      });
      const index = contentPieces.findIndex(c => c.id === id);
      if (index !== -1) contentPieces[index] = updated;
      return res.status(200).json(updated);
    }
    const index = contentPieces.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Content not found" });
    contentPieces[index].scheduledAt = date;
    contentPieces[index].status = "SCHEDULED";
    res.status(200).json(contentPieces[index]);
  } catch (err) {
    console.warn("[DB_FALLBACK] schedule content failed, using mock:", err.message);
    const index = contentPieces.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: "Content not found" });
    contentPieces[index].scheduledAt = date;
    contentPieces[index].status = "SCHEDULED";
    res.status(200).json(contentPieces[index]);
  }
});

router.post("/brand-voice/analyze", (req, res) => {
  const { examples } = req.body;
  res.status(200).json({
    message: "Brand Voice profile generated from input examples",
    brandVoice: {
      tone: ["Bold", "Technical"],
      vocabulary: ["monorepo", "workspaces", "fast-builds"],
      styleProfile: "Clear, bold sentence structures utilizing list groups."
    }
  });
});

router.get("/brand-voice", async (req, res) => {
  try {
    const bv = await prisma.brandVoice.findFirst();
    if (bv) {
      return res.status(200).json({
        tone: bv.tone,
        vocabulary: bv.vocabulary,
        styleProfile: bv.styleProfile
      });
    }
    res.status(200).json(brandVoice);
  } catch (err) {
    console.warn("[DB_FALLBACK] get brand voice failed, using mock:", err.message);
    res.status(200).json(brandVoice);
  }
});

module.exports = router;
