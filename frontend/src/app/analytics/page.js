import React from "react";
import { TrendingUp, AlertTriangle, Lightbulb, BarChart4, CheckCircle } from "lucide-react";

export default function Analytics() {
  const insights = [
    {
      id: "insight-1",
      title: "Build duration cache miss detected",
      description: "Build duration for 'nexus-frontend-client' increased by 237% over the last 5 pipeline runs due to a webpack loader cache miss.",
      metrics: "Build time: 135s (Target: <45s)",
      suggestion: "Enable caching options in DevOps Automation Forge settings or check node_modules dependencies.",
    },
    {
      id: "insight-2",
      title: "Consecutive test failure anomaly",
      description: "Branch 'hotfix/db-leak' in 'nexus-data-pipeline' failed unit tests in 3 consecutive runs on route: GET /api/v1/aggregate.",
      metrics: "Failure streak: 3 runs (Build #492, #493, #494)",
      suggestion: "Launch Log Intelligence module, paste build log outputs, and apply the generated code repair diff.",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Pipeline Analytics Command</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Real-time pipeline duration trend analyzer and integration test analytics.
          </p>
        </div>
      </div>

      {/* Analytics chart panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2.5rem" }}>
        {/* Core build duration trend chart */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={14} /> Build Duration Trend (Last 5 Runs in Seconds)
          </h4>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            height: "150px",
            padding: "0 1rem",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "0.5rem",
            fontFamily: "monospace",
            fontSize: "0.75rem"
          }}>
            {/* Bar 1 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "40px", width: "30px", backgroundColor: "var(--color-steel)" }} title="40 seconds" />
              <span>#490</span>
            </div>
            {/* Bar 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "65px", width: "30px", backgroundColor: "var(--color-steel)" }} title="65 seconds" />
              <span>#491</span>
            </div>
            {/* Bar 3 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "90px", width: "30px", backgroundColor: "var(--color-steel)" }} title="90 seconds" />
              <span>#492</span>
            </div>
            {/* Bar 4 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "110px", width: "30px", backgroundColor: "var(--color-steel)" }} title="110 seconds" />
              <span>#493</span>
            </div>
            {/* Bar 5 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "135px", width: "30px", backgroundColor: "var(--color-failed)" }} title="135 seconds (Cache Miss)" />
              <span style={{ color: "var(--color-failed)", fontWeight: 700 }}>#494</span>
            </div>
          </div>
        </div>

        {/* DevOps delivery conversion chart */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BarChart4 size={14} /> Pipeline Delivery Pass Rates
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>COMMITS TRIGGERED</span>
                <span>100% (320 runs)</span>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>STATIC ANALYSIS / LINT</span>
                <span>92% (294 runs)</span>
              </div>
              <div style={{ height: "8px", width: "92%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>UNIT / INTEGRATION TESTS</span>
                <span>78% (249 runs)</span>
              </div>
              <div style={{ height: "8px", width: "78%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>PRODUCTION DEPLOYMENTS</span>
                <span>60% (192 runs)</span>
              </div>
              <div style={{ height: "8px", width: "60%", backgroundColor: "var(--color-success)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* AI generated insights feed */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginBottom: "1rem" }}>
        AI Pipeline Diagnostic Anomalies
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {insights.map((insight) => (
          <div key={insight.id} style={{
            border: "1px solid var(--border-color)",
            padding: "1.25rem",
            backgroundColor: "var(--color-warm-grey)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 800, fontSize: "0.85rem" }}>
              <AlertTriangle size={14} style={{ color: "var(--color-failed)" }} />
              {insight.title}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              {insight.description}
            </p>
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 700 }}>
              {insight.metrics}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.75rem",
              marginTop: "0.5rem",
              color: "var(--color-success)",
              fontWeight: 700
            }}>
              <Lightbulb size={12} /> Suggested Action: {insight.suggestion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
