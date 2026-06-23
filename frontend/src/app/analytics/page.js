import React from "react";
import { TrendingUp, AlertTriangle, Lightbulb, PieChart } from "lucide-react";

export default function Analytics() {
  const insights = [
    {
      id: "insight-1",
      title: "Content CTR anomaly detected",
      description: "Click-through rate for LinkedIn social posts dropped by 12.4% over the last 7 days compared to average.",
      metrics: "LinkedIn CTR: 2.1% (Previous: 3.4%)",
      suggestion: "Rewrite post outlines using brand-voice parameters and generate new campaigns.",
    },
    {
      id: "insight-2",
      title: "Pipeline velocity drop-off",
      description: "Prospect contacts are spending an average of 8.2 days in the 'Qualified' stage, causing a bottleneck.",
      metrics: "Qualified Bottleneck Index: 8.2d (Target: 3.0d)",
      suggestion: "Trigger an automation sequence in Automation Forge to dispatch email follow-ups via Resend.",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Analytics Command Center</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Real-time cross-module metrics analysis and anomaly detection insights.
          </p>
        </div>
      </div>

      {/* Analytics chart panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2.5rem" }}>
        {/* Core activity trend chart mock */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp size={14} /> Workspace Activity Trend (Last 5 Days)
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
              <div style={{ height: "40px", width: "30px", backgroundColor: "var(--color-slate)" }} />
              <span>06-18</span>
            </div>
            {/* Bar 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "65px", width: "30px", backgroundColor: "var(--color-slate)" }} />
              <span>06-19</span>
            </div>
            {/* Bar 3 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "90px", width: "30px", backgroundColor: "var(--color-slate)" }} />
              <span>06-20</span>
            </div>
            {/* Bar 4 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "110px", width: "30px", backgroundColor: "var(--color-slate)" }} />
              <span>06-21</span>
            </div>
            {/* Bar 5 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ height: "135px", width: "30px", backgroundColor: "var(--color-slate)" }} />
              <span>06-22</span>
            </div>
          </div>
        </div>

        {/* Lead funnel conversion chart mock */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PieChart size={14} /> Pipeline Conversion Funnel
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>NEW LEADS</span>
                <span>100% (320 leads)</span>
              </div>
              <div style={{ height: "8px", width: "100%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>CONTACTED</span>
                <span>80% (256 leads)</span>
              </div>
              <div style={{ height: "8px", width: "80%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>QUALIFIED</span>
                <span>50% (160 leads)</span>
              </div>
              <div style={{ height: "8px", width: "50%", backgroundColor: "var(--color-slate)" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span>CLOSED WON</span>
                <span>10% (32 leads)</span>
              </div>
              <div style={{ height: "8px", width: "10%", backgroundColor: "var(--color-success)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* AI generated insights feed */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginBottom: "1rem" }}>
        AI Insights Feed (Active Probes)
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
