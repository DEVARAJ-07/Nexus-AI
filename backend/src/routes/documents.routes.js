const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const prisma = require("../config/db");
const mockDocuments = require("../config/documentsStore");

const uploadDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Fetch all documents
router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const dbDocs = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    }).catch(() => []);

    if (dbDocs.length > 0) {
      return res.status(200).json(dbDocs);
    }
    res.status(200).json(mockDocuments);
  } catch (err) {
    res.status(200).json(mockDocuments);
  }
});

// Upload document
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let name = req.query.name || "uploaded_document.log";
    let fileUrl = "/uploads/mock-upload.log";

    if (req.file) {
      name = req.file.originalname;
      fileUrl = `/uploads/${req.file.filename}`;
    }

    const newDoc = {
      id: "doc-" + Date.now(),
      name,
      fileUrl,
      status: "READY",
      createdAt: new Date()
    };

    try {
      const workspaceId = await getWorkspaceId(req);
      const created = await prisma.document.create({
        data: {
          name,
          fileUrl,
          status: "READY",
          workspaceId
        }
      });
      newDoc.id = created.id;
      newDoc.createdAt = created.createdAt;
    } catch (dbErr) {
      console.warn("[DB_BYPASS] Document created in memory store:", dbErr.message);
    }

    mockDocuments.push(newDoc);
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
      where: { id: req.params.id }
    }).catch(() => null);

    if (doc) return res.status(200).json(doc);

    const mockDoc = mockDocuments.find(d => d.id === req.params.id);
    if (!mockDoc) return res.status(404).json({ error: "Document not found" });
    res.status(200).json(mockDoc);
  } catch (err) {
    const mockDoc = mockDocuments.find(d => d.id === req.params.id);
    if (!mockDoc) return res.status(404).json({ error: "Document not found" });
    res.status(200).json(mockDoc);
  }
});

// Query document
router.post("/:id/query", (req, res) => {
  const { query } = req.body;
  const doc = mockDocuments.find(d => d.id === req.params.id);
  res.status(200).json({
    answer: `Analysis for "${doc ? doc.name : req.params.id}" regarding query: "${query}".`,
    references: ["Code chunk 1", "Build Log trace 2"]
  });
});

// Delete document
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.document.delete({ where: { id } }).catch(() => null);
    const docIndex = mockDocuments.findIndex(d => d.id === id);
    if (docIndex > -1) {
      const doc = mockDocuments[docIndex];
      if (doc.fileUrl && doc.fileUrl.startsWith("/uploads/")) {
        const filePath = path.join(uploadDir, doc.fileUrl.replace("/uploads/", ""));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      mockDocuments.splice(docIndex, 1);
    }
    res.status(200).json({ message: "Document removed" });
  } catch (err) {
    res.status(200).json({ message: "Document removed" });
  }
});

module.exports = router;
