const express = require("express");
const router = express.Router();
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

// Local in-memory list of documents for developmental simulation
let mockDocuments = [
  { id: "log-1", name: "startnode_missing_script.log", fileUrl: "/uploads/mock-1.log", status: "READY", createdAt: new Date() },
  { id: "log-2", name: "typescript_type_error.log", fileUrl: "/uploads/mock-2.log", status: "READY", createdAt: new Date() },
  { id: "log-3", name: "supabase_pool_timeout.log", fileUrl: "/uploads/mock-3.log", status: "READY", createdAt: new Date() }
];

// Fetch all documents
router.get("/", (req, res) => {
  res.status(200).json(mockDocuments);
});

// Upload document
router.post("/upload", upload.single("file"), (req, res) => {
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

    mockDocuments.push(newDoc);
    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch single document
router.get("/:id", (req, res) => {
  const doc = mockDocuments.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.status(200).json(doc);
});

// Query document
router.post("/:id/query", (req, res) => {
  const { query } = req.body;
  const doc = mockDocuments.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  res.status(200).json({
    answer: `This is a mock answer about your document "${doc.name}" regarding query: "${query}".`,
    references: ["Mock Reference Chunk 1", "Mock Reference Chunk 2"]
  });
});

// Delete document
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const docIndex = mockDocuments.findIndex(d => d.id === id);
  if (docIndex > -1) {
    const doc = mockDocuments[docIndex];
    if (doc.fileUrl.startsWith("/uploads/")) {
      const filePath = path.join(uploadDir, doc.fileUrl.replace("/uploads/", ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    mockDocuments.splice(docIndex, 1);
  }
  res.status(200).json({ message: "Document removed" });
});

module.exports = router;
