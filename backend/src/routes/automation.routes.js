const express = require("express");
const router = express.Router();

let workflows = [
  { id: "wf-1", name: "Welcome New Lead Sequence", triggerConfig: { type: "NEW_CONTACT" }, stepsJson: "[{ \"action\": \"SEND_EMAIL\", \"templateId\": \"welcome-temp\" }]", status: "ACTIVE" },
  { id: "wf-2", name: "Slack Alert for Hot Leads", triggerConfig: { type: "STAGE_CHANGED" }, stepsJson: "[{ \"action\": \"NOTIFY_SLACK\", \"channel\": \"leads-alert\" }]", status: "INACTIVE" }
];

let logs = [
  { id: "log-1", workflowId: "wf-1", status: "COMPLETED", startedAt: new Date(Date.now() - 10000), finishedAt: new Date(), logJson: "[]" }
];

router.get("/", (req, res) => {
  res.status(200).json(workflows);
});

router.post("/", (req, res) => {
  const { name, triggerConfig, stepsJson } = req.body;
  const newWorkflow = {
    id: `wf-${Date.now()}`,
    name,
    triggerConfig: triggerConfig || {},
    stepsJson: stepsJson || "[]",
    status: "INACTIVE"
  };
  workflows.push(newWorkflow);
  res.status(201).json(newWorkflow);
});

router.get("/:id", (req, res) => {
  const workflow = workflows.find(w => w.id === req.params.id);
  if (!workflow) return res.status(404).json({ error: "Workflow not found" });
  res.status(200).json(workflow);
});

router.put("/:id", (req, res) => {
  const index = workflows.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Workflow not found" });

  workflows[index] = { ...workflows[index], ...req.body };
  res.status(200).json(workflows[index]);
});

router.delete("/:id", (req, res) => {
  workflows = workflows.filter(w => w.id !== req.params.id);
  res.status(200).json({ message: "Workflow removed" });
});

router.post("/:id/test", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    executionTimeMs: 120,
    trace: ["Trigger fired: NEW_CONTACT", "Condition checked: true", "Action run: SEND_EMAIL -> SUCCESS"]
  });
});

router.get("/:id/logs", (req, res) => {
  const workflowLogs = logs.filter(l => l.workflowId === req.params.id);
  res.status(200).json(workflowLogs);
});

module.exports = router;
