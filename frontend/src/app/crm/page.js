"use client";

import React, { useState, useEffect } from "react";
import { FolderPlus, Play, X, ShieldAlert, Loader2, Activity } from "lucide-react";
import { API_URL } from "../config";

export default function CRM() {
  const [repositories, setRepositories] = useState([
    { id: "repo-1", name: "nexus-auth-service", branch: "master", stage: "PRODUCTION", health: 98 },
    { id: "repo-2", name: "nexus-backend-api", branch: "main", stage: "PRODUCTION", health: 95 },
    { id: "repo-3", name: "nexus-worker-node", branch: "release/v0.1", stage: "STAGING", health: 85 },
    { id: "repo-4", name: "nexus-frontend-client", branch: "dev", stage: "TESTING", health: 74 },
    { id: "repo-5", name: "nexus-data-pipeline", branch: "hotfix/db-leak", stage: "DEV", health: 42 }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newStage, setNewStage] = useState("DEV");
  const [scanMessage, setScanMessage] = useState("");

  const stages = [
    { id: "DEV", name: "Development (Dev)" },
    { id: "TESTING", name: "Testing (CI)" },
    { id: "STAGING", name: "Staging (QA)" },
    { id: "CANARY", name: "Canary (Beta)" },
    { id: "PRODUCTION", name: "Production (Live)" }
  ];

  // Fetch initial repositories from Express API
  useEffect(() => {
    async function loadRepos() {
      try {
        const res = await fetch(`${API_URL}/api/crm/contacts`);
        if (res.ok) {
          const data = await res.json();
          setRepositories(data);
        }
      } catch (err) {
        console.log("Failed to load repositories from server, using local defaults:", err.message);
      }
    }
    loadRepos();
  }, []);

  const getReposInStage = (stageId) => {
    return repositories.filter((r) => r.stage === stageId);
  };

  // Move repo stage via backend PATCH
  const moveStage = async (id, newStage) => {
    // Optimistically update UI
    setRepositories((prev) =>
      prev.map((r) => (r.id === id ? { ...r, stage: newStage } : r))
    );

    try {
      await fetch(`${API_URL}/api/crm/contacts/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage })
      });
    } catch (err) {
      console.log("Failed to update stage on backend:", err.message);
    }
  };

  // Run AI Pipeline scan (can trigger simulated score updates)
  const runPipelineScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage("Scanning repositories for security vulnerabilities & lint warnings...");
    
    setTimeout(async () => {
      // Create new randomized score offsets
      const updatedList = repositories.map((r) => {
        const newHealth = Math.min(100, Math.max(20, r.health + Math.floor(Math.random() * 16) - 8));
        return { ...r, health: newHealth };
      });
      setRepositories(updatedList);

      // Sync new health scores back to backend
      for (const r of updatedList) {
        try {
          await fetch(`${API_URL}/api/crm/contacts/${r.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ health: r.health })
          });
        } catch (_) {}
      }

      setIsScanning(false);
      setScanMessage("AI Scan complete! Anomaly alert triggered on low-health branch 'nexus-data-pipeline'.");
    }, 1500);
  };

  // Add dynamic repository via backend POST
  const handleAddRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName || !newBranch) return;

    const healthVal = Math.floor(Math.random() * 30) + 70;
    const tempRepo = {
      id: `repo-${Date.now()}`,
      name: newRepoName,
      branch: newBranch,
      stage: newStage,
      health: healthVal
    };

    try {
      const res = await fetch(`${API_URL}/api/crm/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          branch: newBranch,
          stage: newStage
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setRepositories((prev) => [...prev, saved]);
      } else {
        throw new Error("Failed to save repo");
      }
    } catch (err) {
      console.log("Failed to register repository branch on backend, using fallback:", err.message);
      setRepositories((prev) => [...prev, tempRepo]);
    } finally {
      setNewRepoName("");
      setNewBranch("");
      setNewStage("DEV");
      setShowAddForm(false);
    }
  };

  const averageHealth = repositories.length > 0
    ? Math.round(repositories.reduce((acc, r) => acc + r.health, 0) / repositories.length)
    : 0;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Pipeline & Repositories</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Interactive deployment pipeline visualizer and AI health diagnostics engine.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={runPipelineScan}
            className="brutalist-button" 
            style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "var(--color-slate)", color: "#ffffff" }}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 size={14} className="animate-spin" /> SCANNING...
              </>
            ) : (
              <>
                <Play size={14} /> RUN AI PIPELINE SCAN
              </>
            )}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="brutalist-button" 
            style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem" }}
          >
            <FolderPlus size={14} /> Add Repository
          </button>
        </div>
      </div>

      {/* Live Scan Notification message */}
      {scanMessage && (
        <div style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-warm-grey)",
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: scanMessage.includes("complete") ? "var(--color-success)" : "var(--text-primary)"
        }}>
          <Activity size={14} /> {scanMessage}
        </div>
      )}

      {/* Inline Add Repository Form */}
      {showAddForm && (
        <div style={{
          border: "1px solid var(--border-color)",
          padding: "1.5rem",
          backgroundColor: "var(--color-warm-grey)",
          marginBottom: "2rem",
          position: "relative"
        }}>
          <button 
            onClick={() => setShowAddForm(false)}
            style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem" }}>
            Register Repository Branch
          </h4>
          <form onSubmit={handleAddRepo} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontFamily: "monospace" }}>REPOSITORY NAME</label>
              <input 
                type="text" 
                value={newRepoName} 
                onChange={(e) => setNewRepoName(e.target.value)} 
                placeholder="e.g. nexus-auth-service" 
                className="brutalist-input"
                style={{ padding: "0.4rem" }}
                required 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontFamily: "monospace" }}>BRANCH NAME</label>
              <input 
                type="text" 
                value={newBranch} 
                onChange={(e) => setNewBranch(e.target.value)} 
                placeholder="e.g. release/v1.0" 
                className="brutalist-input"
                style={{ padding: "0.4rem" }}
                required 
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontFamily: "monospace" }}>INITIAL STAGE</label>
              <select 
                value={newStage} 
                onChange={(e) => setNewStage(e.target.value)} 
                className="brutalist-input"
                style={{ padding: "0.4rem", height: "35px" }}
              >
                {stages.map((st) => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "span 3", display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="brutalist-button" style={{ padding: "0.4rem 1.5rem" }}>
                Register Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-off-white)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>ACTIVE REPOSITORIES</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{repositories.length}</div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-off-white)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>HEALTH ANOMALIES (&lt; 80%)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-failed)" }}>
            {repositories.filter((r) => r.health < 80).length}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-off-white)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>LIVE IN PRODUCTION</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>
            {repositories.filter((r) => r.stage === "PRODUCTION").length}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-off-white)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>AVERAGE HEALTH</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {averageHealth}%
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginBottom: "1rem" }}>
        Deployment Pipeline (Kanban)
      </h4>

      <div className="kanban-board">
        {stages.map((stage) => (
          <div key={stage.id} className="kanban-column">
            <div className="kanban-column-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{stage.name}</span>
              <span>{getReposInStage(stage.id).length}</span>
            </div>

            {getReposInStage(stage.id).map((r) => (
              <div key={r.id} className="kanban-card">
                <div style={{ fontWeight: 800, fontSize: "0.8rem" }}>{r.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>branch: {r.branch}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: r.health < 80 ? "var(--color-failed)" : "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}>
                    {r.health < 80 ? <ShieldAlert size={10} /> : <Activity size={10} />} Health: {r.health}%
                  </span>
                  
                  {/* Stage Selector */}
                  <select
                    value={r.stage}
                    onChange={(e) => moveStage(r.id, e.target.value)}
                    style={{ fontSize: "0.65rem", padding: "0.1rem", border: "1px solid var(--border-color)", background: "transparent", outline: "none" }}
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
