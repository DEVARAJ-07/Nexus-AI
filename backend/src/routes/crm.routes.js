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

// Map database Contact to DevOps Repository
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

// Seed default repositories if DB is empty
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

    res.status(200).json(contacts.map(mapContactToRepository));
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/contacts", async (req, res) => {
  try {
    const { name, branch, stage } = req.body;
    const workspaceId = await getWorkspaceId(req);
    
    const newContact = await prisma.contact.create({
      data: {
        name,
        email: `${name.toLowerCase()}@repo.nexus.ai`,
        source: branch || "main",
        stage: stage || "DEV",
        score: Math.floor(Math.random() * 30) + 70, // starting health
        workspaceId,
      },
    });

    res.status(201).json(mapContactToRepository(newContact));
  } catch (error) {
    console.error("Create contact error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/contacts/:id", async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
    });
    if (!contact) return res.status(404).json({ error: "Repository not found" });
    res.status(200).json(mapContactToRepository(contact));
  } catch (error) {
    console.error("Get contact error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/contacts/:id", async (req, res) => {
  try {
    const { name, branch, stage, health } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (branch) updateData.source = branch;
    if (stage) updateData.stage = stage;
    if (health !== undefined) updateData.score = health;

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.status(200).json(mapContactToRepository(contact));
  } catch (error) {
    console.error("Update contact error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/contacts/:id", async (req, res) => {
  try {
    await prisma.contact.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "Repository removed" });
  } catch (error) {
    console.error("Delete contact error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/contacts/:id/notes", async (req, res) => {
  try {
    const { content, createdBy } = req.body;
    
    // Find or create a user to link to note creation
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
        contactId: req.params.id,
        content,
        createdBy: user.id,
      },
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/contacts/:id/stage", async (req, res) => {
  try {
    const { stage } = req.body;
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: { stage },
    });
    res.status(200).json(mapContactToRepository(contact));
  } catch (error) {
    console.error("Update stage error:", error);
    res.status(500).json({ error: error.message });
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

    res.status(200).json(contacts.map(mapContactToRepository));
  } catch (error) {
    console.error("Get pipeline error:", error);
    res.status(500).json({ error: error.message });
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
          name: "Nexus Kubernetes Cluster",
          website: "k8s.nexus.ai",
          industry: "Technology",
          workspaceId,
        },
      });
      companies = [defaultCompany];
    }

    // Map company to dashboard cluster stats expected by frontend
    res.status(200).json(companies.map(c => ({
      id: c.id,
      name: c.name,
      status: "HEALTHY",
      nodesCount: 12,
      pipelineValue: 100,
    })));
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/import", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const { repositories } = req.body;
    let count = 0;

    if (Array.isArray(repositories)) {
      for (const repo of repositories) {
        const existing = await prisma.contact.findFirst({
          where: { name: repo.name, workspaceId },
        });

        if (existing) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              source: repo.branch || repo.source || "main",
              stage: repo.stage || "DEV",
              score: repo.health || repo.score || 85,
            },
          });
        } else {
          await prisma.contact.create({
            data: {
              name: repo.name,
              email: `${repo.name.toLowerCase()}@repo.nexus.ai`,
              source: repo.branch || repo.source || "main",
              stage: repo.stage || "DEV",
              score: repo.health || repo.score || 85,
              workspaceId,
            },
          });
        }
        count++;
      }
    } else {
      // Default seed behavior if no repository list is passed
      const beforeCount = await prisma.contact.count({ where: { workspaceId } });
      await seedDefaultRepositories(workspaceId);
      const afterCount = await prisma.contact.count({ where: { workspaceId } });
      count = afterCount - beforeCount;
    }

    res.status(200).json({
      message: "Repositories imported successfully",
      count,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/score-report", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const contacts = await prisma.contact.findMany({
      where: { workspaceId },
    });

    const scores = contacts.map(c => c.score || 0);
    const averageHealth = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 88;

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

    res.status(200).json({
      averageHealth,
      distribution,
      anomaliesCount,
    });
  } catch (error) {
    console.error("Get score report error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

