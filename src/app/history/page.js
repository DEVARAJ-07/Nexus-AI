"use client";

import { useState } from "react";
import { GitBranch, Clock, Calendar, CheckCircle2, XCircle, Play, ChevronDown, ChevronUp } from "lucide-react";

export default function History() {
  const [expandedRun, setExpandedRun] = useState(null);

  const runHistory = [
    {
      id: "OP-4091",
      pipeline: "frontend-app",
      branch: "main",
      commit: "8f9a2c3b",
      author: "@johndoe",
      duration: "14.88s",
      timestamp: "2026-06-22 10:45",
      status: "success",
      trigger: "push",
      logs: [
        "[INIT] Container allocated",
        "[CLONE] repository main:8f9a2c3b",
        "[BUILD] npm install --frozen-lockfile completed (4.22s)",
        "[TEST] npm run test:ci -> Suite PASS (3 tests passed)",
        "[DEPLOY] Live link deployed at: https://outpost-frontend.vercel.app",
        "[SUCCESS] Run completed successfully"
      ]
    },
    {
      id: "OP-4090",
      pipeline: "api-service",
      branch: "main",
      commit: "a4b5c6d7",
      author: "@alex-dev",
      duration: "18.45s",
      timestamp: "2026-06-22 09:12",
      status: "success",
      trigger: "push",
      logs: [
        "[INIT] Go workspace ready",
        "[CLONE] repository main:a4b5c6d7",
        "[BUILD] go build output main ready (3.12s)",
        "[TEST] go test -v ./... -> PASS (2 units passed)",
        "[DOCKER] tag pushing tag to Amazon ECR...",
        "[DEPLOY] deployment api-service-deployment configured successfully",
        "[SUCCESS] Run completed successfully"
      ]
    },
    {
      id: "OP-4089",
      pipeline: "mobile-android",
      branch: "develop",
      commit: "c9d8e7f6",
      author: "@bob-mobile",
      duration: "12.04s",
      timestamp: "2026-06-22 08:33",
      status: "failed",
      trigger: "push",
      logs: [
        "[INIT] Android SDK 34 workspace ready",
        "[CLONE] repository develop:c9d8e7f6",
        "[BUILD] ./gradlew assembleDebug failed",
        "[ERROR] error: package com.outpost.analytics does not exist",
        "[FAILED] Run failed to complete compile stage"
      ]
    },
    {
      id: "OP-4088",
      pipeline: "frontend-app",
      branch: "feature/auth",
      commit: "e1f2g3h4",
      author: "@lisa-designer",
      duration: "15.10s",
      timestamp: "2026-06-21 16:50",
      status: "success",
      trigger: "pull_request",
      logs: [
        "[INIT] Container allocated",
        "[CLONE] repository feature/auth:e1f2g3h4",
        "[BUILD] npm install (5.10s)",
        "[TEST] npm run test:ci -> Suite PASS",
        "[DEPLOY] Live link deployed at: https://outpost-frontend-preview.vercel.app",
        "[SUCCESS] Run completed successfully"
      ]
    },
    {
      id: "OP-4087",
      pipeline: "api-service",
      branch: "hotfix/cors",
      commit: "d4e5f6g7",
      author: "@alex-dev",
      duration: "17.90s",
      timestamp: "2026-06-21 14:15",
      status: "success",
      trigger: "push",
      logs: [
        "[INIT] Go workspace ready",
        "[CLONE] repository hotfix/cors:d4e5f6g7",
        "[BUILD] go build output main ready (3.05s)",
        "[TEST] go test -v ./... -> PASS",
        "[DEPLOY] deployment api-service-deployment configured successfully",
        "[SUCCESS] Run completed successfully"
      ]
    }
  ];

  const toggleExpand = (id) => {
    setExpandedRun(expandedRun === id ? null : id);
  };

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <section className="spec-section" style={{ margin: "1rem 0 3rem 0" }}>
        <div className="spec-header hairline-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>RUN HISTORY LOG</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>SHOWING LAST 5 RUNS</span>
        </div>
        <div className="spec-table">
          {runHistory.map((run) => (
            <div key={run.id} style={{ display: "flex", flexDirection: "column" }} className="hairline-bottom">
              {/* Row content */}
              <div className="spec-row" style={{ minHeight: "65px" }}>
                <div className="spec-cell spec-id hairline-right">
                  {run.id}
                </div>
                <div className="spec-cell spec-title hairline-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem", padding: "1rem" }}>
                  <span style={{ fontWeight: 800 }}>{run.pipeline}</span>
                  <span className="version-tag" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <GitBranch size={10} /> {run.branch}
                  </span>
                </div>
                <div className="spec-cell spec-desc hairline-right" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>COMMIT</span>
                    <code style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-primary)" }}>{run.commit} ({run.author})</code>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>DURATION</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                      <Clock size={12} /> {run.duration}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>TRIGGER</span>
                    <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontFamily: "monospace" }}>{run.trigger}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>TIMESTAMP</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                      <Calendar size={12} /> {run.timestamp}
                    </span>
                  </div>
                </div>
                <div className="spec-cell spec-action" style={{ display: "flex", gap: "0.5rem" }}>
                  <span className={`status-badge ${run.status}`}>
                    {run.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => toggleExpand(run.id)}
                    className="action-button"
                    style={{ padding: "0.4rem", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center" }}
                  >
                    {expandedRun === run.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Collapsible log output */}
              {expandedRun === run.id && (
                <div style={{
                  backgroundColor: "var(--color-warm-grey)",
                  padding: "1.5rem 2rem",
                  fontFamily: "Consolas, monospace",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                  borderTop: "1px solid var(--border-color)"
                }}>
                  <div style={{ color: "var(--text-secondary)", marginBottom: "1rem", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.25rem", fontSize: "0.7rem", textTransform: "uppercase" }}>
                    Console Output Buffer for {run.id}
                  </div>
                  {run.logs.map((log, lIdx) => {
                    let logClass = "terminal-muted";
                    if (log.startsWith("[SUCCESS]") || log.includes("PASS") || log.includes("✓")) logClass = "terminal-success";
                    else if (log.startsWith("[ERROR]") || log.startsWith("[FAILED]")) logClass = "terminal-failed";
                    else if (log.startsWith("[INIT]") || log.startsWith("[CLONE]") || log.startsWith("[BUILD]") || log.startsWith("[TEST]") || log.startsWith("[DEPLOY]")) logClass = "terminal-highlight";

                    return (
                      <div key={lIdx} className={logClass}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
