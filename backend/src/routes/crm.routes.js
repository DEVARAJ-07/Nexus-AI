const express = require("express");
const router = express.Router();

let repositories = [
  { id: "repo-1", name: "nexus-auth-service", branch: "master", stage: "PRODUCTION", health: 98 },
  { id: "repo-2", name: "nexus-backend-api", branch: "main", stage: "PRODUCTION", health: 95 },
  { id: "repo-3", name: "nexus-worker-node", branch: "release/v0.1", stage: "STAGING", health: 85 },
  { id: "repo-4", name: "nexus-frontend-client", branch: "dev", stage: "TESTING", health: 74 },
  { id: "repo-5", name: "nexus-data-pipeline", branch: "hotfix/db-leak", stage: "DEV", health: 42 }
];

let pipelineNotes = [
  { id: "n-1", repoId: "repo-1", content: "Applied hotfix for DB pool leak. Checked connection limits.", createdBy: "Alex", createdAt: new Date() }
];

// Map endpoints originally for CRM to support Pipeline visualizer
router.get("/contacts", (req, res) => {
  res.status(200).json(repositories);
});

router.post("/contacts", (req, res) => {
  const { name, branch, stage } = req.body;
  const newRepo = {
    id: `repo-${Date.now()}`,
    name,
    branch: branch || "main",
    stage: stage || "DEV",
    health: Math.floor(Math.random() * 30) + 70
  };
  repositories.push(newRepo);
  res.status(201).json(newRepo);
});

router.get("/contacts/:id", (req, res) => {
  const repo = repositories.find(r => r.id === req.params.id);
  if (!repo) return res.status(404).json({ error: "Repository not found" });
  res.status(200).json(repo);
});

router.patch("/contacts/:id", (req, res) => {
  const index = repositories.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Repository not found" });

  repositories[index] = { ...repositories[index], ...req.body };
  res.status(200).json(repositories[index]);
});

router.delete("/contacts/:id", (req, res) => {
  repositories = repositories.filter(r => r.id !== req.params.id);
  res.status(200).json({ message: "Repository removed" });
});

router.post("/contacts/:id/notes", (req, res) => {
  const { content, createdBy } = req.body;
  const newNote = {
    id: `n-${Date.now()}`,
    repoId: req.params.id,
    content,
    createdBy: createdBy || "System",
    createdAt: new Date()
  };
  pipelineNotes.push(newNote);
  res.status(201).json(newNote);
});

router.patch("/contacts/:id/stage", (req, res) => {
  const { stage } = req.body;
  const index = repositories.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Repository not found" });

  repositories[index].stage = stage;
  res.status(200).json(repositories[index]);
});

router.get("/pipeline", (req, res) => {
  res.status(200).json(repositories);
});

router.get("/companies", (req, res) => {
  res.status(200).json([
    { id: "cluster-1", name: "Nexus Kubernetes Cluster", status: "HEALTHY", nodesCount: 12, pipelineValue: 100 }
  ]);
});

router.post("/import", (req, res) => {
  res.status(200).json({
    message: "Repositories imported successfully",
    count: 2
  });
});

router.get("/score-report", (req, res) => {
  res.status(200).json({
    averageHealth: 88,
    distribution: { "0-20": 0, "21-40": 1, "41-60": 0, "61-80": 1, "81-100": 3 },
    anomaliesCount: 1
  });
});

module.exports = router;
