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

// Fetch all documents
router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let items = await prisma.document.findMany({
      where: { workspaceId },
    });

    // Seed default documents if empty
    if (items.length === 0) {
      const defaults = [
        { name: "nexus_architecture_spec.pdf", fileUrl: "https://supabase-storage.com/doc-1.pdf", status: "READY", workspaceId },
        { name: "nexus_build_log_failures.log", fileUrl: "https://supabase-storage.com/doc-2.log", status: "READY", workspaceId }
      ];
      await prisma.document.createMany({ data: defaults });
      items = await prisma.document.findMany({ where: { workspaceId } });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post("/upload", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const newDoc = await prisma.document.create({
      data: {
        name: req.query.name || "uploaded_document.pdf",
        fileUrl: "https://supabase-storage.com/mock-upload.pdf",
        status: "READY",
        workspaceId,
      },
    });
    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch single document
router.get("/:id", async (req, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.status(200).json(doc);
  } catch (error) {
    console.error("Fetch single document error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Query document
router.post("/:id/query", (req, res) => {
  const { query } = req.body;
  res.status(200).json({
    answer: `This is a mock answer responding to: "${query}". Based on semantic chunk analysis from Pinecone vector retrievals.`,
    references: ["Page 2: Marketing channels target audience", "Page 5: Budget constraints"],
  });
});

// Delete document
router.delete("/:id", async (req, res) => {
  try {
    await prisma.document.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "Document removed" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

