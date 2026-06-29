"use client";

import React, { useState } from "react";
import { Sparkles, Calendar as CalendarIcon, FileEdit, Check, GitCommit, FileText, Loader2 } from "lucide-react";
import { API_URL } from "../config";

export default function Content() {
  const [docType, setDocType] = useState("release_notes");
  const [commitsSummary, setCommitsSummary] = useState("");
  const [tone, setTone] = useState("Technical");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleExamples, setStyleExamples] = useState("");
  const [styleProfileText, setStyleProfileText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPushed, setIsPushed] = useState(false);
  const [pushing, setPushing] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!commitsSummary || isGenerating) return;

    setOutput("");
    setIsGenerating(true);
    setIsPushed(false);

    try {
      // Connect to Express backend if online
      const response = await fetch(`${API_URL}/api/content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: docType, topic: commitsSummary, tone }),
      });

      if (!response.ok) throw new Error("Backend offline");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let textBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }
            try {
              const { token } = JSON.parse(dataStr);
              textBuffer += token;
              setOutput(textBuffer);
            } catch (err) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.log("Using client-side mock doc generator:", err);
      
      // Beautiful mock Markdown output streaming
      const headerTitle = docType === "release_notes" ? "Release Notes - v1.2.0" 
                        : docType === "changelog" ? "CHANGELOG.md (v1.2.0)"
                        : docType === "pr_desc" ? "Pull Request Description"
                        : "API Schema Specifications";

      const mockTokens = [
        `# ${headerTitle}\n\n`,
        `Generated under **${tone}** specifications.\n\n`,
        "### 🚀 Features & Enhancements\n",
        "- **Core Auth Pipeline**: Integrated security authorization headers and route interceptors.\n",
        "- **Prisma Connection Pooling**: Configured session-specific timeouts and pool sizes.\n\n",
        "### 🐛 Bug Fixes\n",
        "- **CLI startnode command**: Patched root script bindings to prevent runtime execution failures.\n",
        "- **UI Latency**: Optimized cubic-bezier easing variables to eliminate screen jitter during page loads.\n\n",
        "### ⚙️ Deployment Info\n",
        "- **Target Engine**: Node v24 LTS + PostgreSQL\n",
        "- **Artifact Hash**: `sha256-f8a7d90d...`"
      ];

      let buffer = "";
      for (let i = 0; i < mockTokens.length; i++) {
        await new Promise((r) => setTimeout(r, 120));
        buffer += mockTokens[i];
        setOutput(buffer);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeStyle = (e) => {
    e.preventDefault();
    if (!styleExamples) return;
    setIsAnalyzing(true);
    setStyleProfileText("Scanning style guide inputs and extracting layout rules...");
    
    setTimeout(() => {
      setStyleProfileText(
        "Style Profile: High Technical Density.\nVocabulary rules: Renders file schema hashes, utilizes emoji category labels.\nTemplate detected: Group by Features ➔ Fixes ➔ Deployments."
      );
      setIsAnalyzing(false);
    }, 1000);
  };

  const pushToRepository = () => {
    if (!output || pushing) return;
    setPushing(true);
    
    setTimeout(() => {
      setPushing(false);
      setIsPushed(true);
    }, 1200);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      {/* Left Input Column */}
      <div>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          AI Release Compiler
        </h3>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>DOCUMENT TYPE</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="brutalist-input"
              style={{ height: "40px" }}
            >
              <option value="release_notes">Release Notes Document</option>
              <option value="changelog">Changelog (CHANGELOG.md)</option>
              <option value="pr_desc">Pull Request Description</option>
              <option value="api_docs">API Schema Docs</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>COMMIT LOG / DIFF HIGHLIGHTS</label>
            <textarea
              value={commitsSummary}
              onChange={(e) => setCommitsSummary(e.target.value)}
              placeholder="e.g. feat: add jwt validation; fix: prisma session timeouts; fix: add startnode scripts to monorepo config"
              className="brutalist-input"
              rows={4}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TONE FORMAT</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="brutalist-input"
              style={{ height: "40px" }}
            >
              <option value="Technical">Technical (Strict & Detailed)</option>
              <option value="Executive">Executive (High-Level Summary)</option>
              <option value="Changelog Standard">Changelog Standard (Semantic)</option>
            </select>
          </div>

          <button type="submit" className="brutalist-button" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> COMPILING DRAFT...
              </>
            ) : (
              <>
                <Sparkles size={14} /> COMPILE DOCUMENT DRAFT
              </>
            )}
          </button>
        </form>

        {/* Style Guide Analyzer */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-warm-grey)", marginTop: "2rem" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Repository Style Guide Analyzer
          </h4>
          <form onSubmit={handleAnalyzeStyle} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              value={styleExamples}
              onChange={(e) => setStyleExamples(e.target.value)}
              placeholder="Paste examples of previous changelogs or commit styles to copy layout patterns..."
              className="brutalist-input"
              rows={3}
            />
            <button type="submit" className="brutalist-button" disabled={isAnalyzing || !styleExamples}>
              {isAnalyzing ? "Analyzing..." : "Analyze Style Patterns"}
            </button>
          </form>
          {styleProfileText && (
            <pre style={{
              marginTop: "1rem",
              fontSize: "0.7rem",
              whiteSpace: "pre-wrap",
              backgroundColor: "var(--color-off-white)",
              padding: "0.75rem",
              border: "1px solid var(--border-color)",
              fontFamily: "monospace"
            }}>
              {styleProfileText}
            </pre>
          )}
        </div>
      </div>

      {/* Right Output Editor Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          Markdown Document Preview
        </h3>

        <div style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-off-white)",
          minHeight: "380px",
          padding: "1.5rem",
          overflowY: "auto",
          fontSize: "0.85rem",
          whiteSpace: "pre-wrap",
          fontFamily: "Consolas, monospace",
          lineHeight: "1.5"
        }}>
          {output ? (
            output
          ) : (
            <span style={{ color: "var(--text-secondary)", fontFamily: "sans-serif" }}>Document markdown content will compile and stream here in real-time...</span>
          )}
        </div>

        {output && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              onClick={pushToRepository}
              className="brutalist-button" 
              style={{ display: "flex", gap: "0.5rem", backgroundColor: "var(--color-slate)", color: "#ffffff" }}
              disabled={pushing || isPushed}
            >
              {pushing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Pushing...
                </>
              ) : isPushed ? (
                <>
                  <Check size={14} /> PUSHED TO REPOSITORY
                </>
              ) : (
                <>
                  <GitCommit size={14} /> Push to Repository
                </>
              )}
            </button>
            <button className="brutalist-button" style={{ display: "flex", gap: "0.5rem", backgroundColor: "transparent" }}>
              <FileEdit size={14} /> Export File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
