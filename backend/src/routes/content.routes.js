const express = require("express");
const router = express.Router();

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

router.get("/", (req, res) => {
  res.status(200).json(contentPieces);
});

router.get("/:id", (req, res) => {
  const piece = contentPieces.find(c => c.id === req.params.id);
  if (!piece) return res.status(404).json({ error: "Content not found" });
  res.status(200).json(piece);
});

router.patch("/:id", (req, res) => {
  const { title, body, status } = req.body;
  const index = contentPieces.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Content not found" });
  
  contentPieces[index] = {
    ...contentPieces[index],
    title: title || contentPieces[index].title,
    body: body || contentPieces[index].body,
    status: status || contentPieces[index].status
  };
  
  res.status(200).json(contentPieces[index]);
});

router.delete("/:id", (req, res) => {
  contentPieces = contentPieces.filter(c => c.id !== req.params.id);
  res.status(200).json({ message: "Content deleted" });
});

router.patch("/:id/schedule", (req, res) => {
  const { date } = req.body;
  const index = contentPieces.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Content not found" });

  contentPieces[index].scheduledAt = date;
  contentPieces[index].status = "SCHEDULED";

  res.status(200).json(contentPieces[index]);
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

router.get("/brand-voice", (req, res) => {
  res.status(200).json(brandVoice);
});

module.exports = router;
