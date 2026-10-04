"use client";

import React, { useState } from "react";
import {
  Network,
  Check,
  ExternalLink,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Cpu,
  Zap,
  Cloud,
  Database,
  Bell,
  Terminal,
  Server,
  Lock,
  Search,
  Plus
} from "lucide-react";

export default function Integrations() {
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingId, setSyncingId] = useState(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Ecosystem Integrations Data
  const [integrations, setIntegrations] = useState([
    {
      id: "github",
      name: "GitHub Enterprise",
      category: "VCS",
      description: "Direct bi-directional sync with repositories, automated PR creation, and 'nexus' branch creation.",
      status: "CONNECTED",
      account: "@DEVARAJ-07",
      ping: "14ms",
      lastSync: "Just now",
      scopes: ["repo", "workflow", "read:org"],
      badge: "PRIMARY VCS"
    },
    {
      id: "deepseek",
      name: "DeepSeek Coder V3 / R1",
      category: "AI",
      description: "Autonomous neural diagnosis engine analyzing AST errors, runtime crashes, and synthesizing zero-defect patches.",
      status: "CONNECTED",
      account: "Nexus Cluster #01",
      ping: "42ms",
      lastSync: "Active Stream",
      scopes: ["code:read", "ast:rectify"],
      badge: "CORE ENGINE"
    },
    {
      id: "github-actions",
      name: "GitHub Actions CI/CD",
      category: "MONITORING",
      description: "Live runner event listener streaming build logs, container test suites, and failed job traces directly to Nexus AI.",
      status: "CONNECTED",
      account: "16 Pipelines Active",
      ping: "22ms",
      lastSync: "1 min ago",
      scopes: ["actions:read", "checks:write"],
      badge: "AUTO-TRIGGER"
    },
    {
      id: "supabase",
      name: "Supabase PostgreSQL",
      category: "CLOUD",
      description: "Database connection pooler, Prisma schema drift auditor, and real-time incident event persistence.",
      status: "CONNECTED",
      account: "ap-south-1 (Mumbai)",
      ping: "28ms",
      lastSync: "3 mins ago",
      scopes: ["db:transaction", "pooler:6543"],
      badge: "DATABASE"
    },
    {
      id: "vercel",
      name: "Vercel Edge Platform",
      category: "CLOUD",
      description: "Automated instant preview deployments when zero-error patches are committed to the nexus branch.",
      status: "CONNECTED",
      account: "devaraj-07.vercel.app",
      ping: "19ms",
      lastSync: "12 mins ago",
      scopes: ["deploy:write", "aliases:read"],
      badge: "EDGE HOST"
    },
    {
      id: "groq",
      name: "Groq LPU Inference",
      category: "AI",
      description: "Ultra-low latency Llama 3.3 70B inference engine delivering instantaneous conversational code diagnostics.",
      status: "CONNECTED",
      account: "Groq Cloud Tier-1",
      ping: "11ms",
      lastSync: "Active",
      scopes: ["chat:completions"],
      badge: "SUB-SECOND AI"
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleStatus = (id) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === "CONNECTED" ? "DISCONNECTED" : "CONNECTED";
        showToast(`${item.name} status updated to: ${nextStatus}`);
        return {
          ...item,
          status: nextStatus,
          lastSync: nextStatus === "CONNECTED" ? "Just now" : "Disconnected",
          ping: nextStatus === "CONNECTED" ? `${Math.floor(Math.random() * 30 + 10)}ms` : "—"
        };
      }
      return item;
    }));
  };

  const handleSyncSingle = (id, name) => {
    setSyncingId(id);
    setTimeout(() => {
      setSyncingId(null);
      setIntegrations(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, lastSync: "Just now", ping: `${Math.floor(Math.random() * 25 + 10)}ms` };
        }
        return item;
      }));
      showToast(`Successfully re-synced ${name} telemetry`);
    }, 700);
  };

  const handleSyncAll = () => {
    setSyncAllLoading(true);
    setTimeout(() => {
      setSyncAllLoading(false);
      setIntegrations(prev => prev.map(item => {
        if (item.status === "CONNECTED") {
          return { ...item, lastSync: "Just now" };
        }
        return item;
      }));
      showToast("All active integrations re-synced with zero latency drift");
    }, 900);
  };

  const filteredIntegrations = integrations.filter(item => {
    const matchesCategory = filterCategory === "ALL" || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.account.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          backgroundColor: "#111827",
          color: "#ffffff",
          border: "2px solid #000000",
          boxShadow: "4px 4px 0px #000000",
          padding: "0.75rem 1.25rem",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem"
        }}>
          <Check size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div style={{
        border: "1px solid var(--border-color)",
        padding: "1.75rem",
        backgroundColor: "var(--color-off-white)",
        boxShadow: "4px 4px 0px var(--border-color)",
        position: "relative"
      }}>
        <div className="corner-dot tl">+</div>
        <div className="corner-dot tr">+</div>
        <div className="corner-dot bl">+</div>
        <div className="corner-dot br">+</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
              CONNECTED PLATFORMS & ECOSYSTEM
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={handleSyncAll}
              disabled={syncAllLoading}
              className="brutalist-button"
              style={{ padding: "0.65rem 1.25rem", gap: "0.5rem", fontSize: "0.8rem" }}
            >
              <RefreshCw size={14} className={syncAllLoading ? "animate-spin" : ""} />
              <span>{syncAllLoading ? "SYNCING ECOSYSTEM..." : "SYNC ALL TELEMETRY"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Category Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "ALL PLATFORMS" },
            { id: "VCS", label: "VERSION CONTROL" },
            { id: "AI", label: "AI ENGINES" },
            { id: "CLOUD", label: "CLOUD & DATABASE" },
            { id: "MONITORING", label: "MONITORING & CI" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              style={{
                padding: "0.45rem 0.9rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                fontWeight: 800,
                border: "1.5px solid var(--border-color)",
                backgroundColor: filterCategory === cat.id ? "#111827" : "var(--color-off-white)",
                color: filterCategory === cat.id ? "#ffffff" : "var(--text-primary)",
                boxShadow: filterCategory === cat.id ? "3px 3px 0px var(--border-color)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platforms, accounts, scopes..."
            className="brutalist-input"
            style={{ paddingLeft: "32px", fontSize: "0.8rem", width: "100%", height: "36px" }}
          />
        </div>
      </div>

      {/* Integrations Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: "1.5rem"
      }}>
        {filteredIntegrations.map((item) => {
          const isConnected = item.status === "CONNECTED";
          const isStandby = item.status === "STANDBY";
          const isSyncing = syncingId === item.id;

          return (
            <div
              key={item.id}
              style={{
                border: "2px solid #000000",
                backgroundColor: "var(--color-off-white)",
                padding: "1.5rem",
                boxShadow: "4px 4px 0px #000000",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "1.25rem",
                position: "relative"
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#111827",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #000000"
                    }}>
                      {item.category === "VCS" && <Terminal size={18} color="#34d399" />}
                      {item.category === "AI" && <Cpu size={18} color="#60a5fa" />}
                      {item.category === "CLOUD" && <Cloud size={18} color="#f59e0b" />}
                      {item.category === "MONITORING" && <Bell size={18} color="#ec4899" />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                        {item.name}
                      </h3>
                      <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--text-secondary)", fontWeight: 700 }}>
                        {item.account}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: "0.65rem",
                    fontFamily: "monospace",
                    fontWeight: 900,
                    padding: "0.2rem 0.5rem",
                    border: "1px solid #000000",
                    backgroundColor: isConnected ? "#d1fae5" : isStandby ? "#fef3c7" : "#f3f4f6",
                    color: isConnected ? "#065f46" : isStandby ? "#92400e" : "#4b5563"
                  }}>
                    {item.status}
                  </span>
                </div>

                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.45", marginBottom: "1rem" }}>
                  {item.description}
                </p>

                {/* Scopes & Metrics */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "var(--color-warm-grey)",
                  border: "1px solid var(--border-color)",
                  fontFamily: "monospace",
                  fontSize: "0.72rem"
                }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.65rem" }}>LATENCY PING:</span>
                    <strong>{item.ping}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.65rem" }}>LAST AUDIT:</span>
                    <strong>{item.lastSync}</strong>
                  </div>
                </div>

                {/* Scope badges */}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.65rem" }}>
                  {item.scopes.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.62rem",
                        fontFamily: "monospace",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--border-color)",
                        padding: "0.15rem 0.4rem",
                        color: "#374151"
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{
                display: "flex",
                gap: "0.5rem",
                paddingTop: "0.85rem",
                borderTop: "1px dashed var(--border-color)",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item.id)}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.72rem",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    border: "1.5px solid #000000",
                    backgroundColor: isConnected ? "#111827" : "#10b981",
                    color: isConnected ? "#ffffff" : "#000000",
                    cursor: "pointer",
                    boxShadow: "2px 2px 0px #000000"
                  }}
                >
                  {isConnected ? "DISCONNECT" : "CONNECT PLATFORM"}
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={() => handleSyncSingle(item.id, item.name)}
                    disabled={isSyncing}
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.72rem",
                      fontFamily: "monospace",
                      fontWeight: 800,
                      border: "1.5px solid #000000",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "2px 2px 0px #000000",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                    title="Re-sync telemetry"
                  >
                    <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                    <span>SYNC</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
