"use client";

import React, { useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Info } from "lucide-react";

export default function Automation() {
  const [workflows, setWorkflows] = useState([
    { id: "wf-1", name: "Welcome New Lead Sequence", trigger: "NEW_CONTACT", action: "SEND_EMAIL", status: true },
    { id: "wf-2", name: "Slack Alert for Hot Leads", trigger: "STAGE_CHANGED", action: "NOTIFY_SLACK", status: false }
  ]);
  const [selectedTrigger, setSelectedTrigger] = useState("NEW_CONTACT");
  const [selectedAction, setSelectedAction] = useState("SEND_EMAIL");

  const toggleStatus = (id) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: !w.status } : w))
    );
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newWf = {
      id: `wf-${Date.now()}`,
      name: `Automation Sequence ${workflows.length + 1}`,
      trigger: selectedTrigger,
      action: selectedAction,
      status: false
    };
    setWorkflows((prev) => [...prev, newWf]);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Automation Forge</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Visual trigger-action workflow canvas. Connect events to instant tasks across modules.
          </p>
        </div>
      </div>

      <div className="flow-canvas">
        {/* Drag and Drop Canvas Simulation */}
        <div>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "1rem" }}>
            Visual Builder Canvas
          </h4>
          <div className="canvas-area">
            {/* Trigger node */}
            <div className="canvas-node" style={{ top: "10%", left: "10%", borderStyle: "dashed" }}>
              ⚡ TRIGGER: {selectedTrigger}
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
              <Info size={12} /> Canvas displays the trigger-action mapping. Commit changes below.
            </div>
          </div>
        </div>

        {/* Configurations Sidepanel */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.5rem" }}>
            Node Configurator
          </h4>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TRIGGER EVENT</label>
              <select
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value)}
                className="brutalist-input"
                style={{ height: "36px" }}
              >
                <option value="NEW_CONTACT">New Lead Added</option>
                <option value="STAGE_CHANGED">CRM Stage Changed</option>
                <option value="CONTENT_PUBLISHED">Content Published</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>ACTION TASK</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="brutalist-input"
                style={{ height: "36px" }}
              >
                <option value="SEND_EMAIL">Send Email via Resend</option>
                <option value="NOTIFY_SLACK">Dispatch Slack Alert</option>
                <option value="CREATE_CONTENT">Generate Content Studio draft</option>
              </select>
            </div>

            <button type="submit" className="brutalist-button" style={{ display: "flex", gap: "0.25rem" }}>
              <Plus size={14} /> Add Workflow
            </button>
          </form>
        </div>
      </div>

      {/* Active Workflows list */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginTop: "3rem", marginBottom: "1rem" }}>
        Active Workflow Triggers
      </h4>

      <table className="spec-table">
        <thead>
          <tr className="spec-header-row">
            <th className="spec-cell spec-cell-header">Workflow Name</th>
            <th className="spec-cell spec-cell-header">Trigger Event</th>
            <th className="spec-cell spec-cell-header">Action Task</th>
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
