"use client";

import React from "react";
import Link from "next/link";
import { Brain, FileText, Target, BarChart4, Cpu, Network, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const modules = [
    {
      id: "intelligence",
      title: "Log & Pipeline Intelligence",
      desc: "Analyze build logs, trace pipeline anomalies, and auto-generate code patch files with AI engines.",
      icon: <Brain size={20} />,
      path: "/intelligence",
    },
    {
      id: "content",
      title: "Release & Docs Studio",
      desc: "Instantly compile technical changelogs, build release notes, and synthesize detailed pull request descriptions.",
      icon: <FileText size={20} />,
      path: "/content",
    },
    {
      id: "crm",
      title: "Pipelines & Repositories",
      desc: "Track code repositories, manage deployment phases (dev-to-prod) via Kanban boards, and run AI health diagnostics.",
      icon: <Target size={20} />,
      path: "/crm",
    },
    {
      id: "analytics",
      title: "Pipeline Analytics",
      desc: "Analyze compilation and build duration trends, test failure alerts, and cross-pipeline insights.",
      icon: <BarChart4 size={20} />,
      path: "/analytics",
    },
    {
      id: "automation",
      title: "DevOps Automation",
      desc: "Configure visual trigger-action flows linking GitHub commits to test suites, deploy pipelines, and Slack notifications.",
      icon: <Cpu size={20} />,
      path: "/automation",
    },
    {
      id: "integrations",
      title: "DevOps Integrations",
      desc: "Link repositories and deployment platforms (GitHub, GitLab, Vercel, Render, AWS) or create client API tokens.",
      icon: <Network size={20} />,
      path: "/integrations",
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Workspace Dashboard</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Unified DevOps workspace. 6 modules active. 0 tools context-switching.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }} className="topbar-meta">
          <span>WORKSPACE: NEXUS HQ</span> | <span style={{ color: "var(--color-success)", fontWeight: 700 }}>PLAN: ENTERPRISE</span>
        </div>
      </div>

      {/* AI Alert banner */}
      <div style={{
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--color-warm-grey)",
        padding: "1rem",
        marginBottom: "2rem",
        fontSize: "0.8rem",
        fontFamily: "monospace",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>💡 AI INSIGHT: Build failure detected in pipeline 'nexus-auth-service' due to database connection timeout. We recommend running diagnostics.</span>
        <Link href="/intelligence" style={{ textDecoration: "underline", fontWeight: 700 }}>RESOLVE</Link>
      </div>

      <h3 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginBottom: "1rem" }}>
        Active Workspace Modules
      </h3>

      <div className="dashboard-grid">
        {modules.map((m) => (
          <div key={m.id} className="module-card">
            <div className="module-card-header">
              <span className="module-card-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {m.icon}
                {m.title}
              </span>
              <span className="pulse" />
            </div>
            <p className="module-card-desc">{m.desc}</p>
            <Link href={m.path} className="module-card-action" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              Launch Module <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
