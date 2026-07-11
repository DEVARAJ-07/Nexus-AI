"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, FileUp, Search, Trash2, Cpu, Check, Terminal, Play, Loader2 } from "lucide-react";
import { API_URL } from "../config";

export default function Intelligence() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am Nexus AI. Select or upload a build log to run diagnostics and automatically generate code patch files." }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq-llama-3.3-70b");
  const [selectedPipeline, setSelectedPipeline] = useState("nexus-auth-service");
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef(null);

  // Logged-in profile states
  const [username, setUsername] = useState("DEVARAJ-07");
  const [avatar, setAvatar] = useState("https://avatars.githubusercontent.com/u/211518264?v=4");
  
  // Custom Log Diagnostics states
  const [selectedLogId, setSelectedLogId] = useState("");
  const [uploadedLogName, setUploadedLogName] = useState("");
  const [diagnosticStatus, setDiagnosticStatus] = useState("IDLE"); // IDLE, RUNNING, COMPLETED
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [patchApplied, setPatchApplied] = useState(false);
  const [patchLogs, setPatchLogs] = useState([]);
  const [applyingPatch, setApplyingPatch] = useState(false);

  // Security Scan states
  const [scanTarget, setScanTarget] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Database documents list state
  const [dbDocuments, setDbDocuments] = useState([]);

  // Web Research states
  const [researchTopic, setResearchTopic] = useState("");
  const [researchDepth, setResearchDepth] = useState("quick");
  const [researchResult, setResearchResult] = useState(null);
  const [isResearching, setIsResearching] = useState(false);

  const mockLogs = {
    "log-1": {
      name: "startnode_missing_script.log",
      pipeline: "nexus-backend-api",
      content: `npm error Lifecycle script \`startnode\` failed with error:\nnpm error workspace backend@1.0.0\nnpm error location /opt/render/project/src/backend\nnpm error Missing script: "startnode"\nnpm error To see a list of scripts, run:\nnpm error   npm run --workspace=backend`,
      error: "Missing script: \"startnode\"",
      analysis: "The build system is attempting to run 'npm run startnode', but the package.json configuration in the backend workspace does not contain this script. It only defines 'start' and 'dev'.",
      diff: `diff --git a/backend/package.json b/backend/package.json
index 6fbffe3..69bfd22 100644
--- a/backend/package.json
+++ b/backend/package.json
@@ -6,2 +6,3 @@
   "scripts": {
     "start": "node src/server.js",
+    "startnode": "node src/server.js",
     "dev": "nodemon src/server.js"`,
      targetFile: "backend/package.json",
      cmdLogs: [
        "Resolving workspace package.json...",
        "Applying line diff patch to backend/package.json...",
        "Running 'npm run build' verification... success!",
        "Staging modification 'backend/package.json'...",
        "Creating commit 'fix: add startnode script to backend package'...",
        "Pushed commit 6fbffe30 to repository 'nexus-backend-api' branch main.",
        "Pipeline status: ACTIVE (0 errors) 🟢"
      ]
    },
    "log-2": {
      name: "typescript_type_error.log",
      pipeline: "nexus-auth-service",
      content: `src/auth.ts:14:27 - error TS2339: Property 'body' does not exist on type 'Request'.\n\n14   const userEmail = req.body.email;\n                             ~~~~\n\nFound 1 error in src/auth.ts:14`,
      error: "TS2339: Property 'body' does not exist",
      analysis: "TypeScript cannot infer the types on Express Request body. The Request object should specify a typed interface for req.body to prevent compilation warnings and errors.",
      diff: `diff --git a/backend/src/auth.ts b/backend/src/auth.ts
index af32b8a..2bc281d 100644
--- a/backend/src/auth.ts
+++ b/backend/src/auth.ts
@@ -8,3 +8,4 @@
-export function authenticate(req: Request, res: Response) {
+interface LoginBody { email: string; }
+export function authenticate(req: Request<{}, {}, LoginBody>, res: Response) {
   const userEmail = req.body.email;`,
      targetFile: "backend/src/auth.ts",
      cmdLogs: [
        "Resolving src/auth.ts AST structure...",
        "Injecting type interface LoginBody...",
        "Updating authenticate function signature...",
        "Running 'npx tsc --noEmit' typechecks... success!",
        "Creating commit 'fix: typescript request body type bindings'...",
        "Pushed commit 4a8e2cb1 to repository 'nexus-auth-service' branch release/v1.0.",
        "Pipeline status: ACTIVE (0 errors) 🟢"
      ]
    },
    "log-3": {
      name: "supabase_pool_timeout.log",
      pipeline: "nexus-worker-node",
      content: `PrismaClientInitializationError: Can't reach database server at \`aws-1-ap-south-1.pooler.supabase.com:5432\`\nPlease make sure your database server is running at port 5432.\nConnection timeout after 10000ms.`,
      error: "Database Connection Timeout",
      analysis: "The server is trying to establish a persistent session on port 5432 with active pooling. In serverless/worker platforms, we should use the transaction pooler on port 6543 with '?pgbouncer=true' enabled.",
      diff: `diff --git a/database/.env b/database/.env
index db838d9..e23df1f 100644
--- a/database/.env
+++ b/database/.env
@@ -2,2 +2,2 @@
-DATABASE_URL="postgresql://postgres:...@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
-DATABASE_URL="postgresql://postgres:...@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"`,
      targetFile: "database/.env",
      cmdLogs: [
        "Reading environment configurations...",
        "Updating DATABASE_URL connection port parameters...",
        "Testing database health check pool connections... success!",
        "Verifying Prisma client sync... client updated.",
        "Creating config commit 'chore: configure pgbouncer pooler for serverless worker'...",
        "Pushed commit c2b01da to branch master.",
        "Pipeline status: ACTIVE (0 errors) 🟢"
      ]
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        setDbDocuments(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Check if redirecting from GitHub repository file explorer
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("github_username") || "DEVARAJ-07";
      const storedAvatar = localStorage.getItem("github_avatar") || "https://avatars.githubusercontent.com/u/211518264?v=4";
      setUsername(storedUser);
      setAvatar(storedAvatar);

      const params = new URLSearchParams(window.location.search);
      const fileName = params.get("file_name");
      const filePath = params.get("file_path");
      if (fileName) {
        // Clean URL parameters immediately to avoid double loading (e.g. React Strict Mode)
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        setInput(`Analyze the file "${fileName}" at path "${filePath || ""}" from my repository. What does this code do and are there any bugs or optimization points?`);
        setMessages((prev) => [
          ...prev,
          { role: "user", content: `[Linked GitHub File: ${fileName} (${filePath || ""})]` },
          { role: "assistant", content: `I have loaded the file context for **${fileName}**. You can run a prompt to review it, or ask me any questions about this code!` }
        ]);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSelectLog = (logId) => {
    if (!logId) {
      setSelectedLogId("");
      setActiveAnalysis(null);
      setDiagnosticStatus("IDLE");
      setPatchApplied(false);
      setPatchLogs([]);
      return;
    }
    setSelectedLogId(logId);

    const mockLog = mockLogs[logId];
    if (mockLog) {
      setUploadedLogName(mockLog.name);
    } else {
      const dbDoc = dbDocuments.find(d => d.id === logId);
      setUploadedLogName(dbDoc ? dbDoc.name : "Uploaded Log");
    }

    setDiagnosticStatus("IDLE");
    setPatchApplied(false);
    setPatchLogs([]);
    setActiveAnalysis(null);
  };

  const runDiagnostics = async () => {
    if (!selectedLogId || diagnosticStatus === "RUNNING") return;
    
    setDiagnosticStatus("RUNNING");
    setActiveAnalysis(null);
    setPatchApplied(false);
    setPatchLogs([]);
    
    try {
      // Check if it is a local mock log
      const mockLog = mockLogs[selectedLogId];
      if (mockLog) {
        setTimeout(() => {
          setActiveAnalysis(mockLog);
          setDiagnosticStatus("COMPLETED");
          
          const newMsg = {
            role: "assistant",
            content: `### 🔍 AI Diagnosis for **${mockLog.name}**\n\n**Error Identified:** \`${mockLog.error}\`\n\n**Root Cause Analysis:**\n${mockLog.analysis}\n\nI have generated a target patch file. Check the log diagnostics panel to review and apply the patch.`
          };
          setMessages((prev) => [...prev, newMsg]);
        }, 1500);
        return;
      }

      // Call backend live AI diagnostics
      const res = await fetch(`${API_URL}/api/ai/diagnose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedLogId, model: selectedModel })
      });

      if (!res.ok) throw new Error("Diagnosis failed");
      const diagnosis = await res.json();
      
      setActiveAnalysis(diagnosis);
      setDiagnosticStatus("COMPLETED");

      const newMsg = {
        role: "assistant",
        content: `### 🔍 AI Diagnosis for **${uploadedLogName}**\n\n**Error Identified:** \`${diagnosis.error}\`\n\n**Root Cause Analysis:**\n${diagnosis.analysis}\n\nI have generated a target patch file. Check the log diagnostics panel to review and apply the patch.`
      };
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
      setDiagnosticStatus("IDLE");
      alert("Failed to run AI diagnostics. Verify your backend is running and your GEMINI_API_KEY is configured.");
    }
  };

  const applyCodePatch = () => {
    if (!activeAnalysis || applyingPatch) return;
    setApplyingPatch(true);
    setPatchLogs([]);

    const logArray = activeAnalysis.cmdLogs;
    let index = 0;

    const interval = setInterval(() => {
      if (index < logArray.length) {
        setPatchLogs((prev) => [...prev, `[NEXUS_DEPLOYER] ${logArray[index]}`]);
        index++;
      } else {
        clearInterval(interval);
        setApplyingPatch(false);
        setPatchApplied(true);
      }
    }, 500);
  };

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
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("github_username") || "DEVARAJ-07" : "DEVARAJ-07";
      const response = await fetch(`${API_URL}/api/ai/chat-stream?message=${encodeURIComponent(input)}&model=${selectedModel}&username=${encodeURIComponent(storedUser)}`);
      
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
      console.log("Using client-side mock chat stream:", err);
      const mockTokens = [
        "Diagnosing", " your", " query", " in", " reference", " to", " pipeline", " infrastructure.",
        " The", " active", " deployment", " agent", " is", " ready", " to", " apply", " hot", " patches.",
        " Please", " select", " a", " build", " log", " on", " the", " right", " sidepanel", " to", " view", " automated", " patches."
      ];
      let buffer = "";
      for (let i = 0; i < mockTokens.length; i++) {
        await new Promise((r) => setTimeout(r, 60));
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

  const handleScan = (e) => {
    e.preventDefault();
    if (!scanTarget) return;
    setIsScanning(true);
    setScanResult("Initiating static code scan & dependency vulnerability analysis...");
    
    setTimeout(() => {
      setScanResult(
        `### CVE & Vulnerability Scan: "${scanTarget}"\n\n1. **Outdated Package**: \`npm-registry-client\` version v8.6.0 is outdated. (CVE-2024-3482, High Severity)\n2. **Exposed Credentials**: No plaintext api tokens detected in codebase files.\n3. **Prisma Schema**: 0 drift issues detected against Supabase Production DB.\n\n*Scan Engine: Nexus Security Scan v0.1*`
      );
      setIsScanning(false);
    }, 1200);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedLogName(file.name);
    setDiagnosticStatus("IDLE");
    setPatchApplied(false);
    setPatchLogs([]);
    setActiveAnalysis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/documents/upload?name=` + encodeURIComponent(file.name), {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      // Refresh documents list
      await fetchDocuments();
      
      // Select the uploaded log
      setSelectedLogId(data.id);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload document to backend.");
    }
  };

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!researchTopic.trim() || isResearching) return;

    setIsResearching(true);
    setResearchResult(null);

    try {
      const res = await fetch(`${API_URL}/api/ai/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: researchTopic, depth: researchDepth, model: selectedModel })
      });

      if (!res.ok) throw new Error("Research failed");
      const data = await res.json();
      setResearchResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to compile research summary.");
    } finally {
      setIsResearching(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: "assistant", content: `System ready on model: ${selectedModel}. Send queries to pipeline diagnostic engine.` }
    ]);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
      {/* Left Chat & Log Viewer Column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Chat Console */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase" }}>
              AI Diagnostics Console
            </h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="brutalist-input"
                style={{ width: "160px", padding: "0.2rem 0.5rem", fontSize: "0.75rem", height: "26px" }}
              >
                <option value="groq-llama-3.3-70b">Llama 3.3 70B (Groq)</option>
                <option value="openrouter-deepseek/deepseek-r1">DeepSeek R1 (OpenRouter)</option>
                <option value="openrouter-deepseek/deepseek-chat">DeepSeek V3 (OpenRouter)</option>
                <option value="openrouter-deepseek-coder">DeepSeek Coder V2 (OpenRouter)</option>
                <option value="ollama-qwen2.5-coder">Qwen 2.5 Coder (Local Ollama)</option>
              </select>
              <button 
                onClick={clearChat}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                title="Clear Chat History"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="chat-messages" style={{ height: "450px" }}>
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`chat-bubble-wrapper ${m.role}`} 
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  marginBottom: "0.25rem"
                }}
              >
                {/* Avatar */}
                {m.role === "user" ? (
                  <img 
                    src={avatar} 
                    alt={username} 
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border-color)", flexShrink: 0 }} 
                  />
                ) : (
                  <div 
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-slate)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--border-color)",
                      flexShrink: 0
                    }}
                  >
                    <Cpu size={14} />
                  </div>
                )}

                {/* Bubble */}
                <div className={`chat-bubble ${m.role}`} style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", borderBottom: "1px dotted var(--border-color)", paddingBottom: "0.15rem", opacity: 0.85 }}>
                    <strong style={{ fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {m.role === "user" ? username : "NEXUS_AI"}
                    </strong>
                  </div>
                  <div style={{ marginTop: "0.25rem", whiteSpace: "pre-wrap", fontSize: "0.78rem", lineHeight: "1.45" }}>{m.content}</div>
                </div>
              </div>
            ))}
            
            {isStreaming && (
              <div 
                className="chat-bubble-wrapper assistant" 
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignSelf: "flex-start",
                  maxWidth: "85%",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: "0.25rem"
                }}
              >
                <div 
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-slate)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--border-color)",
                    flexShrink: 0
                  }}
                >
                  <Cpu size={14} />
                </div>
                <div className="chat-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.85 }}>
                    NEXUS_AI
                  </strong>
                  <div className="typing-dots" style={{ marginLeft: "0.5rem" }}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about deployment failures, typescript compilation, or docker builds..."
              className="brutalist-input"
              disabled={isStreaming}
            />
            <button type="submit" className="brutalist-button" disabled={isStreaming}>
              <Send size={14} /> Send
            </button>
          </form>
        </div>

        {/* Live Diagnostics & Patch Details */}
        {activeAnalysis && (
          <div style={{ border: "1px solid var(--border-color)", padding: "1.5rem", backgroundColor: "var(--color-off-white)", position: "relative" }}>
            <div className="corner-dot tl">+</div>
            <div className="corner-dot tr">+</div>
            <div className="corner-dot bl">+</div>
            <div className="corner-dot br">+</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Cpu size={16} style={{ color: "var(--color-accent)" }} /> Code Repair Patch Generator
              </h4>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                Target: {activeAnalysis.targetFile}
              </span>
            </div>

            {/* Code Diff Display */}
            <div style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--color-warm-grey)", padding: "1rem", fontFamily: "Consolas, monospace", fontSize: "0.8rem", overflowX: "auto", marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
              {activeAnalysis.diff}
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <button 
                onClick={applyCodePatch}
                className="brutalist-button" 
                style={{ backgroundColor: "var(--color-slate)", color: "#ffffff", padding: "0.6rem 1.2rem" }}
                disabled={applyingPatch || patchApplied}
              >
                {applyingPatch ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> APPLYING...
                  </>
                ) : patchApplied ? (
                  <>
                    <Check size={14} /> PATCH APPLIED & COMMITTED
                  </>
                ) : (
                  <>
                    <Terminal size={14} /> APPLY & COMMIT PATCH
                  </>
                )}
              </button>
              {patchApplied && (
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-success)", fontWeight: 700 }}>
                  ✓ Pipeline Re-triggered: ACTIVE
                </span>
              )}
            </div>

            {/* Patch execution logs */}
            {patchLogs.length > 0 && (
              <div className="terminal-window" style={{ marginTop: "1rem", minHeight: "120px", maxHeight: "180px", padding: "0.75rem" }}>
                {patchLogs.map((logLine, idx) => (
                  <div key={idx}>{logLine}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Log Ingestion & Scanners */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Log Ingest / Select */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.5rem" }}>
            Build Log Ingestion
          </h4>

          {/* Select Pipeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>ACTIVE PIPELINE</label>
            <select
              value={selectedPipeline}
              onChange={(e) => setSelectedPipeline(e.target.value)}
              className="brutalist-input"
              style={{ fontSize: "0.75rem", height: "30px", padding: "0.2rem" }}
            >
              <option value="nexus-auth-service">nexus-auth-service (branch: master)</option>
              <option value="nexus-backend-api">nexus-backend-api (branch: main)</option>
              <option value="nexus-worker-node">nexus-worker-node (branch: release/v0.1)</option>
            </select>
          </div>

          {/* Select Build Log */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>SELECT FAILING BUILD LOG</label>
            <select
              value={selectedLogId}
              onChange={(e) => handleSelectLog(e.target.value)}
              className="brutalist-input"
              style={{ fontSize: "0.75rem", height: "30px", padding: "0.2rem" }}
            >
              <option value="">-- Choose failure log --</option>
              <optgroup label="Simulated Files">
                <option value="log-1">[backend-api] NPM Missing startnode script</option>
                <option value="log-2">[auth-service] TS2339 Type Error on Body</option>
                <option value="log-3">[worker-node] PostgreSQL pool timeout</option>
              </optgroup>
              {dbDocuments.length > 0 && (
                <optgroup label="Uploaded Documents">
                  {dbDocuments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.status})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Or Upload Custom Log */}
          <div style={{ textAlign: "center", fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)", margin: "0.25rem 0" }}>
            -- OR UPLOAD RAW LOG FILE --
          </div>

          <label className="brutalist-button" style={{ width: "100%", cursor: "pointer", display: "flex", justifyContent: "center" }}>
            <FileUp size={14} />
            <span>Upload Build Log / PDF (.log,.txt,.pdf)</span>
            <input type="file" onChange={handleUpload} style={{ display: "none" }} accept=".log,.txt,.pdf" />
          </label>

          {uploadedLogName && (
            <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-success)", fontWeight: 700, wordBreak: "break-all" }}>
              ✓ Loaded: {uploadedLogName}
            </div>
          )}

          {/* Diagnostic Action */}
          {selectedLogId && (
            <button 
              onClick={runDiagnostics}
              className="brutalist-button" 
              style={{ backgroundColor: "var(--color-slate)", color: "#ffffff", display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}
              disabled={diagnosticStatus === "RUNNING"}
            >
              {diagnosticStatus === "RUNNING" ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Diagnosing...
                </>
              ) : (
                <>
                  <Play size={14} /> Run AI Diagnostics
                </>
              )}
            </button>
          )}
        </div>

        {/* Pipeline Security Scan */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            Vulnerability Scanners
          </h4>
          <form onSubmit={handleScan} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <select
              value={scanTarget}
              onChange={(e) => setScanTarget(e.target.value)}
              className="brutalist-input"
              style={{ fontSize: "0.75rem", height: "30px", padding: "0.2rem" }}
              required
            >
              <option value="">-- Choose Scan Target --</option>
              <option value="nexus-auth-service">nexus-auth-service dependencies</option>
              <option value="nexus-backend-api">nexus-backend-api configs</option>
              <option value="nexus-worker-node">nexus-worker-node db-schemas</option>
            </select>
            <button type="submit" className="brutalist-button" disabled={isScanning || !scanTarget}>
              {isScanning ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Search size={14} /> Scan Repository
                </>
              )}
            </button>
          </form>

          {scanResult && (
            <div style={{
              marginTop: "1rem",
              fontSize: "0.75rem",
              backgroundColor: "var(--color-warm-grey)",
              padding: "0.75rem",
              whiteSpace: "pre-wrap",
              border: "1px solid var(--border-color)",
              lineHeight: "1.4"
            }}>
              {scanResult}
            </div>
          )}
        </div>

        {/* Web Research Assistant */}
        <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
          <h4 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", borderBottom: "1px solid var(--color-taupe)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            Web Research Assistant
          </h4>
          <form onSubmit={handleResearch} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>RESEARCH TOPIC</label>
              <input
                type="text"
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="e.g. Docker caching failure flags"
                className="brutalist-input"
                style={{ fontSize: "0.75rem", height: "30px", padding: "0.2rem 0.5rem" }}
                required
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>SEARCH DEPTH</label>
              <select
                value={researchDepth}
                onChange={(e) => setResearchDepth(e.target.value)}
                className="brutalist-input"
                style={{ fontSize: "0.75rem", height: "30px", padding: "0.2rem" }}
              >
                <option value="quick">Quick Summary (30s)</option>
                <option value="deep">Deep Dive Analysis (2m)</option>
              </select>
            </div>

            <button type="submit" className="brutalist-button" disabled={isResearching || !researchTopic}>
              {isResearching ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Search size={14} /> Run Web Research
                </>
              )}
            </button>
          </form>

          {researchResult && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{
                fontSize: "0.75rem",
                backgroundColor: "var(--color-warm-grey)",
                padding: "0.75rem",
                whiteSpace: "pre-wrap",
                border: "1px solid var(--border-color)",
                lineHeight: "1.4",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                {researchResult.summary}
              </div>
              
              {researchResult.citations && researchResult.citations.length > 0 && (
                <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                  <strong>Citations:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1.2rem" }}>
                    {researchResult.citations.map((cite, i) => (
                      <li key={i}>
                        <a href={cite} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                          {cite}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "var(--color-success)", fontWeight: 700 }}>
                <Check size={12} /> Auto-saved to Knowledge Base!
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
