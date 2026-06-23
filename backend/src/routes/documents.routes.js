const express = require("express");
const router = express.Router();

let documents = [
  { id: "doc-1", name: "Q1_Marketing_Strategy.pdf", fileUrl: "https://supabase-storage.com/doc-1.pdf", status: "READY" },
  { id: "doc-2", name: "Outpost_User_Feedback.csv", fileUrl: "https://supabase-storage.com/doc-2.csv", status: "READY" }
];

router.get("/", (req, res) => {
  res.status(200).json(documents);
});

router.post("/upload", (req, res) => {
  const newDoc = {
    id: `doc-${Date.now()}`,
    name: req.query.name || "uploaded_document.pdf",
    fileUrl: "https://supabase-storage.com/mock-upload.pdf",
    status: "READY"
  };
  documents.push(newDoc);
  res.status(201).json(newDoc);
});

router.get("/:id", (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.status(200).json(doc);
});

router.post("/:id/query", (req, res) => {
  const { query } = req.body;
  res.status(200).json({
    answer: `This is a mock answer responding to: "${query}". Based on semantic chunk analysis from Pinecone vector retrievals.`,
    references: ["Page 2: Marketing channels target audience", "Page 5: Budget constraints"]
  });
});

router.delete("/:id", (req, res) => {
  documents = documents.filter(d => d.id !== req.params.id);
  res.status(200).json({ message: "Document removed" });
});

module.exports = router;
