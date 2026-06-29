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

// Exchange code for GitHub access token
router.post("/github-token-exchange", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      return res.status(500).json({ error: "GitHub OAuth credentials not configured on the server." });
    }

    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientID,
        client_secret: clientSecret,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );

    const { access_token, error: tokenError } = tokenRes.data;
    if (tokenError) {
      throw new Error(`GitHub token exchange error: ${tokenError}`);
    }

    // 2. Fetch User Profile from GitHub
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userRes.data;
    const username = profile.login;
    const email = profile.email || `${username}@github.com`;
    const avatarUrl = profile.avatar_url;

    // 3. Fetch User Repositories from GitHub
    const reposRes = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const rawRepos = reposRes.data;
    const repositories = [];
    const seenIds = new Set();
    if (Array.isArray(rawRepos)) {
      for (const r of rawRepos) {
        if (r && r.id && !seenIds.has(r.id)) {
          // Skip the Python version of SmartEco
          if (r.name === "SmartEco" && r.language === "Python") {
            continue;
          }
          seenIds.add(r.id);
          repositories.push(r);
        }
      }
    }

    // 4. Synchronize with Supabase database
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: username,
        avatarUrl,
      },
      create: {
        email,
        name: username,
        avatarUrl,
      },
    });

    const providerAccountId = String(profile.id);
    await prisma.authorizedAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId,
        },
      },
      update: {
        username,
        accessToken: access_token,
        avatarUrl,
      },
      create: {
        userId: user.id,
        provider: "github",
        providerAccountId,
        username,
        accessToken: access_token,
        avatarUrl,
      },
    });

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
      message: "GitHub OAuth connection and sync complete",
      accessToken: "mock_jwt_access_token_4082",
      user,
      github: {
        username,
        avatarUrl,
        accessToken: access_token,
      },
      repositories: syncedRepos,
    });
  } catch (error) {
    console.error("GitHub OAuth Callback error:", error);
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
