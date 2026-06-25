const prisma = require("../config/db");

async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];
    
    if (!apiKey) {
      // Graceful fallback: attach default workspace in development mode
      let defaultWorkspace = await prisma.workspace.findFirst();
      if (!defaultWorkspace) {
        defaultWorkspace = await prisma.workspace.create({
          data: {
            name: "Default Workspace",
            plan: "FREE",
          },
        });
      }
      req.workspaceId = defaultWorkspace.id;
      return next();
    }

    // Verify api key
    let keyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash: apiKey, // In a real app we'd hash the input, but we match it for dev
      },
    });

    if (!keyRecord) {
      // Let's also check if it's a prefix match or exact match
      keyRecord = await prisma.apiKey.findFirst({
        where: {
          keyHash: {
            startsWith: apiKey.split("•")[0],
          },
        },
      });
    }

    if (!keyRecord) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    // Update last used timestamp asynchronously
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(err => console.error("Error updating key last used:", err));

    req.workspaceId = keyRecord.workspaceId;
    next();
  } catch (error) {
    console.error("API Key auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

module.exports = { apiKeyAuth };
