"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Terminal as TerminalIcon, Eye, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [terminalText, setTerminalText] = useState("");
  const [step, setStep] = useState(0);
  const [selectedPipeline, setSelectedPipeline] = useState("frontend-app");

  const asciiLogo = `
  ___  _   _ _____ ____   ___  ____ _____
 / _ \\| | | |_   _|  _ \\ / _ \\/ ___|_   _|
| | | | | | | | | | |_) | | | \\___ \\ | |
| |_| | |_| | | | |  __/| |_| |___) || |
 \\___/ \\___/  |_| |_|    \\___/|____/ |_|
  `;

  const logs = {
    "frontend-app": [
      { text: "$ outpost run --id frontend-app --branch main", type: "cmd" },
      { text: "[INIT] Provisioning Node.js v20.10.0 runtime environment on runner node-04...", type: "system" },
      { text: "[CLONE] git clone git@github.com:outpost-ai/frontend-app.git --depth=1", type: "system" },
      { text: "[CLONE] Head branch is main, commit 8f9a2c3b (author: @johndoe)", type: "system" },
      { text: "[BUILD] npm install --frozen-lockfile", type: "system" },
      { text: "   -> added 338 packages in 4.22s", type: "muted" },
      { text: "[TEST] npm run test:ci", type: "system" },
      { text: "   -> ✓ components/Navbar.test.js (152ms)", type: "success" },
      { text: "   -> ✓ utils/api.test.js (84ms)", type: "success" },
      { text: "   -> ✓ pages/dashboard.test.js (294ms)", type: "success" },
      { text: "   -> PASS: 3 / 3 test suites passed", type: "success" },
      { text: "[BUILD] npm run build", type: "system" },
      { text: "   -> Route (app)      Size     First Load JS", type: "muted" },
      { text: "   -> ┌ ○ /            5.12 kB        84.1 kB", type: "muted" },
      { text: "   -> └ ○ /history     2.34 kB        81.3 kB", type: "muted" },
      { text: "[DEPLOY] npx vercel --prod --token=******", type: "system" },
      { text: "   -> Uploading assets...", type: "muted" },
      { text: "   -> Production deploy live at: https://outpost-frontend.vercel.app", type: "success" },
      { text: "[SUCCESS] Pipeline run 8f9a2c3b completed successfully in 14.88s.", type: "success" }
    ],
    "api-service": [
      { text: "$ outpost run --id api-service --branch main", type: "cmd" },
      { text: "[INIT] Provisioning Go 1.21 container on runner node-02...", type: "system" },
      { text: "[CLONE] git clone git@github.com:outpost-ai/api-service.git --depth=1", type: "system" },
      { text: "[CLONE] Head branch is main, commit a4b5c6d7 (author: @alex-dev)", type: "system" },
      { text: "[BUILD] go build -v -o main ./cmd/api", type: "system" },
      { text: "   -> compiled 82 dependencies in 3.12s", type: "muted" },
      { text: "[TEST] go test -v ./...", type: "system" },
      { text: "   -> === RUN   TestCreateUser", type: "muted" },
      { text: "   -> --- PASS: TestCreateUser (0.02s)", type: "success" },
      { text: "   -> === RUN   TestAuthenticate", type: "muted" },
      { text: "   -> --- PASS: TestAuthenticate (0.01s)", type: "success" },
      { text: "   -> PASS: all tests verified successfully.", type: "success" },
      { text: "[DOCKER] docker build -t outpost/api:a4b5c6d7 .", type: "system" },
      { text: "   -> Step 1/5 : FROM alpine:3.18", type: "muted" },
      { text: "   -> Step 5/5 : ENTRYPOINT [\"/app/main\"]", type: "muted" },
      { text: "[DEPLOY] pushing tag to Amazon ECR...", type: "system" },
      { text: "   -> Image pushed: 9812480218.dkr.ecr.us-east-1.amazonaws.com/api:a4b5c6d7", type: "success" },
      { text: "[DEPLOY] Updating K8s deployment spec to use image a4b5c6d7...", type: "system" },
      { text: "   -> Deployment api-service-deployment configured successfully.", type: "success" },
      { text: "[SUCCESS] Pipeline run a4b5c6d7 completed successfully in 18.45s.", type: "success" }
    ],
    "mobile-android": [
      { text: "$ outpost run --id mobile-android --branch develop", type: "cmd" },
      { text: "[INIT] Provisioning Android SDK build-tools 34.0.0 on runner node-09...", type: "system" },
      { text: "[CLONE] git clone git@github.com:outpost-ai/mobile-android.git --depth=1", type: "system" },
      { text: "[CLONE] Head branch is develop, commit c9d8e7f6 (author: @bob-mobile)", type: "system" },
      { text: "[BUILD] ./gradlew assembleDebug", type: "system" },
      { text: "   -> Configure project :app", type: "muted" },
      { text: "   -> Task :app:compileDebugJavaWithJavac FAILED", type: "failed" },
      { text: "   -> error: package com.outpost.analytics does not exist", type: "failed" },
      { text: "   -> import com.outpost.analytics.Tracker;", type: "failed" },
      { text: "   -> 1 error found.", type: "failed" },
      { text: "   -> BUILD FAILED in 12.04s", type: "failed" },
      { text: "[ERROR] Compilation failed. Skipping test and deployment stages.", type: "failed" },
      { text: "[FAILED] Pipeline run c9d8e7f6 failed to complete.", type: "failed" }
    ]
  };

  useEffect(() => {
    setTerminalText("");
    setStep(0);
  }, [selectedPipeline]);

  useEffect(() => {
    const pipelineLogs = logs[selectedPipeline];
    if (step < pipelineLogs.length) {
      const currentLog = pipelineLogs[step];
      const timer = setTimeout(() => {
        setTerminalText((prev) => prev + (prev ? "\n" : "") + currentLog.text);
        setStep((prev) => prev + 1);
      }, currentLog.type === "cmd" ? 400 : 250);
      return () => clearTimeout(timer);
    }
  }, [step, selectedPipeline]);

  const triggerPipeline = (id) => {
    setSelectedPipeline(id);
  };

  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <pre className="ascii-art">{asciiLogo}</pre>
          <h1 className="hero-title">OutPost CI/CD</h1>
          <p className="hero-subtitle">
            Concurrently execute builds, test suites, and deployments. High-performance, isolated container environments engineered for extreme development speed.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/history" className="action-button">
              View History
            </Link>
            <Link href="/settings" className="action-button" style={{ backgroundColor: "transparent" }}>
              Configure Run Settings
            </Link>
          </div>
        </div>
      </section>

      {/* Terminal logs panel */}
      <div className="terminal-container">
        <div className="terminal-header">
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TerminalIcon size={14} />
            LIVE BUFFER [{selectedPipeline}]
          </span>
          <span style={{ fontFamily: "monospace" }}>
            OUTPOST [v0.8.2]
          </span>
        </div>
        <div className="terminal-body">
          {terminalText.split("\n").map((line, idx) => {
            let className = "terminal-muted";
            if (line.startsWith("$")) className = "terminal-highlight";
            else if (line.includes("[SUCCESS]") || line.includes("PASS") || line.includes("PASS:") || line.includes("✓")) className = "terminal-success";
            else if (line.includes("[FAILED]") || line.includes("FAILED") || line.includes("error:") || line.includes("[ERROR]")) className = "terminal-failed";
            else if (line.includes("[INIT]") || line.includes("[CLONE]") || line.includes("[BUILD]") || line.includes("[TEST]") || line.includes("[DEPLOY]") || line.includes("[DOCKER]")) className = "terminal-highlight";

            return (
              <div key={idx} className={className}>
                {line}
              </div>
            );
          })}
          {step < logs[selectedPipeline].length && <span className="cursor-blink" />}
        </div>
      </div>

      {/* Spec Table listing active pipelines */}
      <section className="spec-section">
        <div className="spec-header hairline-bottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>ACTIVE PIPELINES</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>3 PROJECTS CONFIGURED</span>
        </div>
        <div className="spec-table">
          {/* Row 1: Frontend App */}
          <div className="spec-row hairline-bottom">
            <div className="spec-cell spec-id hairline-right">1.01</div>
            <div className="spec-cell spec-title hairline-right">frontend-app</div>
            <div className="spec-cell spec-desc hairline-right">
              React SPA. Compiles assets, runs unit tests via Vitest, and deploys to Vercel hosting edge nodes.
            </div>
            <div className="spec-cell spec-action">
              <button
                onClick={() => triggerPipeline("frontend-app")}
                className="action-button"
                style={{ width: "100%", padding: "0.4rem", fontSize: "0.7rem", display: "flex", gap: "0.25rem" }}
              >
                {selectedPipeline === "frontend-app" ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                {selectedPipeline === "frontend-app" ? "RUNNING" : "TRIGGER"}
              </button>
            </div>
          </div>

          {/* Row 2: API Service */}
          <div className="spec-row hairline-bottom">
            <div className="spec-cell spec-id hairline-right">1.02</div>
            <div className="spec-cell spec-title hairline-right">api-service</div>
            <div className="spec-cell spec-desc hairline-right">
              Go backend API. Runs test packages, builds statically-linked binaries, packages to Docker, pushes to ECR.
            </div>
            <div className="spec-cell spec-action">
              <button
                onClick={() => triggerPipeline("api-service")}
                className="action-button"
                style={{ width: "100%", padding: "0.4rem", fontSize: "0.7rem", display: "flex", gap: "0.25rem" }}
              >
                {selectedPipeline === "api-service" ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                {selectedPipeline === "api-service" ? "RUNNING" : "TRIGGER"}
              </button>
            </div>
          </div>

          {/* Row 3: Android App */}
          <div className="spec-row">
            <div className="spec-cell spec-id hairline-right">1.03</div>
            <div className="spec-cell spec-title hairline-right">mobile-android</div>
            <div className="spec-cell spec-desc hairline-right">
              Kotlin application. Resolves Gradle tasks, compiles bundle apks, tests integrations.
            </div>
            <div className="spec-cell spec-action">
              <button
                onClick={() => triggerPipeline("mobile-android")}
                className="action-button"
                style={{ width: "100%", padding: "0.4rem", fontSize: "0.7rem", display: "flex", gap: "0.25rem" }}
              >
                {selectedPipeline === "mobile-android" ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                {selectedPipeline === "mobile-android" ? "RUNNING" : "TRIGGER"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ASCII Architectural Flowchart */}
      <section className="architecture-section">
        <div className="spec-header hairline-bottom">SYSTEM FLOW</div>
        <div className="arch-canvas">
          <pre className="arch-ascii">{`
+------------------+     +------------------+     +------------------+
|   1. TRIGGER     |     |   2. QUEUEING    |     |    3. RUNNER     |
|   Webhook/CLI    | ==> |   FastAPI Queue  | ==> |   Docker Node    |
|   Inject Secrets |     |   Auths request  |     |   Loads Env      |
+------------------+     +------------------+     +------------------+
                                                           ||
                                                           || (parallel evaluation)
                                                           vv
                                                +----------------------+
                                                |   - build_job        |
                                                |   - test_job         |
                                                |   - deploy_job       |
                                                +----------------------+
                                                           ||
                                                           || (aggregates results)
                                                           vv
                                                +----------------------+
                                                |  4. LOG STREAM       |
                                                |  Saves to Database   |
                                                |  Updates CLI / Web   |
                                                +----------------------+
          `}</pre>
        </div>
        <div className="arch-details">
          <ul className="arch-list">
            <li className="arch-list-item">
              <span className="arch-item-num">1.01</span>
              <div>
                <strong className="arch-item-strong">TRIGGER PROTOCOL:</strong>
                A commit push, pull request, or CLI invocation triggers the runner. Any local environment secrets are securely loaded into the context.
              </div>
            </li>
            <li className="arch-list-item">
              <span className="arch-item-num">1.02</span>
              <div>
                <strong className="arch-item-strong">QUEUE DISPATCH:</strong>
                The server authenticates runner requests, stores metadata in the SQL DB, and publishes tasks to the worker dispatch.
              </div>
            </li>
            <li className="arch-list-item">
              <span className="arch-item-num">1.03</span>
              <div>
                <strong className="arch-item-strong">CONTAINER EXECUTION:</strong>
                The isolated node spins up corresponding Docker engines to run linting, compiling, and testing scripts.
              </div>
            </li>
            <li className="arch-list-item">
              <span className="arch-item-num">1.04</span>
              <div>
                <strong className="arch-item-strong">LOG PIPING:</strong>
                Stdout/stderr logs are buffered and streamed back to this interface in real-time, providing immediate build intelligence.
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
