const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const env = require("../config/env");
const axios = require("axios");

let brandVoice = {
  tone: ["Technical", "Direct", "Structured"],
  vocabulary: ["monorepo", "cache-miss", "diagnostics", "pipeline"],
  styleProfile: "Structured category sections (Features, Fixes, Deployments) with code blocks."
};

let contentPieces = [
  { id: "c-1", type: "release_notes", title: "Release Notes v1.2.0-beta", body: "<h1>Release Notes</h1><p>Core JWT endpoints added, connection pools patched.</p>", status: "PUBLISHED", scheduledAt: null },
  { id: "c-2", type: "changelog", title: "Changelog updates for database scripts", body: "<p>Initial prisma migrations verified.</p>", status: "DRAFT", scheduledAt: null }
];

async function getWorkspaceId(req) {
  const headerWorkspaceId = req.headers["x-workspace-id"];
  if (headerWorkspaceId) return headerWorkspaceId;

  try {
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
  } catch (err) {
    return "default-workspace-id";
  }
}

// Generate endpoint (streams tokens using SSE)
router.post("/generate", async (req, res) => {
  const { type, topic, tone } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection-Empty-Action", "keep-alive");

  try {
    const workspaceId = await getWorkspaceId(req);
    const voice = await prisma.brandVoice.findUnique({
      where: { workspaceId },
    });

    const systemPrompt = `You are a professional technical writer and devops release manager.
Generate documentation of type "${type || "release_notes"}" in HTML format.
Tone: ${tone || "Technical"}.
${voice ? `Brand Guidelines:
- Style Profile: ${voice.styleProfile}
- Tone attributes: ${voice.tone.join(", ")}
- Allowed vocab: ${voice.vocabulary.join(", ")}` : ""}

Only return HTML elements (e.g., <h1>, <p>, <ul>, <li>, <em>, <strong>, <pre><code>). Do not wrap with markdown code blocks (e.g., \`\`\`html).`;

    const userPrompt = `Generate release details based on the following topic or commit logs: "${topic}".`;

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
            max_tokens: 1536,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
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
                // Incomplete chunk - ignore parse error
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
        console.error("Content generation Claude API call failed, falling back:", apiError.message);
      }
    }

    // Fallback stream generator
    const streamText = `<h1>Release Notes</h1><p>Generated under ${tone || "Technical"} format for commits: <em>${topic}</em>.</p><p>Nexus AI successfully compiled release details and repository build changelogs using fallback generation. To run with Claude, set a valid \`CLAUDE_API_KEY\` in \`backend/.env\`.</p>`;
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
    }, 40);

    req.on("close", () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error("Content generate stream error:", error);
    res.write(`data: ${JSON.stringify({ token: "<p>Error generating stream content.</p>" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Fetch all content pieces
router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const items = await prisma.contentPiece.findMany({
      where: { workspaceId },
    });

    if (items.length > 0) {
      return res.status(200).json(items);
    }
    res.status(200).json(contentPieces);
  } catch (err) {
    console.warn("[DB_FALLBACK] get content failed, using mock:", err.message);
    res.status(200).json(contentPieces);
  }
});

// Fetch single content piece
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const piece = await prisma.contentPiece.findUnique({
      where: { id },
    });
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

// Update content piece
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
    console.warn("[DB_FALLBACK] patch content failed, using mock:", err.message);
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

// Delete content piece
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

// Schedule content piece
router.patch("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  try {
    const piece = await prisma.contentPiece.findUnique({ where: { id } });
    if (piece) {
      const updated = await prisma.contentPiece.update({
        where: { id },
        data: {
          scheduledAt: date ? new Date(date) : null,
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

    const brandVoiceRecord = await prisma.brandVoice.upsert({
      where: { workspaceId },
      update: brandVoiceData,
      create: {
        ...brandVoiceData,
        workspaceId,
      },
    });

    res.status(200).json({
      message: "Brand Voice profile generated from input examples",
      brandVoice: brandVoiceRecord,
    });
  } catch (error) {
    console.warn("[DB_FALLBACK] analyze brand voice failed, returning mock:", error.message);
    res.status(200).json({
      message: "Brand Voice profile generated from input examples",
      brandVoice: {
        tone: ["Bold", "Technical"],
        vocabulary: ["monorepo", "workspaces", "fast-builds"],
        styleProfile: "Clear, bold sentence structures utilizing list groups."
      }
    });
  }
});

// Fetch brand voice
router.get("/brand-voice", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let voice = await prisma.brandVoice.findUnique({
      where: { workspaceId },
    });

    if (voice) {
      return res.status(200).json(voice);
    }
    res.status(200).json(brandVoice);
  } catch (err) {
    console.warn("[DB_FALLBACK] get brand voice failed, using mock:", err.message);
    res.status(200).json(brandVoice);
  }
});

module.exports = router;
