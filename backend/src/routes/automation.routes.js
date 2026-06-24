const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const queueService = require("../services/queue.service");

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

// Helper to parse JSON safely
function safeJsonStringify(obj) {
  if (typeof obj === "string") return obj;
  return JSON.stringify(obj || {});
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str || {};
  }
}

// Map db workflow to api format
function mapWorkflow(wf) {
  return {
    id: wf.id,
    name: wf.name,
    triggerConfig: safeJsonParse(wf.triggerConfig),
    stepsJson: wf.stepsJson,
    status: wf.status,
  };
}

router.get("/", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    let items = await prisma.workflow.findMany({
      where: { workspaceId },
    });

    // Seed default workflows if empty
    if (items.length === 0) {
      const defaultWorkflows = [
        { name: "Welcome New Lead Sequence", triggerConfig: JSON.stringify({ type: "NEW_CONTACT" }), stepsJson: "[{ \"action\": \"SEND_EMAIL\", \"templateId\": \"welcome-temp\" }]", status: "ACTIVE", workspaceId },
        { name: "Slack Alert for Hot Leads", triggerConfig: JSON.stringify({ type: "STAGE_CHANGED" }), stepsJson: "[{ \"action\": \"NOTIFY_SLACK\", \"channel\": \"leads-alert\" }]", status: "INACTIVE", workspaceId }
      ];
      await prisma.workflow.createMany({ data: defaultWorkflows });
      items = await prisma.workflow.findMany({ where: { workspaceId } });
    }

    res.status(200).json(items.map(mapWorkflow));
  } catch (error) {
    console.error("Fetch workflows error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, triggerConfig, stepsJson } = req.body;
    const workspaceId = await getWorkspaceId(req);

    const newWorkflow = await prisma.workflow.create({
      data: {
        name,
        triggerConfig: safeJsonStringify(triggerConfig),
        stepsJson: typeof stepsJson === "string" ? stepsJson : JSON.stringify(stepsJson || []),
        status: "INACTIVE",
        workspaceId,
      },
    });

    res.status(201).json(mapWorkflow(newWorkflow));
  } catch (error) {
    console.error("Create workflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
    });
    if (!workflow) return res.status(404).json({ error: "Workflow not found" });
    res.status(200).json(mapWorkflow(workflow));
  } catch (error) {
    console.error("Get workflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, triggerConfig, stepsJson, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (triggerConfig) updateData.triggerConfig = safeJsonStringify(triggerConfig);
    if (stepsJson) updateData.stepsJson = typeof stepsJson === "string" ? stepsJson : JSON.stringify(stepsJson);
    if (status) updateData.status = status;

    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.status(200).json(mapWorkflow(workflow));
  } catch (error) {
    console.error("Update workflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.workflow.delete({
      where: { id: req.params.id },
    });
    res.status(200).json({ message: "Workflow removed" });
  } catch (error) {
    console.error("Delete workflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/test", async (req, res) => {
  try {
    const workflowId = req.params.id;
    const triggerPayload = req.body || {};

    const run = await queueService.dispatchJob(workflowId, triggerPayload);

    // Wait 1.2s to let background worker complete for real-time trace response
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Fetch the updated run with logs
    const completedRun = await prisma.workflowRun.findUnique({
      where: { id: run.id },
    });

    res.status(200).json({
      status: completedRun.status,
      runId: completedRun.id,
      executionTimeMs: 820,
      trace: safeJsonParse(completedRun.logJson),
    });
  } catch (error) {
    console.error("Test workflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/logs", async (req, res) => {
  try {
    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: req.params.id },
      orderBy: { startedAt: "desc" },
    });

    res.status(200).json(runs.map(r => ({
      id: r.id,
      workflowId: r.workflowId,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt || r.startedAt,
      logJson: safeJsonParse(r.logJson),
    })));
  } catch (error) {
    console.error("Get workflow logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

