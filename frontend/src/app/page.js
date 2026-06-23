import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Welcome Hero */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Nexus AI Command Center (v0.1)</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            AI-powered command center for log analysis, repository tracking, release generation, and DevOps pipeline automation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", fontFamily: "monospace", backgroundColor: "var(--color-warm-grey)", padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)" }}>
          <span>SYSTEM VERSION: V.0.1</span> | <span style={{ color: "var(--color-success)", fontWeight: 700 }}>STATUS: ACTIVE</span>
        </div>
      </div>

      {/* Guide: What To Do */}
      <section style={{ border: "1px dotted var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)", position: "relative" }}>
        <div className="corner-dot tl">+</div>
        <div className="corner-dot tr">+</div>
        <div className="corner-dot bl">+</div>
        <div className="corner-dot br">+</div>
        
        <h3 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "1rem" }}>
          💡 Getting Started Guide
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", fontSize: "0.8rem", lineHeight: "1.5" }}>
          <div>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>1. ACCESS THE DASHBOARD</strong>
            <p style={{ color: "var(--text-secondary)" }}>
              Navigate to the <Link href="/dashboard" style={{ textDecoration: "underline", fontWeight: 700 }}>Dashboard</Link> to view active repository stats, build success rates, and pipeline health alerts.
            </p>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>2. DIAGNOSE BUILD LOGS</strong>
            <p style={{ color: "var(--text-secondary)" }}>
              Open <Link href="/intelligence" style={{ textDecoration: "underline", fontWeight: 700 }}>Log Intelligence</Link> to upload build files or diagnose compile/test failures with auto-patch diff generation.
            </p>
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>3. AUTOMATE RELEASES & TRIGGERS</strong>
            <p style={{ color: "var(--text-secondary)" }}>
              Use <Link href="/content" style={{ textDecoration: "underline", fontWeight: 700 }}>Release Studio</Link> to compile technical changelogs and <Link href="/automation" style={{ textDecoration: "underline", fontWeight: 700 }}>DevOps Automation</Link> to link commits to deploys.
            </p>
          </div>
        </div>
      </section>

      {/* 2D Vertical Dotted Architecture Diagram */}
      <section style={{ border: "1px dotted var(--border-color)", padding: "2rem 1.5rem", backgroundColor: "var(--color-warm-grey)", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="corner-dot tl">+</div>
        <div className="corner-dot tr">+</div>
        <div className="corner-dot bl">+</div>
        <div className="corner-dot br">+</div>

        <h3 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "2rem", alignSelf: "flex-start" }}>
          🗺️ Nexus System Architecture & Data Flow
        </h3>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "600px" }}>
          {/* USER_CLI / Trigger Event */}
          <div style={{ fontFamily: "monospace", fontSize: "0.75rem", textAlignment: "center", width: "100%" }}>
            <strong>USER_CLI / WEB_INGESTION</strong>
            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "20px", margin: "0.25rem auto" }}></div>
            <div style={{ color: "var(--text-secondary)" }}>[nexus run --branch main --module intelligence]</div>
            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "20px", margin: "0.25rem auto" }}></div>
            <div style={{ fontSize: "0.75rem", marginTop: "-3px" }}>v</div>
          </div>

          {/* Block 1: API Server */}
          <div className="ascii-box">
            <div className="corner-dot tl">+</div>
            <div className="corner-dot tr">+</div>
            <div className="corner-dot bl">+</div>
            <div className="corner-dot br">+</div>
            <strong style={{ display: "block", marginBottom: "0.5rem" }}>NEXUS API SERVER (:5000)</strong>
            <p style={{ margin: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.75rem" }}>:: Authenticates API tokens / webhooks</p>
            <p style={{ margin: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.75rem" }}>:: Stores metadata via Prisma PostgreSQL</p>
            <p style={{ margin: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.75rem" }}>:: Publishes job payload to Queue</p>
          </div>

          {/* Connection */}
          <div style={{ fontFamily: "monospace", fontSize: "0.75rem", textAlign: "center", margin: "0.5rem 0" }}>
            <div style={{ color: "var(--text-secondary)" }}>(Async SQS/Redis Queue Dispatch)</div>
            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "25px", margin: "0.25rem auto" }}></div>
            <div style={{ marginTop: "-3px" }}>v</div>
          </div>

          {/* Block 2: Worker Engine */}
          <div className="ascii-box" style={{ width: "380px" }}>
            <div className="corner-dot tl">+</div>
            <div className="corner-dot tr">+</div>
            <div className="corner-dot bl">+</div>
            <div className="corner-dot br">+</div>
            <strong style={{ display: "block", marginBottom: "0.5rem" }}>NEXUS WORKER / LANGGRAPH</strong>
            
            <div style={{ border: "1px dotted var(--border-color)", padding: "0.5rem", margin: "0.5rem 0", backgroundColor: "var(--color-off-white)", position: "relative" }}>
              <div className="corner-dot tl">+</div>
              <div className="corner-dot tr">+</div>
              <div className="corner-dot bl">+</div>
              <div className="corner-dot br">+</div>
              <div style={{ fontSize: "0.75rem" }}>[load_prompts] &lt;--- reads guidelines/docs context</div>
            </div>

            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "15px", margin: "0 auto" }}></div>
            <div style={{ fontSize: "0.75rem", marginTop: "-3px" }}>v</div>

            <div style={{ border: "1px dotted var(--border-color)", padding: "0.5rem", margin: "0.5rem 0", backgroundColor: "var(--color-off-white)", position: "relative" }}>
              <div className="corner-dot tl">+</div>
              <div className="corner-dot tr">+</div>
              <div className="corner-dot bl">+</div>
              <div className="corner-dot br">+</div>
              <div style={{ fontSize: "0.75rem" }}>[dispatch_probes] :: Fan-out LangGraph Send() actions</div>
            </div>

            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "15px", margin: "0 auto" }}></div>
            <div style={{ fontSize: "0.75rem", marginTop: "-3px" }}>v</div>

            {/* Parallel Vectors */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.25rem" }}>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [PROBE_1]
              </div>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [PROBE_2]
              </div>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [PROBE_N]
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", margin: "0.25rem 0" }}>
              <div style={{ borderLeft: "1px dotted var(--border-color)", height: "15px", marginLeft: "15%" }}></div>
              <div style={{ borderLeft: "1px dotted var(--border-color)", height: "15px", margin: "0 auto" }}></div>
              <div style={{ borderLeft: "1px dotted var(--border-color)", height: "15px", marginRight: "15%" }}></div>
            </div>
            
            {/* Parallel Target Evaluation */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [TGT_1]
              </div>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [TGT_2]
              </div>
              <div style={{ border: "1px dotted var(--border-color)", padding: "0.3rem", fontSize: "0.7rem", flex: 1, position: "relative" }}>
                <div className="corner-dot tl">+</div>
                <div className="corner-dot tr">+</div>
                <div className="corner-dot bl">+</div>
                <div className="corner-dot br">+</div>
                [TGT_N]
              </div>
            </div>
          </div>

          {/* Connection */}
          <div style={{ fontFamily: "monospace", fontSize: "0.75rem", textAlign: "center", margin: "0.5rem 0" }}>
            <div style={{ borderLeft: "1px dotted var(--border-color)", height: "25px", margin: "0.25rem auto" }}></div>
            <div style={{ marginTop: "-3px" }}>v</div>
          </div>

          {/* Target Outputs */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", width: "100%" }}>
            <div className="ascii-box" style={{ flex: 1, margin: 0 }}>
              <div className="corner-dot tl">+</div>
              <div className="corner-dot tr">+</div>
              <div className="corner-dot bl">+</div>
              <div className="corner-dot br">+</div>
              <strong style={{ fontSize: "0.75rem" }}>SLACK / EMAIL</strong>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Notifications alert</div>
            </div>
            
            <div className="ascii-box" style={{ flex: 1, margin: 0 }}>
              <div className="corner-dot tl">+</div>
              <div className="corner-dot tr">+</div>
              <div className="corner-dot bl">+</div>
              <div className="corner-dot br">+</div>
              <strong style={{ fontSize: "0.75rem" }}>NOTION DOCS</strong>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Knowledge sync</div>
            </div>

            <div className="ascii-box" style={{ flex: 1, margin: 0 }}>
              <div className="corner-dot tl">+</div>
              <div className="corner-dot tr">+</div>
              <div className="corner-dot bl">+</div>
              <div className="corner-dot br">+</div>
              <strong style={{ fontSize: "0.75rem" }}>PRODUCTION DEPLOY</strong>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Phased deployment sync</div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
