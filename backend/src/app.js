const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Health Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ACTIVE",
    service: "Nexus AI - GitHub CI/CD & Log AI Rectifier Engine",
    version: "2.0.0",
    endpoints: {
      health: "/health",
      github: "/api/github",
      ai: "/api/ai",
      settings: "/api/settings"
    }
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Nexus AI Engine", timestamp: new Date().toISOString() });
});

// Import Nexus AI routes
const githubRoutes = require("./routes/github.routes");
const aiRoutes = require("./routes/ai.routes");
const settingsRoutes = require("./routes/settings.routes");

// Register API routes
app.use("/api/github", githubRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

module.exports = app;
