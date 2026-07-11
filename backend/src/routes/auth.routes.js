const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const axios = require("axios");

// Sign Up
router.post("/signup", async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        avatarUrl,
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

// Log In / Auto Sign-up
router.post("/login", async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Auto-signup if user doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          avatarUrl,
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

// Sync GitHub Profile and Repositories
router.post("/sync-github", async (req, res) => {
  try {
    const { username, email, avatarUrl, accessToken, repositories } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Resolve email address
    const userEmail = email || `${username}@github.com`;

    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: username,
        avatarUrl: avatarUrl,
      },
      create: {
        email: userEmail,
        name: username,
        avatarUrl: avatarUrl,
      },
    });

    // 2. Link Authorized Account
    const providerAccountId = String(username);
    await prisma.authorizedAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: providerAccountId,
        },
      },
      update: {
        username: username,
        accessToken: accessToken,
        avatarUrl: avatarUrl,
      },
      create: {
        userId: user.id,
        provider: "github",
        providerAccountId: providerAccountId,
        username: username,
        accessToken: accessToken,
        avatarUrl: avatarUrl,
      },
    });

    // 3. Sync Repositories
    const syncedRepos = [];
    if (Array.isArray(repositories)) {
      for (const repo of repositories) {
        const dbRepo = await prisma.repository.upsert({
          where: {
            userId_githubId: {
              userId: user.id,
              githubId: repo.id || 0,
            },
          },
          update: {
            name: repo.name,
            fullName: repo.full_name || `${username}/${repo.name}`,
            description: repo.description,
            url: repo.html_url || repo.url,
            isPrivate: repo.private || false,
          },
          create: {
            userId: user.id,
            githubId: repo.id || 0,
            name: repo.name,
            fullName: repo.full_name || `${username}/${repo.name}`,
            description: repo.description,
            url: repo.html_url || repo.url,
            isPrivate: repo.private || false,
          },
        });
        syncedRepos.push(dbRepo);
      }
    }

    res.status(200).json({
      message: "GitHub profile and repositories synchronized to Supabase successfully",
      user,
      repositories: syncedRepos,
    });
  } catch (error) {
    console.error("Sync GitHub error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch repositories synced in the database for a user
router.get("/user-repos", async (req, res) => {
  try {
    const { username, email } = req.query;
    if (!username && !email) {
      return res.status(400).json({ error: "Username or email is required" });
    }

    let user;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { repositories: true }
      });
    }
    
    if (!user && username) {
      // Find user via authorized account username
      const authAccount = await prisma.authorizedAccount.findFirst({
        where: { username, provider: "github" },
        include: { user: { include: { repositories: true } } }
      });
      if (authAccount) {
        user = authAccount.user;
      }
    }

    if (!user) {
      return res.status(200).json([]);
    }

    res.status(200).json(user.repositories);
  } catch (error) {
    console.error("Fetch user-repos error:", error);
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
    message: `Password reset email dispatched to ${email}`,
  });
});

// Fetch GitHub Client ID and Supabase configuration
router.get("/github-config", (req, res) => {
  const dbUrl = process.env.DATABASE_URL || "";
  let supabaseProjectRef = "";
  
  // Extract project ref from string e.g. "postgres.nuerryjlhezvihpxhvmo"
  const match = dbUrl.match(/postgres\.([a-z0-9]+)/i);
  if (match) {
    supabaseProjectRef = match[1];
  }

  res.status(200).json({
    clientId: process.env.GITHUB_CLIENT_ID || "",
    supabaseProjectRef: supabaseProjectRef || "nuerryjlhezvihpxhvmo"
  });
});

module.exports = router;
