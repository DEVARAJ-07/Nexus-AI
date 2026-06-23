"use client";

import React, { useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Info } from "lucide-react";

export default function Automation() {
  const [workflows, setWorkflows] = useState([
    { id: "wf-1", name: "Production Auto-Deploy on Push", trigger: "GIT_PUSH", action: "TRIGGER_DEPLOY", status: true },
    { id: "wf-2", name: "AI Log Repair on Build Failure", trigger: "PIPELINE_FAILED", action: "AI_LOG_DIAGNOSTICS", status: true },
    { id: "wf-3", name: "Post Slack Alert on PR Open", trigger: "PR_OPENED", action: "POST_SLACK_ALERT", status: false }
  ]);
  const [selectedTrigger, setSelectedTrigger] = useState("GIT_PUSH");
  const [selectedAction, setSelectedAction] = useState("TRIGGER_DEPLOY");
  const [newWorkflowName, setNewWorkflowName] = useState("");

  const toggleStatus = (id) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: !w.status } : w))
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const name = newWorkflowName.trim() || `DevOps Sequence ${workflows.length + 1}`;
    const newWf = {
      id: `wf-${Date.now()}`,
      name,
      trigger: selectedTrigger,
      action: selectedAction,
      status: false
    };
    setWorkflows((prev) => [...prev, newWf]);
    setNewWorkflowName("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>DevOps Automation Forge</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Visual trigger-action builder linking Git hooks to tests, AI diagnostics, and deployment pipelines.
          </p>
        </div>
      </div>

      <div className="flow-canvas">
        {/* Drag and Drop Canvas Simulation */}
        <div>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem" }}>
            Visual Pipeline Designer
          </h4>
          <div className="canvas-area">
            {/* Trigger node */}
            <div className="canvas-node" style={{ top: "10%", left: "10%", borderStyle: "dashed" }}>
              ⚡ EVENT: {selectedTrigger}
            </div>
            
            <div style={{ fontSize: "1.5rem", color: "var(--color-taupe)" }}>═══►</div>

            {/* Action node */}
            <div className="canvas-node" style={{ top: "45%", right: "10%" }}>
              ⚙️ ACTION: {selectedAction}
            </div>

            <div style={{
              position: "absolute",
              bottom: "1rem",
              left: "1rem",
              fontSize: "0.7rem",
              fontFamily: "monospace",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem"
            }}>
              <Info size={12} /> Visual connection shows trigger mapping. Commit the sequence below.
            </div>
          </div>
        </div>

        {/* Configurations Sidepanel */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.5rem" }}>
            Automation Configurator
          </h4>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TRIGGER HOOK</label>
              <select
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value)}
                className="brutalist-input"
                style={{ height: "36px" }}
              >
                <option value="GIT_PUSH">Git Commit Pushed</option>
                <option value="PR_OPENED">Pull Request Opened</option>
                <option value="PIPELINE_FAILED">CI Build Failed</option>
                <option value="RELEASE_CREATED">Release Tag Created</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>ACTION TARGET</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="brutalist-input"
                style={{ height: "36px" }}
              >
                <option value="TRIGGER_DEPLOY">Trigger Deployment (Vercel / Render)</option>
                <option value="RUN_TEST_SUITE">Execute Vitest & Integration Suites</option>
                <option value="AI_LOG_DIAGNOSTICS">Run AI Log Diagnostics Scan</option>
                <option value="POST_SLACK_ALERT">Dispatch Slack/Discord Alert</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>SEQUENCE NAME</label>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="e.g. Slack on Test Failures"
                className="brutalist-input"
              />
            </div>

            <button type="submit" className="brutalist-button" style={{ display: "flex", gap: "0.25rem" }}>
              <Plus size={14} /> Add DevOps Sequence
            </button>
          </form>
        </div>
      </div>

      {/* Active Workflows list */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginTop: "3rem", marginBottom: "1rem" }}>
        Active Automation Rules
      </h4>

      <table className="spec-table">
        <thead>
          <tr className="spec-header-row">
            <th className="spec-cell spec-cell-header">Automation Sequence</th>
            <th className="spec-cell spec-cell-header">Trigger Event</th>
            <th className="spec-cell spec-cell-header">Action Target</th>
            <th className="spec-cell spec-cell-header" style={{ textAlign: "center" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((w) => (
            <tr key={w.id} className="spec-row">
              <td className="spec-cell" style={{ fontWeight: 800 }}>{w.name}</td>
              <td className="spec-cell" style={{ fontFamily: "monospace" }}>{w.trigger}</td>
              <td className="spec-cell" style={{ fontFamily: "monospace" }}>{w.action}</td>
              <td className="spec-cell" style={{ textAlign: "center", cursor: "pointer" }} onClick={() => toggleStatus(w.id)}>
                {w.status ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center", color: "var(--color-success)" }}>
                    <ToggleRight size={20} /> ACTIVE
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center", color: "var(--text-secondary)" }}>
                    <ToggleLeft size={20} /> INACTIVE
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
