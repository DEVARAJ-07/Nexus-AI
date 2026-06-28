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

// Helper to get or create a default user in the workspace
async function getUserId(req, workspaceId) {
  let user = await prisma.user.findFirst({
    where: { workspaceId },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "john@nexus-ci.com",
        name: "John Doe",
        role: "ADMIN",
        workspaceId,
      },
    });
  }
  return user.id;
}

router.get("/profile", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const userId = await getUserId(req, workspaceId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    res.status(200).json({
      name: user.name || "John Doe",
      email: user.email,
      avatarUrl: user.avatarUrl || "https://supabase-storage.com/avatars/john.jpg",
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const userId = await getUserId(req, workspaceId);
    const { name, email, avatarUrl } = req.body;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        avatarUrl,
      },
    });
    
    res.status(200).json({
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || "https://supabase-storage.com/avatars/john.jpg",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/workspace", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    res.status(200).json({
      name: ws.name,
      logoUrl: ws.logoUrl || "https://supabase-storage.com/logos/nexus.png",
      plan: ws.plan,
    });
  } catch (error) {
    console.error("Fetch workspace error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/workspace", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const { name, logoUrl } = req.body;
    
    const ws = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name,
        logoUrl,
      },
    });
    
    res.status(200).json({
      name: ws.name,
      logoUrl: ws.logoUrl || "https://supabase-storage.com/logos/nexus.png",
      plan: ws.plan,
    });
  } catch (error) {
    console.error("Update workspace error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/team", async (req, res) => {
  try {
    const workspaceId = await getWorkspaceId(req);
    const users = await prisma.user.findMany({
      where: { workspaceId },
    });
    res.status(200).json(users.map(u => ({
      id: u.id,
      name: u.name || u.email.split("@")[0],
      email: u.email,
      role: u.role,
    })));
  } catch (error) {
    console.error("Fetch team error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/team/invite", async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspaceId = await getWorkspaceId(req);
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    // Check if user is already in the workspace
    const existing = await prisma.user.findFirst({
      where: { email, workspaceId },
    });
    if (existing) {
      return res.status(400).json({ error: "User is already a member of this workspace" });
    }
    
    const newMember = await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        role: role || "MEMBER",
        workspaceId,
      },
    });
    
    res.status(201).json({
      message: "Invite dispatched successfully",
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
      },
    });
  } catch (error) {
    console.error("Team invite error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/team/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const workspaceId = await getWorkspaceId(req);
    
    const user = await prisma.user.findFirst({
      where: { id: userId, workspaceId },
    });
    if (!user) {
      return res.status(404).json({ error: "Team member not found" });
    }
    if (user.role === "ADMIN") {
      return res.status(400).json({ error: "Cannot revoke admin/owner access" });
    }
    
    await prisma.user.delete({
      where: { id: userId },
    });
    
    res.status(200).json({ message: "Team member access revoked" });
  } catch (error) {
    console.error("Revoke team member error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
