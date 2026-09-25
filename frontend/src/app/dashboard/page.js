"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Github, Folder, File, ChevronRight, Loader2, ArrowLeft, Terminal,
  GitCommit, Star, GitFork, Brain
} from "lucide-react";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("github_username") || "";
    const storedAvatar = localStorage.getItem("github_avatar") || "";

    setUsername(storedUser);
    setAvatar(storedAvatar);
  }, []);

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Workspace Dashboard</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Welcome back, {username || "Developer"}. Unified DevOps command center.
          </p>
        </div>
      </div>

      {/* Main Workspace Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "2rem"
      }}>
        {/* Left Column: Workspace Overview */}
        <div style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-off-white)",
          boxShadow: "6px 6px 0px var(--border-color)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}>
          <div>
            <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              📦 Monorepo Command Center
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Nexus AI is running in standalone local workspace mode. All integrations and external pipelines are managed through the settings panel.
            </p>
          </div>

          <div style={{
            border: "1px dashed var(--border-color)",
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <Github size={24} style={{ opacity: 0.5 }} />
            <strong style={{ fontSize: "0.8rem" }}>GitHub Connection Deactivated</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
              The GitHub repository sync flow has been disabled for this workspace. You can link your personal GitHub profile and register hooks at a later stage.
            </p>
          </div>
        </div>

        {/* Right Column: Console Details */}
        <div style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-warm-grey)",
          boxShadow: "6px 6px 0px var(--border-color)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.75rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            ⚡ Standalone Status
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem" }}>
            <div style={{ border: "1px solid var(--border-color)", padding: "0.75rem", backgroundColor: "#ffffff" }}>
              <span style={{ fontWeight: 700, display: "block", marginBottom: "0.2rem" }}>Workspace Node</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "var(--text-secondary)" }}>nexus-local-01</span>
            </div>
            <div style={{ border: "1px solid var(--border-color)", padding: "0.75rem", backgroundColor: "#ffffff" }}>
              <span style={{ fontWeight: 700, display: "block", marginBottom: "0.2rem" }}>Database Engine</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "var(--text-secondary)" }}>Prisma + Supabase DB</span>
            </div>
            <div style={{ border: "1px solid var(--border-color)", padding: "0.75rem", backgroundColor: "#ffffff" }}>
              <span style={{ fontWeight: 700, display: "block", marginBottom: "0.2rem" }}>API Port</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "var(--text-secondary)" }}>5000 (Express server)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
