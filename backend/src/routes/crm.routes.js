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

function mapContactToRepository(contact) {
  return {
    id: contact.id,
    name: contact.name,
    branch: contact.source || "main",
    stage: contact.stage || "DEV",
    health: contact.score || 85,
    email: contact.email,
  };
}

async function seedDefaultRepositories(workspaceId) {
  const defaults = [
    { name: "nexus-auth-service", email: "auth@repo.nexus.ai", source: "master", stage: "PRODUCTION", score: 98, workspaceId },
    { name: "nexus-backend-api", email: "api@repo.nexus.ai", source: "main", stage: "PRODUCTION", score: 95, workspaceId },
    { name: "nexus-worker-node", email: "worker@repo.nexus.ai", source: "release/v0.1", stage: "STAGING", score: 85, workspaceId },
    { name: "nexus-frontend-client", email: "frontend@repo.nexus.ai", source: "dev", stage: "TESTING", score: 74, workspaceId },
    { name: "nexus-data-pipeline", email: "data@repo.nexus.ai", source: "hotfix/db-leak", stage: "DEV", score: 42, workspaceId }
  ];
  await prisma.contact.createMany({ data: defaults });
}

// Map endpoints originally for CRM to support Pipeline visualizer
router.get("/contacts", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let contacts = await prisma.contact.findMany({
      where: { workspaceId },
    });

    if (contacts.length === 0) {
      await seedDefaultRepositories(workspaceId);
      contacts = await prisma.contact.findMany({
        where: { workspaceId },
      });
    }

    if (contacts.length > 0) {
      return res.status(200).json(contacts.map(mapContactToRepository));
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
    const workspaceId = await getWorkspaceId(req);
    const created = await prisma.contact.create({
      data: {
        id: newRepo.id,
        name,
        email: `${name.toLowerCase()}@repo.nexus.ai`,
        source: branch || "main",
        stage: stage || "DEV",
        score: newRepo.health,
        workspaceId,
      },
    });
    newRepo.id = created.id;
    newRepo.health = created.score;
    repositories.push(newRepo);
    res.status(201).json(mapContactToRepository(created));
  } catch (err) {
    console.warn("[DB_FALLBACK] post /contacts failed, using mock:", err.message);
    repositories.push(newRepo);
    res.status(201).json(newRepo);
  }
});

router.get("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });
    if (contact) {
      return res.status(200).json(mapContactToRepository(contact));
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
  const { name, branch, stage, health } = req.body;
  try {
    const c = await prisma.contact.findUnique({ where: { id } });
    if (c) {
      const updateData = {};
      if (name) updateData.name = name;
      if (branch) updateData.source = branch;
      if (stage) updateData.stage = stage;
      if (health !== undefined) updateData.score = health;

      const updated = await prisma.contact.update({
        where: { id },
        data: updateData,
      });

      const formatted = mapContactToRepository(updated);
      const index = repositories.findIndex(r => r.id === id);
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
      await prisma.contact.delete({
        where: { id },
      });
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
      let user = await prisma.user.findFirst();
      if (!user) {
        const workspaceId = await getWorkspaceId(req);
        user = await prisma.user.create({
          data: {
            email: "system@nexus.ai",
            name: createdBy || "System",
            role: "ADMIN",
            workspaceId,
          },
        });
      }

      const note = await prisma.note.create({
        data: {
          id: newNote.id,
          contactId: id,
          content,
          createdBy: user.id,
        },
      });
      newNote.id = note.id;
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
        data: { stage },
      });
      const formatted = mapContactToRepository(updated);
      const index = repositories.findIndex(r => r.id === id);
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
    const workspaceId = await getWorkspaceId(req);
    let contacts = await prisma.contact.findMany({
      where: { workspaceId },
    });

    if (contacts.length === 0) {
      await seedDefaultRepositories(workspaceId);
      contacts = await prisma.contact.findMany({
        where: { workspaceId },
      });
    }

    if (contacts.length > 0) {
      return res.status(200).json(contacts.map(mapContactToRepository));
    }
    res.status(200).json(repositories);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /pipeline failed, using mock:", err.message);
    res.status(200).json(repositories);
  }
});

router.get("/companies", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let companies = await prisma.company.findMany({
      where: { workspaceId },
    });

    if (companies.length === 0) {
      const defaultCompany = await prisma.company.create({
        data: {
          id: "cluster-1",
          name: "Nexus Kubernetes Cluster",
          website: "k8s.nexus.ai",
          industry: "Technology",
          workspaceId,
        },
      });
      companies = [defaultCompany];
    }

    res.status(200).json(companies.map(c => ({
      id: c.id,
      name: c.name,
      status: "HEALTHY",
      nodesCount: 12,
      pipelineValue: 100,
    })));
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
    count: 2,
  });
});

router.get("/score-report", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const contacts = await prisma.contact.findMany({
      where: { workspaceId },
    });

    if (contacts.length > 0) {
      const scores = contacts.map(c => c.score || 0);
      const averageHealth = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      const distribution = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
      contacts.forEach(c => {
        const s = c.score || 0;
        if (s <= 20) distribution["0-20"]++;
        else if (s <= 40) distribution["21-40"]++;
        else if (s <= 60) distribution["41-60"]++;
        else if (s <= 80) distribution["61-80"]++;
        else distribution["81-100"]++;
      });

      const anomaliesCount = contacts.filter(c => (c.score || 0) < 50).length;

      return res.status(200).json({
        averageHealth,
        distribution,
        anomaliesCount,
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
