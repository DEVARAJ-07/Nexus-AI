const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

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
router.get("/contacts", async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    if (contacts.length > 0) {
      const formatted = contacts.map(c => ({
        id: c.id,
        name: c.name,
        branch: c.source || "main",
        stage: c.stage,
        health: c.score
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json(repositories);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /contacts failed, using mock:", err.message);
    res.status(200).json(repositories);
  }
});

router.post("/contacts", async (req, res) => {
  const { name, branch, stage } = req.body;
  const newRepo = {
    id: `repo-${Date.now()}`,
    name,
    branch: branch || "main",
    stage: stage || "DEV",
    health: Math.floor(Math.random() * 30) + 70
  };
  try {
    const ws = await prisma.workspace.findFirst();
    if (ws) {
      const created = await prisma.contact.create({
        data: {
          id: newRepo.id,
          name,
          email: `${name}@nexus-ci.com`,
          source: branch || "main",
          stage: stage || "DEV",
          score: newRepo.health,
          workspaceId: ws.id
        }
      });
      newRepo.id = created.id;
      newRepo.health = created.score;
    }
    repositories.push(newRepo);
    res.status(201).json(newRepo);
  } catch (err) {
    console.warn("[DB_FALLBACK] post /contacts failed, using mock:", err.message);
    repositories.push(newRepo);
    res.status(201).json(newRepo);
  }
});

router.get("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      return res.status(200).json({
        id: c.id,
        name: c.name,
        branch: c.source || "main",
        stage: c.stage,
        health: c.score
      });
    }
    const repo = repositories.find(r => r.id === id);
    if (!repo) return res.status(404).json({ error: "Repository not found" });
    res.status(200).json(repo);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /contacts/:id failed, using mock:", err.message);
    const repo = repositories.find(r => r.id === id);
    if (!repo) return res.status(404).json({ error: "Repository not found" });
    res.status(200).json(repo);
  }
});

router.patch("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.branch) updateData.source = req.body.branch;
      if (req.body.stage) updateData.stage = req.body.stage;
      if (req.body.health !== undefined) updateData.score = req.body.health;

      const updated = await prisma.contact.update({
        where: { id },
        data: updateData
      });
      const index = repositories.findIndex(r => r.id === id);
      const formatted = {
        id: updated.id,
        name: updated.name,
        branch: updated.source || "main",
        stage: updated.stage,
        health: updated.score
      };
      if (index !== -1) repositories[index] = formatted;
      return res.status(200).json(formatted);
    }
    const index = repositories.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Repository not found" });
    repositories[index] = { ...repositories[index], ...req.body };
    res.status(200).json(repositories[index]);
  } catch (err) {
    console.warn("[DB_FALLBACK] patch /contacts/:id failed, using mock:", err.message);
    const index = repositories.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Repository not found" });
    repositories[index] = { ...repositories[index], ...req.body };
    res.status(200).json(repositories[index]);
  }
});

router.delete("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      await prisma.contact.delete({ where: { id } });
    }
    repositories = repositories.filter(r => r.id !== id);
    res.status(200).json({ message: "Repository removed" });
  } catch (err) {
    console.warn("[DB_FALLBACK] delete /contacts/:id failed, using mock:", err.message);
    repositories = repositories.filter(r => r.id !== id);
    res.status(200).json({ message: "Repository removed" });
  }
});

router.post("/contacts/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { content, createdBy } = req.body;
  const newNote = {
    id: `n-${Date.now()}`,
    repoId: id,
    content,
    createdBy: createdBy || "System",
    createdAt: new Date()
  };
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      const created = await prisma.note.create({
        data: {
          id: newNote.id,
          contactId: id,
          content,
          createdBy: "default-user-id"
        }
      });
      newNote.id = created.id;
    }
    pipelineNotes.push(newNote);
    res.status(201).json(newNote);
  } catch (err) {
    console.warn("[DB_FALLBACK] post note failed, using mock:", err.message);
    pipelineNotes.push(newNote);
    res.status(201).json(newNote);
  }
});

router.patch("/contacts/:id/stage", async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      const updated = await prisma.contact.update({
        where: { id },
        data: { stage }
      });
      const index = repositories.findIndex(r => r.id === id);
      const formatted = {
        id: updated.id,
        name: updated.name,
        branch: updated.source || "main",
        stage: updated.stage,
        health: updated.score
      };
      if (index !== -1) repositories[index] = formatted;
      return res.status(200).json(formatted);
    }
    const index = repositories.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Repository not found" });
    repositories[index].stage = stage;
    res.status(200).json(repositories[index]);
  } catch (err) {
    console.warn("[DB_FALLBACK] patch stage failed, using mock:", err.message);
    const index = repositories.findIndex(r => r.id === id);
    if (index === -1) return res.status(404).json({ error: "Repository not found" });
    repositories[index].stage = stage;
    res.status(200).json(repositories[index]);
  }
});

router.get("/pipeline", async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    if (contacts.length > 0) {
      const formatted = contacts.map(c => ({
        id: c.id,
        name: c.name,
        branch: c.source || "main",
        stage: c.stage,
        health: c.score
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json(repositories);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /pipeline failed, using mock:", err.message);
    res.status(200).json(repositories);
  }
});

router.get("/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    if (companies.length > 0) {
      const formatted = companies.map(comp => ({
        id: comp.id,
        name: comp.name,
        status: comp.website || "HEALTHY",
        nodesCount: 12,
        pipelineValue: 100
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json([
      { id: "cluster-1", name: "Nexus Kubernetes Cluster", status: "HEALTHY", nodesCount: 12, pipelineValue: 100 }
    ]);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /companies failed, using mock:", err.message);
    res.status(200).json([
      { id: "cluster-1", name: "Nexus Kubernetes Cluster", status: "HEALTHY", nodesCount: 12, pipelineValue: 100 }
    ]);
  }
});

router.post("/import", (req, res) => {
  res.status(200).json({
    message: "Repositories imported successfully",
    count: 2
  });
});

router.get("/score-report", async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany();
    if (contacts.length > 0) {
      const totalHealth = contacts.reduce((sum, c) => sum + c.score, 0);
      const avg = Math.round(totalHealth / contacts.length);
      const distribution = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
      let anomalies = 0;
      contacts.forEach(c => {
        if (c.score <= 20) distribution["0-20"]++;
        else if (c.score <= 40) distribution["21-40"]++;
        else if (c.score <= 60) distribution["41-60"]++;
        else if (c.score <= 80) distribution["61-80"]++;
        else distribution["81-100"]++;

        if (c.score < 50) anomalies++;
      });
      return res.status(200).json({
        averageHealth: avg,
        distribution,
        anomaliesCount: anomalies
      });
    }
    res.status(200).json({
      averageHealth: 88,
      distribution: { "0-20": 0, "21-40": 1, "41-60": 0, "61-80": 1, "81-100": 3 },
      anomaliesCount: 1
    });
  } catch (err) {
    console.warn("[DB_FALLBACK] get /score-report failed, using mock:", err.message);
    res.status(200).json({
      averageHealth: 88,
      distribution: { "0-20": 0, "21-40": 1, "41-60": 0, "61-80": 1, "81-100": 3 },
      anomaliesCount: 1
    });
  }
});

module.exports = router;
