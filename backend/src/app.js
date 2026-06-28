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

// Root check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ACTIVE",
    service: "Nexus AI Backend API",
    frontendUrl: "http://localhost:3000",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      ai: "/api/ai",
      crm: "/api/crm"
    }
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Import route modules
const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");
const documentsRoutes = require("./routes/documents.routes");
const contentRoutes = require("./routes/content.routes");
const crmRoutes = require("./routes/crm.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const automationRoutes = require("./routes/automation.routes");
const integrationsRoutes = require("./routes/integrations.routes");
const settingsRoutes = require("./routes/settings.routes");

// Map API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/settings", settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

module.exports = app;
