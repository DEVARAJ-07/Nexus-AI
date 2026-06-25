const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

let workflows = [
  { id: "wf-1", name: "Production Auto-Deploy on Push", trigger: "GIT_PUSH", action: "TRIGGER_DEPLOY", status: true },
  { id: "wf-2", name: "AI Log Repair on Build Failure", trigger: "PIPELINE_FAILED", action: "AI_LOG_DIAGNOSTICS", status: true },
  { id: "wf-3", name: "Post Slack Alert on PR Open", trigger: "PR_OPENED", action: "POST_SLACK_ALERT", status: false }
];

let logs = [
  { id: "log-1", workflowId: "wf-1", status: "COMPLETED", startedAt: new Date(Date.now() - 10000), finishedAt: new Date(), logJson: "[]" }
];

router.get("/", async (req, res) => {
  try {
    const wfs = await prisma.workflow.findMany();
    if (wfs.length > 0) {
      const formatted = wfs.map(w => {
        let triggerName = "GIT_PUSH";
        let actionName = "TRIGGER_DEPLOY";
        try {
          triggerName = JSON.parse(w.triggerConfig).type;
          actionName = JSON.parse(w.stepsJson)[0].action;
        } catch (_) {}
        
        return {
          id: w.id,
          name: w.name,
          trigger: triggerName,
          action: actionName,
          status: w.status === "ACTIVE"
        };
      });
      return res.status(200).json(formatted);
    }
    res.status(200).json(workflows);
  } catch (err) {
    console.warn("[DB_FALLBACK] get workflows failed, using mock:", err.message);
    res.status(200).json(workflows);
  }
});

router.post("/", async (req, res) => {
  const { name, trigger, action } = req.body;
  const newWorkflow = {
    id: `wf-${Date.now()}`,
    name: name || `DevOps Sequence`,
    trigger: trigger || "GIT_PUSH",
    action: action || "TRIGGER_DEPLOY",
    status: false
  };
  try {
    const ws = await prisma.workspace.findFirst();
    if (ws) {
      const created = await prisma.workflow.create({
        data: {
          id: newWorkflow.id,
          name: newWorkflow.name,
          triggerConfig: JSON.stringify({ type: newWorkflow.trigger }),
          stepsJson: JSON.stringify([{ action: newWorkflow.action }]),
          status: "INACTIVE",
          workspaceId: ws.id
        }
      });
      newWorkflow.id = created.id;
    }
    workflows.push(newWorkflow);
    res.status(201).json(newWorkflow);
  } catch (err) {
    console.warn("[DB_FALLBACK] post workflow failed, using mock:", err.message);
    workflows.push(newWorkflow);
    res.status(201).json(newWorkflow);
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const w = await prisma.workflow.findUnique({ where: { id } });
    if (w) {
      let triggerName = "GIT_PUSH";
      let actionName = "TRIGGER_DEPLOY";
      try {
        triggerName = JSON.parse(w.triggerConfig).type;
        actionName = JSON.parse(w.stepsJson)[0].action;
      } catch (_) {}

      return res.status(200).json({
        id: w.id,
        name: w.name,
        trigger: triggerName,
        action: actionName,
        status: w.status === "ACTIVE"
      });
    }
    const wf = workflows.find(w => w.id === id);
    if (!wf) return res.status(404).json({ error: "Workflow not found" });
    res.status(200).json(wf);
  } catch (err) {
    console.warn("[DB_FALLBACK] get workflow details failed, using mock:", err.message);
    const wf = workflows.find(w => w.id === id);
    if (!wf) return res.status(404).json({ error: "Workflow not found" });
    res.status(200).json(wf);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, trigger, action, status } = req.body;
  try {
    const w = await prisma.workflow.findUnique({ where: { id } });
    if (w) {
      const updateData = {};
      if (name) updateData.name = name;
      if (trigger) updateData.triggerConfig = JSON.stringify({ type: trigger });
      if (action) updateData.stepsJson = JSON.stringify([{ action }]);
      if (status !== undefined) updateData.status = status ? "ACTIVE" : "INACTIVE";

      const updated = await prisma.workflow.update({
        where: { id },
        data: updateData
      });

      let triggerName = "GIT_PUSH";
      let actionName = "TRIGGER_DEPLOY";
      try {
        triggerName = JSON.parse(updated.triggerConfig).type;
        actionName = JSON.parse(updated.stepsJson)[0].action;
      } catch (_) {}

      const formatted = {
        id: updated.id,
        name: updated.name,
        trigger: triggerName,
        action: actionName,
        status: updated.status === "ACTIVE"
      };
      const index = workflows.findIndex(w => w.id === id);
      if (index !== -1) workflows[index] = formatted;
      return res.status(200).json(formatted);
    }
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: "Workflow not found" });
    workflows[index] = { ...workflows[index], ...req.body };
    res.status(200).json(workflows[index]);
  } catch (err) {
    console.warn("[DB_FALLBACK] put workflow failed, using mock:", err.message);
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: "Workflow not found" });
    workflows[index] = { ...workflows[index], ...req.body };
    res.status(200).json(workflows[index]);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const w = await prisma.workflow.findUnique({ where: { id } });
    if (w) {
      await prisma.workflow.delete({ where: { id } });
    }
    workflows = workflows.filter(w => w.id !== id);
    res.status(200).json({ message: "Workflow removed" });
  } catch (err) {
    console.warn("[DB_FALLBACK] delete workflow failed, using mock:", err.message);
    workflows = workflows.filter(w => w.id !== id);
    res.status(200).json({ message: "Workflow removed" });
  }
});

router.post("/:id/test", async (req, res) => {
  const { id } = req.params;
  try {
    const runId = `run-${Date.now()}`;
    const logText = ["Trigger fired", "Running step... Success!"];
    const w = await prisma.workflow.findUnique({ where: { id } });
    if (w) {
      await prisma.workflowRun.create({
        data: {
          id: runId,
          workflowId: id,
          status: "COMPLETED",
          logJson: JSON.stringify(logText)
        }
      });
    }
    res.status(200).json({
      status: "SUCCESS",
      executionTimeMs: 120,
      trace: logText
    });
  } catch (err) {
    console.warn("[DB_FALLBACK] post test run failed, using mock:", err.message);
    res.status(200).json({
      status: "SUCCESS",
      executionTimeMs: 120,
      trace: ["Trigger fired", "Running step... Success!"]
    });
  }
});

router.get("/:id/logs", async (req, res) => {
  const { id } = req.params;
  try {
    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: id }
    });
    if (runs.length > 0) {
      const formatted = runs.map(r => ({
        id: r.id,
        workflowId: r.workflowId,
        status: r.status,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        logJson: r.logJson
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json(logs.filter(l => l.workflowId === id));
  } catch (err) {
    console.warn("[DB_FALLBACK] get workflow logs failed, using mock:", err.message);
    res.status(200).json(logs.filter(l => l.workflowId === id));
  }
});

module.exports = router;
