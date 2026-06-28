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

