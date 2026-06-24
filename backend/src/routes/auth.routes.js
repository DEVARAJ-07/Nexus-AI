const express = require("express");
const router = express.Router();
const prisma = require("../config/db");

router.post("/signup", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new default workspace for the user
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name || email.split("@")[0]}'s Workspace`,
        plan: "FREE",
      },
    });

    user = await prisma.user.create({
      data: {
        email,
        name,
        role: "ADMIN",
        workspaceId: workspace.id,
      },
    });

    res.status(201).json({
      message: "Signup successful",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { workspace: true },
    });

    // Auto-signup if user doesn't exist to make dev seamless
    if (!user) {
      const workspace = await prisma.workspace.create({
        data: {
          name: `${email.split("@")[0]}'s Workspace`,
          plan: "FREE",
        },
      });

      user = await prisma.user.create({
        data: {
          email,
          role: "ADMIN",
          workspaceId: workspace.id,
        },
      });
    }

    res.status(200).json({
      message: "Login successful",
      accessToken: "mock_jwt_access_token_4082",
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

router.post("/refresh", (req, res) => {
  res.status(200).json({
    accessToken: "mock_jwt_new_access_token_4082",
  });
});

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    message: `Password reset email dispatched via Resend to ${email}`,
  });
});

module.exports = router;

