const express = require("express");
const router = express.Router();

router.get("/overview", (req, res) => {
  res.status(200).json({
    activeUsers: 45,
    contentGenerated: 142,
    leadsAdded: 320,
    automationsRun: 1890,
    dailyActivity: [
      { date: "2026-06-18", active: 20, runs: 120 },
      { date: "2026-06-19", active: 28, runs: 150 },
      { date: "2026-06-20", active: 32, runs: 180 },
      { date: "2026-06-21", active: 40, runs: 240 },
      { date: "2026-06-22", active: 45, runs: 310 }
    ]
  });
});

router.get("/content", (req, res) => {
  res.status(200).json({
    piecesByType: { blog: 45, social: 68, email: 24, ad: 5 },
    totalPublished: 110,
    copyClicks: 412
  });
});

router.get("/leads", (req, res) => {
  res.status(200).json({
    conversionRates: { NEW: 100, CONTACTED: 80, QUALIFIED: 50, PROPOSAL: 20, WON: 10 },
    averageTimeInStageDays: 4.5,
    sourceBreakdown: { inbound: 210, outreach: 110 }
  });
});

router.get("/insights", (req, res) => {
  res.status(200).json([
    { id: "i-1", summary: "LinkedIn conversions dropped by 12% last week.", chart: "LinkedIn Engagement Funnel", suggestion: "Consider increasing social posts using Content Studio template 'LinkedIn Thread Generator'." },
    { id: "i-2", summary: "Hot Lead 'Sarah Connor' has been in QUALIFIED stage for 5 days.", chart: "Timeline Activity Duration", suggestion: "Trigger an automated follow-up sequence." }
  ]);
});

router.post("/reports", (req, res) => {
  const { name, config } = req.body;
  res.status(201).json({
    id: `rep-${Date.now()}`,
    name,
    config,
    createdAt: new Date()
  });
});

router.post("/reports/:id/schedule", (req, res) => {
  const { schedule } = req.body;
  res.status(200).json({
    id: req.params.id,
    schedule,
    message: "Report scheduled successfully"
  });
});

module.exports = router;
