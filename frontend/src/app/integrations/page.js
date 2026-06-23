"use client";

import React, { useState } from "react";
import { Plus, Key, Trash2, CheckCircle } from "lucide-react";

export default function Integrations() {
  const [keys, setKeys] = useState([
    { id: "key-1", name: "Nexus CLI Token", hash: "nx_live_3892fbc••••••••••••", permissions: "Admin" }
  ]);
  const [keyName, setKeyName] = useState("");
  const [webhooks, setWebhooks] = useState([
    { id: "wh-1", type: "outbound", url: "https://api.zapier.com/hooks/nexus", event: "build.failed" }
  ]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvent, setWebhookEvent] = useState("build.failed");

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!keyName) return;
    const newKey = {
      id: `key-${Date.now()}`,
      name: keyName,
      hash: `nx_live_${Math.random().toString(36).substring(2, 10)}••••••••`,
      permissions: "Write"
    };
    setKeys((prev) => [...prev, newKey]);
    setKeyName("");
  };

  const handleCreateWebhook = (e) => {
    e.preventDefault();
    if (!webhookUrl) return;
    const newWh = {
      id: `wh-${Date.now()}`,
      type: "outbound",
      url: webhookUrl,
      event: webhookEvent
    };
    setWebhooks((prev) => [...prev, newWh]);
    setWebhookUrl("");
  };

  const handleDeleteKey = (id) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleDeleteWebhook = (id) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const marketplace = [
    { name: "GitHub", desc: "Access repository commits and trigger pipeline builds from push hooks.", connected: true },
    { name: "Vercel", desc: "Automate website deployments and canary releases instantly.", connected: true },
    { name: "Render", desc: "Push docker images and run node api server instances automatically.", connected: true },
    { name: "Slack", desc: "Broadcast build failures, diagnostic outputs, and PR notifications.", connected: false }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      {/* Left Column: Marketplace & Webhooks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Marketplace */}
        <div>
          <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            DevOps Integrations
          </h3>
          <div className="integration-grid">
            {marketplace.map((m) => (
              <div key={m.name} className="integration-card" style={{ border: "1px solid var(--border-color)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.85rem" }}>{m.name}</strong>
                  {m.connected ? (
                    <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--color-success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.15rem" }}>
                      <CheckCircle size={10} /> CONNECTED
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>NOT LINKED</span>
                  )}
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>{m.desc}</p>
                {!m.connected && (
                  <button className="brutalist-button" style={{ padding: "0.25rem 0.5rem", fontSize: "0.65rem", marginTop: "0.25rem" }}>
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Webhooks */}
        <div>
          <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            DevOps Webhook Triggers
          </h3>
          <form onSubmit={handleCreateWebhook} style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="e.g. https://api.myApp.com/webhook"
              className="brutalist-input"
              required
            />
            <select
              value={webhookEvent}
              onChange={(e) => setWebhookEvent(e.target.value)}
              className="brutalist-input"
              style={{ width: "160px" }}
            >
              <option value="build.completed">Build Completed</option>
              <option value="build.failed">Build Failed</option>
              <option value="pr.opened">Pull Request Opened</option>
            </select>
            <button type="submit" className="brutalist-button" style={{ padding: "0.5rem" }}>
              <Plus size={14} /> Add
            </button>
          </form>

          <table className="spec-table">
            <thead>
              <tr className="spec-header-row">
                <th className="spec-cell spec-cell-header">Target Endpoint URL</th>
                <th className="spec-cell spec-cell-header">Event Trigger</th>
                <th className="spec-cell spec-cell-header" style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh) => (
                <tr key={wh.id} className="spec-row">
                  <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{wh.url}</td>
                  <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{wh.event}</td>
                  <td className="spec-cell" style={{ textAlign: "center" }}>
                    <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-failed)" }} onClick={() => handleDeleteWebhook(wh.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: API Keys */}
      <div>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          Client API Credentials
        </h3>

        <form onSubmit={handleGenerateKey} style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key Description (e.g. CLI Production)"
            className="brutalist-input"
            required
          />
          <button type="submit" className="brutalist-button" style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
            <Key size={14} /> Generate Token
          </button>
        </form>

        <table className="spec-table">
          <thead>
            <tr className="spec-header-row">
              <th className="spec-cell spec-cell-header">Token Description</th>
              <th className="spec-cell spec-cell-header">Key Hash</th>
              <th className="spec-cell spec-cell-header">Scope</th>
              <th className="spec-cell spec-cell-header" style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="spec-row">
                <td className="spec-cell" style={{ fontWeight: 700 }}>{k.name}</td>
                <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{k.hash}</td>
                <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{k.permissions}</td>
                <td className="spec-cell" style={{ textAlign: "center" }}>
                  <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-failed)" }} onClick={() => handleDeleteKey(k.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
