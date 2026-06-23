const express = require("express");
const router = express.Router();

let contacts = [
  { id: "lead-1", name: "Sarah Connor", email: "sarah@skynet.com", phone: "+1-555-0199", company: "Cyberdyne Systems", stage: "QUALIFIED", score: 94, source: "Inbound Form" },
  { id: "lead-2", name: "Miles Dyson", email: "miles@dyson-tech.io", phone: "+1-555-0128", company: "Cyberdyne Systems", stage: "NEW", score: 62, source: "LinkedIn Outreach" }
];

let notes = [
  { id: "n-1", contactId: "lead-1", content: "Discussed security configurations. Customer is extremely interested in multi-tenancy specifications.", createdBy: "Alex", createdAt: new Date() }
];

router.get("/contacts", (req, res) => {
  res.status(200).json(contacts);
});

router.post("/contacts", (req, res) => {
  const { name, email, phone, company } = req.body;
  const newContact = {
    id: `lead-${Date.now()}`,
    name,
    email,
    phone,
    company: company || "Independent",
    stage: "NEW",
    score: Math.floor(Math.random() * 40) + 50, // Generate mock score 50-90
    source: "Manual Add"
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

router.get("/contacts/:id", (req, res) => {
  const contact = contacts.find(c => c.id === req.params.id);
  if (!contact) return res.status(404).json({ error: "Lead not found" });
  res.status(200).json(contact);
});

router.patch("/contacts/:id", (req, res) => {
  const index = contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Lead not found" });

  contacts[index] = { ...contacts[index], ...req.body };
  res.status(200).json(contacts[index]);
});

router.delete("/contacts/:id", (req, res) => {
  contacts = contacts.filter(c => c.id !== req.params.id);
  res.status(200).json({ message: "Lead removed" });
});

router.post("/contacts/:id/notes", (req, res) => {
  const { content, createdBy } = req.body;
  const newNote = {
    id: `n-${Date.now()}`,
    contactId: req.params.id,
    content,
    createdBy: createdBy || "System",
    createdAt: new Date()
  };
  notes.push(newNote);
  res.status(201).json(newNote);
});

router.patch("/contacts/:id/stage", (req, res) => {
  const { stage } = req.body;
  const index = contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Lead not found" });

  contacts[index].stage = stage;
  res.status(200).json(contacts[index]);
});

router.get("/pipeline", (req, res) => {
  res.status(200).json(contacts);
});

router.get("/companies", (req, res) => {
  res.status(200).json([
    { id: "company-1", name: "Cyberdyne Systems", website: "https://cyberdyne.com", contactsCount: 2, pipelineValue: 45000 }
  ]);
});

router.post("/import", (req, res) => {
  // Mock bulk import
  res.status(200).json({
    message: "Leads imported successfully",
    count: 2
  });
});

router.get("/score-report", (req, res) => {
  res.status(200).json({
    averageScore: 78,
    distribution: { "0-20": 0, "21-40": 0, "41-60": 1, "61-80": 1, "81-100": 1 },
    hotLeadsCount: 1
  });
});

module.exports = router;
