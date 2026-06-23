const express = require("express");
const router = express.Router();

let integrations = [
  { id: "int-1", provider: "Slack", status: "ACTIVE", lastSync: new Date() },
  { id: "int-2", provider: "HubSpot", status: "INACTIVE", lastSync: null }
];

let apiKeys = [
  { id: "key-1", name: "Production CLI", keyHash: "op_live_••••••••••••••••", permissions: ["read", "write"] }
];

let webhooks = [
  { id: "wh-1", type: "outbound", url: "https://requestbin.com/r/op-webhook", events: ["lead.created"], status: "ACTIVE" }
];

router.get("/", (req, res) => {
  res.status(200).json(integrations);
});

router.post("/:name/connect", (req, res) => {
  const { name } = req.params;
  const index = integrations.findIndex(i => i.provider.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    integrations[index].status = "ACTIVE";
    integrations[index].lastSync = new Date();
    return res.status(200).json(integrations[index]);
  }
  const newInt = { id: `int-${Date.now()}`, provider: name, status: "ACTIVE", lastSync: new Date() };
  integrations.push(newInt);
  res.status(201).json(newInt);
});

router.delete("/:name/disconnect", (req, res) => {
  const { name } = req.params;
  const index = integrations.findIndex(i => i.provider.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    integrations[index].status = "INACTIVE";
    return res.status(200).json(integrations[index]);
  }
  res.status(404).json({ error: "Integration connection not found" });
});

router.get("/logs", (req, res) => {
  res.status(200).json([
    { id: "log-1", integration: "Slack", status: "SUCCESS", message: "Dispatched slack channel card block.", createdAt: new Date() }
  ]);
});

router.get("/keys", (req, res) => {
  res.status(200).json(apiKeys);
});

router.post("/keys", (req, res) => {
  const { name, permissions } = req.body;
  const newKey = {
    id: `key-${Date.now()}`,
    name,
    keyHash: `op_live_${Math.random().toString(36).substring(2, 10)}••••••••`,
    permissions: permissions || ["read"]
  };
  apiKeys.push(newKey);
  res.status(201).json(newKey);
});

router.delete("/keys/:id", (req, res) => {
  apiKeys = apiKeys.filter(k => k.id !== req.params.id);
  res.status(200).json({ message: "API key revoked" });
});

router.get("/webhooks", (req, res) => {
  res.status(200).json(webhooks);
});

router.post("/webhooks", (req, res) => {
  const { url, events, type } = req.body;
  const newWebhook = {
    id: `wh-${Date.now()}`,
    type: type || "outbound",
    url,
    events: events || ["lead.created"],
    status: "ACTIVE"
  };
  webhooks.push(newWebhook);
  res.status(201).json(newWebhook);
});

router.post("/webhooks/:id/test", (req, res) => {
  res.status(200).json({
    status: "SUCCESS",
    statusCode: 200,
    responseBody: "{\"received\": true}"
  });
});

module.exports = router;
