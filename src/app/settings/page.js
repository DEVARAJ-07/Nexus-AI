"use client";

import { useState } from "react";
import { Save, Shield, Cpu, RefreshCw, KeyRound } from "lucide-react";

export default function Settings() {
  const [githubToken, setGithubToken] = useState("ghp_************************************");
  const [vercelToken, setVercelToken] = useState("vct_************************************");
  const [webhookUrl, setWebhookUrl] = useState("https://api.outpost-cicd.com/v1/webhooks/trigger");
  const [runnerType, setRunnerType] = useState("node-standard-x86");
  const [concurrency, setConcurrency] = useState("4");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    // Simulate saving settings
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("SETTINGS SERIALIZED AND PROPAGATED TO RUNNERS.");
    }, 1200);
  };

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <section className="spec-section" style={{ margin: "1rem 0 3rem 0" }}>
        <div className="spec-header hairline-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>RUNNER CONFIGURATION</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>SECURE BYOK VAULT</span>
        </div>

        <form onSubmit={handleSave} className="settings-grid">
          {/* Secrets Vault */}
          <div className="settings-group">
            <span className="settings-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <KeyRound size={16} /> API SECRETS VAULT
            </span>
            <p className="settings-desc">
              Sensitive credentials used during build and deployment stages. Values are write-only and encrypted at rest.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>GITHUB_API_TOKEN</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="brutalist-input"
                  placeholder="ghp_..."
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>VERCEL_AUTH_TOKEN</label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  className="brutalist-input"
                  placeholder="vct_..."
                />
              </div>
            </div>
          </div>

          {/* Webhook trigger */}
          <div className="settings-group hairline-top" style={{ paddingTop: "2rem" }}>
            <span className="settings-label">WEBHOOK TRIGGER ENDPOINT</span>
            <p className="settings-desc">
              Send POST requests containing payload hashes to this URL to trigger automated runs.
            </p>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="brutalist-input"
            />
          </div>

          {/* Compute allocation */}
          <div className="settings-group hairline-top" style={{ paddingTop: "2rem" }}>
            <span className="settings-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={16} /> COMPUTE RUNNER PROFILES
            </span>
            <p className="settings-desc">
              Specify node architecture types allocated for execution processes.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flexGrow: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>RUNNER TYPE</label>
                <select
                  value={runnerType}
                  onChange={(e) => setRunnerType(e.target.value)}
                  className="brutalist-select"
                >
                  <option value="node-standard-x86">node-standard-x86 (Intel 4 vCPU, 8GB RAM)</option>
                  <option value="node-highmem-arm">node-highmem-arm (Ampere 8 vCPU, 16GB RAM)</option>
                  <option value="node-compute-gpu">node-compute-gpu (NVIDIA T4, 16GB RAM)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "120px" }}>
                <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>CONCURRENCY LIMIT</label>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(e.target.value)}
                  className="brutalist-select"
                >
                  <option value="1">1 Thread</option>
                  <option value="2">2 Threads</option>
                  <option value="4">4 Threads</option>
                  <option value="8">8 Threads</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action button and status */}
          <div className="hairline-top" style={{ paddingTop: "2rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <button
              type="submit"
              disabled={isSaving}
              className="action-button"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? "SAVING..." : "COMMIT CHANGES"}
            </button>

            {saveMessage && (
              <span style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "var(--color-success)",
                fontWeight: 700
              }}>
                [OK] {saveMessage}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
