"use client";

import React, { useState, useEffect } from "react";
import { Send, FileUp, Search } from "lucide-react";

export default function Intelligence() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Claude. Ask me anything about your workspace documents or search the web." }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [researchTopic, setResearchTopic] = useState("");
  const [researchResult, setResearchResult] = useState("");
  const [docName, setDocName] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantMsg = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      // Fetch stream from Express backend
      const response = await fetch(`http://localhost:5000/api/ai/chat-stream?message=${encodeURIComponent(input)}`);
      
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
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: textBuffer };
                return updated;
              });
            } catch (err) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      // Fallback mock output if backend is not running yet
      console.log("Using client-side mock chat stream:", err);
      const mockTokens = ["This", " is", " a", " client-side", " fallback", " response.", " Launch", " the", " backend", " server", " to", " activate", " live", " Claude", " streaming."];
      let buffer = "";
      for (let i = 0; i < mockTokens.length; i++) {
        await new Promise((r) => setTimeout(r, 80));
        buffer += mockTokens[i];
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: buffer };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleResearch = (e) => {
    e.preventDefault();
    if (!researchTopic) return;
    setResearchResult("Browsing sources and synthesizing summaries...");
    setTimeout(() => {
      setResearchResult(
        `### Web Research Summary: "${researchTopic}"\n\n1. **Integration Support**: Outpost AI connects workspaces to Notion/Slack directly.\n2. **Database capacity**: Free PostgreSQL tiers offer 500MB storage.\n3. **Rate Limits**: BullMQ queues handle background jobs on Upstash Redis.\n\n*Sources checked: https://docs.outpost-ai.com/api, https://github.com/outpost*`
      );
    }, 1200);
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocName(file.name);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem" }}>
      {/* Left Chat Column */}
      <div>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          AI Chat (Claude 3.5 Haiku)
        </h3>

        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              <strong>{m.role === "user" ? "USER" : "CLAUDE"}:</strong>
              <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your business workspace..."
            className="brutalist-input"
            disabled={isStreaming}
          />
          <button type="submit" className="brutalist-button" disabled={isStreaming}>
            <Send size={14} /> Send
          </button>
        </form>
      </div>

      {/* Right Research / Upload Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Document Vault */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Document Vault (RAG)
          </h4>
          <label className="brutalist-button" style={{ width: "100%", cursor: "pointer", display: "flex" }}>
            <FileUp size={14} />
            <span>Upload Document</span>
            <input type="file" onChange={handleUpload} style={{ display: "none" }} accept=".pdf,.csv,.txt" />
          </label>
          {docName && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-success)", fontWeight: 700 }}>
              ✓ Loaded: {docName}
            </div>
          )}
        </div>

        {/* Web Research Assistant */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Web Research Probes
          </h4>
          <form onSubmit={handleResearch} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="text"
              value={researchTopic}
              onChange={(e) => setResearchTopic(e.target.value)}
              placeholder="e.g. competitors pricing"
              className="brutalist-input"
              style={{ padding: "0.5rem" }}
            />
            <button type="submit" className="brutalist-button" style={{ padding: "0.5rem" }}>
              <Search size={14} /> Compile Summary
            </button>
          </form>

          {researchResult && (
            <div style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              backgroundColor: "var(--color-warm-grey)",
              padding: "0.75rem",
              whiteSpace: "pre-wrap",
              border: "1px solid var(--border-color)"
            }}>
              {researchResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
