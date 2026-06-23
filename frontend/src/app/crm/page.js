"use client";

import React, { useState } from "react";
import { UserPlus, FileSpreadsheet, Award } from "lucide-react";

export default function CRM() {
  const [contacts, setContacts] = useState([
    { id: "lead-1", name: "Sarah Connor", email: "sarah@skynet.com", company: "Cyberdyne Systems", stage: "QUALIFIED", score: 94 },
    { id: "lead-2", name: "Miles Dyson", email: "miles@dyson-tech.io", company: "Cyberdyne Systems", stage: "NEW", score: 62 },
    { id: "lead-3", name: "John Connor", email: "john@resistance.net", company: "Resistance HQ", stage: "CONTACTED", score: 88 },
    { id: "lead-4", name: "Marcus Wright", email: "marcus@project-angel.org", company: "Project Angel", stage: "PROPOSAL", score: 45 },
    { id: "lead-5", name: "T-800 Model 101", email: "cyberdyne101@skynet.com", company: "Cyberdyne Systems", stage: "WON", score: 99 }
  ]);

  const stages = [
    { id: "NEW", name: "New" },
    { id: "CONTACTED", name: "Contacted" },
    { id: "QUALIFIED", name: "Qualified" },
    { id: "PROPOSAL", name: "Proposal" },
    { id: "WON", name: "Closed Won" }
  ];

  const getContactsInStage = (stageId) => {
    return contacts.filter((c) => c.stage === stageId);
  };

  // Mock dragging leads
  const moveStage = (id, newStage) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c))
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>CRM & Lead Engine</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            AI lead scoring based on interaction history & workspace documents data patterns.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="brutalist-button" style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem" }}>
            <UserPlus size={14} /> Add Lead
          </button>
          <button className="brutalist-button" style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "transparent" }}>
            <FileSpreadsheet size={14} /> Import CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-warm-grey)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TOTAL LEADS</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{contacts.length}</div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-warm-grey)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>HOT LEADS (SCORE &gt; 80)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-failed)" }}>
            {contacts.filter((c) => c.score >= 80).length}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-warm-grey)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>CLOSED WON</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>
            {contacts.filter((c) => c.stage === "WON").length}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "var(--color-warm-grey)" }}>
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>CONVERSION RATE</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>20%</div>
        </div>
      </div>

      {/* Kanban Board */}
      <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-taupe)", marginBottom: "1rem" }}>
        Pipeline Stages (Kanban)
      </h4>

      <div className="kanban-board">
        {stages.map((stage) => (
          <div key={stage.id} className="kanban-column">
            <div className="kanban-column-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{stage.name}</span>
              <span>{getContactsInStage(stage.id).length}</span>
            </div>

            {getContactsInStage(stage.id).map((c) => (
              <div key={c.id} className="kanban-card">
                <div style={{ fontWeight: 800, fontSize: "0.8rem" }}>{c.name}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{c.company}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: c.score >= 80 ? "var(--color-failed)" : "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}>
                    <Award size={10} /> Score: {c.score}
                  </span>
                  
                  {/* Stage Selector */}
                  <select
                    value={c.stage}
                    onChange={(e) => moveStage(c.id, e.target.value)}
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
