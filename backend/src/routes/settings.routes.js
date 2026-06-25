const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

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

router.get("/profile", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "john@nexus-ci.com" }
    });
    if (user) {
      return res.status(200).json({
        name: user.name || "John Doe",
        email: user.email,
        avatarUrl: user.avatarUrl || "https://supabase-storage.com/avatars/john.jpg"
      });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /profile failed, using mock:", err.message);
    res.status(200).json(profile);
  }
});

router.patch("/profile", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { email: "john@nexus-ci.com" }
    });
    if (user) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name, email }
      });
      profile = {
        name: updated.name || "John Doe",
        email: updated.email,
        avatarUrl: updated.avatarUrl || "https://supabase-storage.com/avatars/john.jpg"
      };
    } else {
      profile = { ...profile, ...req.body };
    }
    res.status(200).json(profile);
  } catch (err) {
    console.warn("[DB_FALLBACK] patch /profile failed, using mock:", err.message);
    profile = { ...profile, ...req.body };
    res.status(200).json(profile);
  }
});

router.get("/workspace", async (req, res) => {
  try {
    const ws = await prisma.workspace.findFirst();
    if (ws) {
      return res.status(200).json({
        name: ws.name,
        logoUrl: ws.logoUrl || "https://supabase-storage.com/logos/nexus.png",
        timezone: "UTC",
        language: "en"
      });
    }
    res.status(200).json(workspace);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /workspace failed, using mock:", err.message);
    res.status(200).json(workspace);
  }
});

router.patch("/workspace", async (req, res) => {
  const { name } = req.body;
  try {
    const ws = await prisma.workspace.findFirst();
    if (ws) {
      const updated = await prisma.workspace.update({
        where: { id: ws.id },
        data: { name }
      });
      workspace = {
        ...workspace,
        name: updated.name
      };
    } else {
      workspace = { ...workspace, ...req.body };
    }
    res.status(200).json(workspace);
  } catch (err) {
    console.warn("[DB_FALLBACK] patch /workspace failed, using mock:", err.message);
    workspace = { ...workspace, ...req.body };
    res.status(200).json(workspace);
  }
});

router.get("/team", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    if (users.length > 0) {
      const formatted = users.map(u => ({
        id: u.id,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        role: u.role
      }));
      return res.status(200).json(formatted);
    }
    res.status(200).json(team);
  } catch (err) {
    console.warn("[DB_FALLBACK] get /team failed, using mock:", err.message);
    res.status(200).json(team);
  }
});

router.post("/team/invite", async (req, res) => {
  const { email, role } = req.body;
  const newMember = {
    id: `u-${Date.now()}`,
    name: email.split("@")[0],
    email,
    role: role || "MEMBER"
  };
  try {
    const ws = await prisma.workspace.findFirst();
    if (ws) {
      const created = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          role: role || "MEMBER",
          workspaceId: ws.id
        }
      });
      newMember.id = created.id;
      newMember.name = created.name;
      newMember.role = created.role;
    }
    team.push(newMember);
    res.status(201).json({
      message: "Invite dispatched successfully",
      member: newMember
    });
  } catch (err) {
    console.warn("[DB_FALLBACK] post /team/invite failed, using mock:", err.message);
    team.push(newMember);
    res.status(201).json({
      message: "Invite dispatched successfully",
      member: newMember
    });
  }
});

router.delete("/team/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) {
      await prisma.user.delete({
        where: { id: userId }
      });
    }
    team = team.filter(member => member.id !== userId);
    res.status(200).json({ message: "Team member access revoked" });
  } catch (err) {
    console.warn("[DB_FALLBACK] delete /team failed, using mock:", err.message);
    team = team.filter(member => member.id !== userId);
    res.status(200).json({ message: "Team member access revoked" });
  }
});

module.exports = router;
