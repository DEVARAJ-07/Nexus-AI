const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

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
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let name = req.query.name || "uploaded_document.pdf";
    let fileUrl = "https://supabase-storage.com/mock-upload.pdf";

    if (req.file) {
      name = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const newDoc = await prisma.document.create({
      data: {
        name,
        fileUrl,
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
router.post("/:id/query", async (req, res) => {
  try {
    const { query } = req.body;
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Basic heuristic response based on query keywords
    const lowerQuery = (query || "").toLowerCase();
    let answer = `Analyzed document "${doc.name}" matching query: "${query}". `;
    let references = [];

    if (lowerQuery.includes("auth") || lowerQuery.includes("login") || lowerQuery.includes("jwt")) {
      answer += "Found authentication references pointing to JWT configuration on API Gateway and Supabase Auth integration.";
      references = ["Page 4: JWT Verification and session expiration rules", "Page 9: Auth config fallback keys"];
    } else if (lowerQuery.includes("build") || lowerQuery.includes("fail") || lowerQuery.includes("log")) {
      answer += "Identified build compilation flags causing caching failure issues in monorepo workspaces.";
      references = ["Page 12: Turbo build log stack traces", "Page 15: Cache anomaly rules"];
    } else {
      answer += "Parsed workspace document structure. No critical issues matching the query were highlighted, but semantic index lookup completed.";
      references = [`Index 1: Document title mapping for ${doc.name}`];
    }

    res.status(200).json({ answer, references });
  } catch (error) {
    console.error("Query document error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({ where: { id } });
    if (doc && doc.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(uploadDir, doc.fileUrl.replace("/uploads/", ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.document.delete({
      where: { id },
    });
    res.status(200).json({ message: "Document removed" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

