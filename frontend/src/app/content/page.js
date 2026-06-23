"use client";

import React, { useState } from "react";
import { Sparkles, Calendar as CalendarIcon, FileEdit } from "lucide-react";

export default function Content() {
  const [contentType, setContentType] = useState("blog");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandExamples, setBrandExamples] = useState("");
  const [brandVoiceText, setBrandVoiceText] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic || isGenerating) return;

    setOutput("");
    setIsGenerating(true);

    try {
      const response = await fetch("http://localhost:5000/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType, topic, tone }),
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
      console.log("Using client-side mock content generator:", err);
      const mockTokens = [
        `<h1>${topic}</h1>`,
        "<p>Generated under a corporate tone profile.</p>",
        "<p>Context switching takes away valuable product building hours.</p>",
        "<p>Centralizing workspaces under Outpost AI enables startups to operate at extreme velocity.</p>"
      ];
      let buffer = "";
      for (let i = 0; i < mockTokens.length; i++) {
        await new Promise((r) => setTimeout(r, 120));
        buffer += mockTokens[i] + " ";
        setOutput(buffer);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBrandVoice = (e) => {
    e.preventDefault();
    if (!brandExamples) return;
    setBrandVoiceText("Analyzing style guide examples...");
    setTimeout(() => {
      setBrandVoiceText(
        "Tone Profile: Technical, Direct.\nVocabulary patterns: monorepo, workspaces, fast-builds.\nStyle description: Short sentences with bullet points and bold headers."
      );
    }, 1000);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      {/* Left Input Column */}
      <div>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          AI Content Generator
        </h3>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>CONTENT TYPE</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="brutalist-input"
              style={{ height: "40px" }}
            >
              <option value="blog">Blog / Article</option>
              <option value="social">Social Caption (LinkedIn / Twitter)</option>
              <option value="email">Email Sequence</option>
              <option value="ad">Ad Copy</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TOPIC / KEYWORDS</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Why workspaces monorepo structure makes tsc clean"
              className="brutalist-input"
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>TONE</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="brutalist-input"
              style={{ height: "40px" }}
            >
              <option value="Professional">Professional</option>
              <option value="Bold">Bold</option>
              <option value="Casual">Casual</option>
            </select>
          </div>

          <button type="submit" className="brutalist-button" disabled={isGenerating}>
            <Sparkles size={14} /> {isGenerating ? "GENERATING..." : "COMPILE DRAFT"}
          </button>
        </form>

        {/* Brand Voice analysis */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-warm-grey)", marginTop: "2rem" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Brand Voice training
          </h4>
          <form onSubmit={handleBrandVoice} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              value={brandExamples}
              onChange={(e) => setBrandExamples(e.target.value)}
              placeholder="Paste 3+ content examples of your team's tone..."
              className="brutalist-input"
              rows={3}
            />
            <button type="submit" className="brutalist-button">
              Analyze Tone
            </button>
          </form>
          {brandVoiceText && (
            <pre style={{
              marginTop: "1rem",
              fontSize: "0.7rem",
              whiteSpace: "pre-wrap",
              backgroundColor: "var(--color-off-white)",
              padding: "0.75rem",
              border: "1px solid var(--border-color)"
            }}>
              {brandVoiceText}
            </pre>
          )}
        </div>
      </div>

      {/* Right Output Editor Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          TipTap Rich-Text Editor
        </h3>

        <div style={{
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-off-white)",
          minHeight: "350px",
          padding: "1.5rem",
          overflowY: "auto",
          fontSize: "0.85rem"
        }}>
          {output ? (
            <div dangerouslySetInnerHTML={{ __html: output }} />
          ) : (
            <span style={{ color: "var(--text-secondary)" }}>Draft output will stream here in real-time...</span>
          )}
        </div>

        {output && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="brutalist-button" style={{ display: "flex", gap: "0.5rem" }}>
              <CalendarIcon size={14} /> Schedule Post
            </button>
            <button className="brutalist-button" style={{ display: "flex", gap: "0.5rem", backgroundColor: "transparent" }}>
              <FileEdit size={14} /> Save Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
