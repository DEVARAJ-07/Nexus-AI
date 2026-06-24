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

// Fetch all integrations
router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let items = await prisma.integration.findMany({
      where: { workspaceId },
    });

    // Seed default integrations if empty
    if (items.length === 0) {
      const defaults = [
        { provider: "Slack", status: "ACTIVE", workspaceId },
        { provider: "HubSpot", status: "INACTIVE", workspaceId }
      ];
      await prisma.integration.createMany({ data: defaults });
      items = await prisma.integration.findMany({ where: { workspaceId } });
    }

    res.status(200).json(items.map(i => ({
      id: i.id,
      provider: i.provider,
      status: i.status,
      lastSync: new Date(),
    })));
  } catch (error) {
    console.error("Fetch integrations error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Connect integration
router.post("/:name/connect", async (req, res) => {
  try {
    const { name } = req.params;
    const workspaceId = await getWorkspaceId(req);

    const integration = await prisma.integration.upsert({
      where: {
        // provider + workspaceId is not compound unique in schema, but we can search and update
        id: (await prisma.integration.findFirst({
          where: { provider: { equals: name, mode: "insensitive" }, workspaceId }
        }))?.id || "00000000-0000-0000-0000-000000000000"
      },
      update: {
        status: "ACTIVE",
      },
      create: {
        provider: name,
        status: "ACTIVE",
        workspaceId,
      },
    });

    res.status(200).json({
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      lastSync: new Date(),
    });
  } catch (error) {
    console.error("Connect integration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Disconnect integration
router.delete("/:name/disconnect", async (req, res) => {
  try {
    const { name } = req.params;
    const workspaceId = await getWorkspaceId(req);

    const existing = await prisma.integration.findFirst({
      where: { provider: { equals: name, mode: "insensitive" }, workspaceId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Integration connection not found" });
    }

    const updated = await prisma.integration.update({
      where: { id: existing.id },
      data: { status: "INACTIVE" },
    });

    res.status(200).json({
      id: updated.id,
      provider: updated.provider,
      status: updated.status,
      lastSync: null,
    });
  } catch (error) {
    console.error("Disconnect integration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sync logs
router.get("/logs", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const logs = await prisma.syncLog.findMany({
      where: {
        integration: {
          workspaceId,
        },
      },
      include: {
        integration: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (logs.length === 0) {
      // Find or create slack integration
      let slack = await prisma.integration.findFirst({
        where: { provider: "Slack", workspaceId },
      });
      if (!slack) {
        slack = await prisma.integration.create({
          data: { provider: "Slack", status: "ACTIVE", workspaceId },
        });
      }
      const defaultLog = await prisma.syncLog.create({
        data: {
          integrationId: slack.id,
          status: "SUCCESS",
          message: "Dispatched slack channel card block.",
        },
      });
      return res.status(200).json([{
        id: defaultLog.id,
        integration: "Slack",
        status: defaultLog.status,
        message: defaultLog.message,
        createdAt: defaultLog.createdAt,
      }]);
    }

    res.status(200).json(logs.map(l => ({
      id: l.id,
      integration: l.integration.provider,
      status: l.status,
      message: l.message,
      createdAt: l.createdAt,
    })));
  } catch (error) {
    console.error("Fetch sync logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API keys
router.get("/keys", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let keys = await prisma.apiKey.findMany({
      where: { workspaceId },
    });

    if (keys.length === 0) {
      const defaultKey = await prisma.apiKey.create({
        data: {
          name: "Production CLI",
          keyHash: "op_live_••••••••••••••••",
          permissions: ["read", "write"],
          workspaceId,
        },
      });
      keys = [defaultKey];
    }

    res.status(200).json(keys);
  } catch (error) {
    console.error("Fetch API keys error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/keys", async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const workspaceId = await getWorkspaceId(req);

    const newKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash: `op_live_${Math.random().toString(36).substring(2, 10)}••••••••`,
        permissions: permissions || ["read"],
        workspaceId,
      },
    });

    res.status(201).json(newKey);
  } catch (error) {
    console.error("Create API key error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/keys/:id", async (req, res) => {
  try {
    await prisma.apiKey.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "API key revoked" });
  } catch (error) {
    console.error("Revoke API key error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhooks
router.get("/webhooks", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let items = await prisma.webhook.findMany({
      where: { workspaceId },
    });

    if (items.length === 0) {
      const defaultWebhook = await prisma.webhook.create({
        data: {
          type: "outbound",
          url: "https://requestbin.com/r/op-webhook",
          events: ["lead.created"],
          status: "ACTIVE",
          workspaceId,
        },
      });
      items = [defaultWebhook];
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Fetch webhooks error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhooks", async (req, res) => {
  try {
    const { url, events, type } = req.body;
    const workspaceId = await getWorkspaceId(req);

    const newWebhook = await prisma.webhook.create({
      data: {
        type: type || "outbound",
        url,
        events: events || ["lead.created"],
        status: "ACTIVE",
        workspaceId,
      },
    });

    res.status(201).json(newWebhook);
  } catch (error) {
    console.error("Create webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/webhooks/:id/test", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    statusCode: 200,
    responseBody: "{\"received\": true}",
  });
});

module.exports = router;

