"use client";

import React from "react";
import { Github, Terminal, ArrowRight, Cpu, Sparkles, Network } from "lucide-react";

export default function LandingPage() {
  const handleAuthorize = (e) => {
    e.preventDefault();
    // Complete authentication instantly
    localStorage.setItem("nexus_auth", "true");
    window.dispatchEvent(new Event("nexus-auth-change"));
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-color)", // Light background matching overview page
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      position: "relative"
    }}>
      {/* Subtle grid pattern backing matching visual style */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        pointerEvents: "none",
        backgroundImage: "radial-gradient(var(--border-color) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div style={{
        maxWidth: "800px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        zIndex: 10,
        gap: "2.5rem"
      }}>
        {/* Logo Shield (Brutalist theme matching topbar) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 1rem",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-off-white)",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          color: "var(--text-primary)",
          boxShadow: "2px 2px 0px var(--border-color)"
        }}>
          <Terminal size={14} />
          <span>NEXUS AI PIPELINE COMMAND CENTER</span>
        </div>

        {/* Hero Title */}
        <div>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: "1.05",
            color: "var(--text-primary)"
          }}>
            One Platform.<br />Six DevOps Superpowers.
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            marginTop: "1rem",
            maxWidth: "600px",
            lineHeight: "1.5"
          }}>
            All-in-one build log intelligence, release studio, pipeline kanban, test analytics, and automation triggers. Zero context-switching.
          </p>
        </div>

        {/* Action Auth Card (Brutalist style matching dashboard cards) */}
        <div style={{
          border: "1px solid var(--border-color)",
          padding: "2.5rem",
          backgroundColor: "var(--color-off-white)",
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          boxShadow: "8px 8px 0px var(--border-color)"
        }}>
          <div className="corner-dot tl">+</div>
          <div className="corner-dot tr">+</div>
          <div className="corner-dot bl">+</div>
          <div className="corner-dot br">+</div>

          <form onSubmit={handleAuthorize} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px dotted var(--border-color)", paddingBottom: "0.75rem" }}>
              🔑 Developer Handshake
            </h3>
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Authorize your GitHub account credentials to bootstrap repository pipelines, scan logs, and trigger visual workflows.
            </p>

            <button 
              type="submit" 
              className="brutalist-button"
              style={{
                width: "100%",
                justifyContent: "center",
                fontSize: "0.85rem",
                padding: "0.85rem 1.5rem",
                boxShadow: "4px 4px 0px var(--border-color)",
                backgroundColor: "var(--color-warm-grey)",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
            >
              <Github size={16} />
              <span>Authorize GitHub Profile</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          width: "100%",
          marginTop: "1.5rem",
          textAlign: "left"
        }}>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Cpu size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Log Diagnostics</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Parse failing docker/compile logs and generate target hotfix code patches.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Sparkles size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Release & Docs Studio</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Compile markdown changelogs, release notes, and commit summaries instantly.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Network size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Visual Automation</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Map Git hooks to test builds and deploy sequences in a visual forge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
