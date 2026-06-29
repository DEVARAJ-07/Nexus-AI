"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Terminal, Cpu, Sparkles, Network } from "lucide-react";
import { API_URL } from "../../config";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying credentials...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    // Scenario A: Supabase OAuth redirect — tokens arrive in the hash fragment
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const supabaseToken = params.get("access_token");
      const githubToken = params.get("provider_token");

      if (supabaseToken) {
        handleSupabaseCallback(githubToken, supabaseToken);
        return;
      }
    }

    // Scenario B: Direct GitHub OAuth code redirect
    if (code) {
      handleGitHubCodeExchange(code);
      return;
    }

    setError("No authentication data received. Please try signing in again.");
  }, []);

  const decodeSupabaseJWT = (token) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;
      const rawString = atob(paddedBase64);
      const jsonString = decodeURIComponent(
        rawString
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("JWT Decode error:", e);
      return null;
    }
  };

  /**
   * FAST PATH — Supabase OAuth
   * 1. Decode the JWT to get username + avatar (zero network calls needed)
   * 2. Save to localStorage immediately
   * 3. Redirect to dashboard
   * 4. Fire-and-forget background sync to backend (non-blocking)
   */
  const handleSupabaseCallback = async (githubToken, supabaseToken) => {
    try {
      setStatus("Verifying credentials...");

      // Decode the Supabase JWT payload (base64) — no network call needed
      let username = "";
      let avatarUrl = "";
      
      const payload = decodeSupabaseJWT(supabaseToken);
      if (payload) {
        username =
          payload?.user_metadata?.preferred_username ||
          payload?.user_metadata?.user_name ||
          payload?.user_metadata?.login ||
          payload?.user_metadata?.full_name ||
          payload?.email?.split("@")[0] ||
          "";
        avatarUrl =
          payload?.user_metadata?.avatar_url ||
          payload?.user_metadata?.picture ||
          "";
      }

      // If JWT decode failed, do a single lightweight GitHub API call
      if (!username && githubToken) {
        setStatus("Fetching profile...");
        const res = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${githubToken}` },
        });
        if (res.ok) {
          const profile = await res.json();
          username = profile.login || "";
          avatarUrl = profile.avatar_url || "";
        }
      }

      if (!username) {
        throw new Error("Could not identify your GitHub account. Please try again.");
      }

      // ✅ SAVE IMMEDIATELY — redirect with zero backend latency
      setStatus("Welcome back! Loading workspace...");
      localStorage.setItem("nexus_auth", "true");
      localStorage.setItem("github_username", username);
      localStorage.setItem("github_avatar", avatarUrl);
      if (githubToken) localStorage.setItem("github_token", githubToken);

      // Notify app shell to update state
      window.dispatchEvent(new Event("nexus-auth-change"));

      // Navigate to dashboard immediately
      router.replace("/dashboard");

      // 🔄 Fire-and-forget: sync to backend in background (non-blocking)
      if (githubToken) {
        syncToBackgroundInBackground(username, avatarUrl, githubToken).catch(() => {});
      }
    } catch (err) {
      console.error("Supabase callback error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    }
  };

  /**
   * Background sync — runs after redirect, does NOT block login
   */
  const syncToBackgroundInBackground = async (username, avatarUrl, githubToken) => {
    try {
      // Fetch repos quietly in the background
      const reposRes = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=100`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      let repositories = [];
      if (reposRes.ok) {
        const raw = await reposRes.json();
        const seen = new Set();
        for (const r of raw) {
          if (r?.id && !seen.has(r.id)) {
            if (r.name === "SmartEco" && r.language === "Python") continue;
            seen.add(r.id);
            repositories.push(r);
          }
        }
      }

      // Sync profile + repos to Supabase DB via backend
      await fetch(`${API_URL}/api/auth/sync-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@github.com`,
          avatarUrl,
          accessToken: githubToken,
          repositories,
        }),
      });
    } catch (_) {
      // Silent — background sync failure should never affect the user
    }
  };

  /**
   * Direct GitHub OAuth code exchange (via backend)
   */
  const handleGitHubCodeExchange = async (code) => {
    try {
      setStatus("Exchanging credentials...");

      const res = await fetch(`${API_URL}/api/auth/github-token-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Token exchange failed.");
      }

      const data = await res.json();

      localStorage.setItem("nexus_auth", "true");
      localStorage.setItem("github_username", data.github.username);
      localStorage.setItem("github_avatar", data.github.avatarUrl);
      localStorage.setItem("github_token", data.github.accessToken);

      window.dispatchEvent(new Event("nexus-auth-change"));
      router.replace("/dashboard");
    } catch (err) {
      console.error("Token exchange failed:", err);
      setError(err.message || "Failed to authenticate. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        position: "relative",
        fontFamily: "monospace",
      }}
    >
      {/* Dot grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(#334155 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        style={{
          maxWidth: "820px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          zIndex: 10,
          gap: "2rem",
        }}
      >
        {/* Logo bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 1rem",
            border: "1px solid #334155",
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            color: "#94a3b8",
            boxShadow: "2px 2px 0px #334155",
          }}
        >
          <Terminal size={13} />
          <span>NEXUS AI — PIPELINE COMMAND CENTER</span>
        </div>

        {/* Heading */}
        <div>
          <h1
            style={{
              fontSize: "2.75rem",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#ffffff",
              fontFamily: "sans-serif",
            }}
          >
            One Platform.<br />Six DevOps Superpowers.
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#64748b",
              marginTop: "0.75rem",
              maxWidth: "560px",
              lineHeight: 1.6,
              fontFamily: "sans-serif",
            }}
          >
            Build log intelligence · Release studio · Pipeline kanban · Test analytics · Automation triggers — all in one workspace.
          </p>
        </div>

        {/* Auth loader / error card */}
        <div
          style={{
            border: "1px solid #1e293b",
            padding: "2.5rem 2rem",
            backgroundColor: "#111827",
            width: "100%",
            maxWidth: "420px",
            position: "relative",
            boxShadow: "6px 6px 0px #1e293b",
          }}
        >
          {/* Corner markers */}
          {[
            { top: -6, left: -6 },
            { top: -6, right: -6 },
            { bottom: -6, left: -6 },
            { bottom: -6, right: -6 },
          ].map((pos, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                color: "#334155",
                fontSize: "0.8rem",
                fontWeight: 700,
                lineHeight: 1,
                ...pos,
              }}
            >
              +
            </span>
          ))}

          {error ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
              <p style={{ fontSize: "0.7rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ❌ Authentication Error
              </p>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.5 }}>{error}</p>
              <button
                onClick={() => router.replace("/")}
                style={{
                  padding: "0.65rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  boxShadow: "3px 3px 0px #000",
                }}
              >
                ← Back to Home
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
                padding: "0.5rem 0",
              }}
            >
              <Loader2
                size={38}
                style={{
                  color: "#3b82f6",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#e2e8f0",
                    marginBottom: "0.3rem",
                  }}
                >
                  🔑 Secure Handshake
                </p>
                <p style={{ fontSize: "0.68rem", color: "#475569" }}>{status}</p>
              </div>
            </div>
          )}
        </div>

        {/* Feature cards — dimmed while loading */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            width: "100%",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        >
          {[
            { icon: <Cpu size={16} />, title: "Log Diagnostics", desc: "Parse failing build logs and generate hotfix patches instantly." },
            { icon: <Sparkles size={16} />, title: "Release Studio", desc: "Generate changelogs, release notes, and commit summaries." },
            { icon: <Network size={16} />, title: "Visual Automation", desc: "Map Git hooks to builds and deploy sequences visually." },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #1e293b",
                padding: "1rem",
                backgroundColor: "#0f172a",
                textAlign: "left",
              }}
            >
              <div style={{ color: "#3b82f6", marginBottom: "0.4rem" }}>{f.icon}</div>
              <strong style={{ fontSize: "0.75rem", color: "#e2e8f0", display: "block", marginBottom: "0.25rem", fontFamily: "sans-serif" }}>
                {f.title}
              </strong>
              <p style={{ fontSize: "0.65rem", color: "#475569", lineHeight: 1.5, fontFamily: "sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Inline keyframe for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
