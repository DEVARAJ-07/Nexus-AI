"use client";

import React from "react";
import Link from "next/link";
import { Brain, FileText, Target, BarChart4, Cpu, Network, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const modules = [
    {
      id: "intelligence",
      title: "Intelligence Hub",
      desc: "Ask questions, build knowledge base, chat with PDFs/documents, and run web research agents.",
      icon: <Brain size={20} />,
      path: "/intelligence",
    },
    {
      id: "content",
      title: "Content Studio",
      desc: "Generate blogs, social captions, emails, and ad copy. Manage drafts and scheduling calendar.",
      icon: <FileText size={20} />,
      path: "/content",
    },
    {
      id: "crm",
      title: "CRM & Lead Engine",
      desc: "Track prospects, manage pipeline stages via Kanban boards, and view AI-generated Lead Scores.",
      icon: <Target size={20} />,
      path: "/crm",
    },
    {
      id: "analytics",
      title: "Analytics Command",
      desc: "Explore activity heatmaps, conversion funnels, and read automated AI Insight Cards.",
      icon: <BarChart4 size={20} />,
      path: "/analytics",
    },
    {
      id: "automation",
      title: "Automation Forge",
      desc: "Build drag-and-drop trigger-action workflows to connect Outpost AI modules to external apps.",
      icon: <Cpu size={20} />,
      path: "/automation",
    },
    {
      id: "integrations",
      title: "Integration Gateway",
      desc: "Connect Slack, Notion, Drive, or configure inbound/outbound webhooks and API keys.",
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
            Unified business workspace. 6 modules active. 0 tools context-switching.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }} className="topbar-meta">
          <span>WORKSPACE: OUTPOST HQ</span> | <span style={{ color: "var(--color-success)", fontWeight: 700 }}>PLAN: PRO</span>
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
        <span>💡 AI INSIGHT: 3 hot leads have not been contacted in 5+ days. We recommend generating a follow-up email.</span>
        <Link href="/crm" style={{ textDecoration: "underline", fontWeight: 700 }}>RESOLVE</Link>
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
