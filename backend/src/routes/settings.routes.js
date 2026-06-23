const express = require("express");
const router = express.Router();

let profile = {
  name: "John Doe",
  email: "john@nexus-ci.com",
  avatarUrl: "https://supabase-storage.com/avatars/john.jpg"
};

let workspace = {
  name: "Nexus Headquarters",
  logoUrl: "https://supabase-storage.com/logos/nexus.png",
  timezone: "UTC",
  language: "en"
};

let team = [
  { id: "u-1", name: "John Doe", email: "john@nexus-ci.com", role: "ADMIN" },
  { id: "u-2", name: "Sarah Connor", email: "sarah@skynet.com", role: "MEMBER" }
];

router.get("/profile", (req, res) => {
  res.status(200).json(profile);
});

router.patch("/profile", (req, res) => {
  profile = { ...profile, ...req.body };
  res.status(200).json(profile);
});

router.get("/workspace", (req, res) => {
  res.status(200).json(workspace);
});

router.patch("/workspace", (req, res) => {
  workspace = { ...workspace, ...req.body };
  res.status(200).json(workspace);
});

router.get("/team", (req, res) => {
  res.status(200).json(team);
});

router.post("/team/invite", (req, res) => {
  const { email, role } = req.body;
  const newMember = {
    id: `u-${Date.now()}`,
    name: email.split("@")[0],
    email,
    role: role || "MEMBER"
  };
  team.push(newMember);
  res.status(201).json({
    message: "Invite dispatched successfully",
    member: newMember
  });
});

router.delete("/team/:userId", (req, res) => {
  team = team.filter(member => member.id !== req.params.userId);
  res.status(200).json({ message: "Team member access revoked" });
});

module.exports = router;
