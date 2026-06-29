"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Terminal } from "lucide-react";
import { API_URL } from "../../config";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Synchronizing profile to database...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      // Scenario A: Supabase OAuth redirect (returns tokens in hash fragment '#')
      if (hash) {
        const params = new URLSearchParams(hash.replace("#", "?"));
        const supabaseToken = params.get("access_token");
        const githubToken = params.get("provider_token");

        if (supabaseToken) {
          syncSupabaseOAuth(githubToken, supabaseToken);
          return;
        }
      }

      // Scenario B: Direct GitHub OAuth redirect (returns code in query params '?')
      if (code) {
        exchangeToken(code);
        return;
      }

      setError("No authentication token or code received from the callback redirect.");
    }
  }, []);

  // Handler for Supabase OAuth Callback (Hash Parsing)
  const syncSupabaseOAuth = async (githubToken, supabaseToken) => {
    try {
      setStatus("Fetching profile details from GitHub...");
      
      // If we got a provider token, fetch the user's actual profile and repositories
      const headers = { "Content-Type": "application/json" };
      if (githubToken) {
        headers["Authorization"] = `Bearer ${githubToken}`;
      }

      // 1. Fetch GitHub Profile
      const profileRes = await fetch("https://api.github.com/user", { headers });
      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile details from GitHub API.");
      }
      const profile = await profileRes.json();
      const username = profile.login;

      setStatus("Fetching repositories...");

      // 2. Fetch GitHub Repositories
      const reposRes = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100`, { headers });
      let repositories = [];
      if (reposRes.ok) {
        const rawRepos = await reposRes.json();
        const seenIds = new Set();
        if (Array.isArray(rawRepos)) {
          for (const r of rawRepos) {
            if (r && r.id && !seenIds.has(r.id)) {
              // Skip the Python version of SmartEco
              if (r.name === "SmartEco" && r.language === "Python") {
                continue;
              }
              seenIds.add(r.id);
              repositories.push(r);
            }
          }
        }
      }

      setStatus("Synchronizing profile to database...");

      // 3. Sync to Supabase PostgreSQL via our backend
      const syncRes = await fetch(`${API_URL}/api/auth/sync-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: profile.email || `${username}@github.com`,
          avatarUrl: profile.avatar_url,
          accessToken: githubToken || null,
          repositories
        })
      });

      if (!syncRes.ok) {
        const errJson = await syncRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to synchronize profile with the database.");
      }

      setStatus("Authentication successful! Loading workspace...");

      // 4. Save local state parameters
      localStorage.setItem("nexus_auth", "true");
      localStorage.setItem("github_username", username);
      localStorage.setItem("github_avatar", profile.avatar_url);
      if (githubToken) {
        localStorage.setItem("github_token", githubToken);
      }

      // Dispatch event to sync state across the ClientAppShell
      window.dispatchEvent(new Event("nexus-auth-change"));
      
      // Route to dashboard
      router.replace("/dashboard");
    } catch (err) {
      console.error("Supabase OAuth Sync failed:", err);
      setError(err.message || "Failed to sync GitHub authentication with Supabase.");
    }
  };

  // Handler for Direct GitHub OAuth Callback (Code Exchange)
  const exchangeToken = async (code) => {
    try {
      setStatus("Exchanging code for credentials...");
      
      const res = await fetch(`${API_URL}/api/auth/github-token-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "GitHub authorization token exchange failed.");
      }

      const data = await res.json();
      setStatus("Authentication successful! Loading workspace...");

      // Store credentials locally
      localStorage.setItem("nexus_auth", "true");
      localStorage.setItem("github_username", data.github.username);
      localStorage.setItem("github_avatar", data.github.avatarUrl);
      localStorage.setItem("github_token", data.github.accessToken);

      // Dispatch event to sync state across the ClientAppShell
      window.dispatchEvent(new Event("nexus-auth-change"));
      
      // Navigate to dashboard
      router.replace("/dashboard");
    } catch (err) {
      console.error("Token exchange failed:", err);
      setError(err.message || "Failed to authenticate your account with GitHub.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-color, #0b0f19)",
      color: "var(--text-primary, #ffffff)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      position: "relative"
    }}>
      {/* Background Dot Grid Pattern matching the Landing Page */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        pointerEvents: "none",
        backgroundImage: "radial-gradient(var(--border-color, #334155) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div style={{
        maxWidth: "800px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        zIndex: 10,
        gap: "2.5rem"
      }}>
        {/* Logo Shield */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 1rem",
          border: "1px solid var(--border-color, #334155)",
          backgroundColor: "var(--color-off-white, #f8fafc)",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          color: "var(--text-primary, #ffffff)",
          boxShadow: "2px 2px 0px var(--border-color, #334155)"
        }}>
          <Terminal size={14} />
          <span>NEXUS AI PIPELINE COMMAND CENTER</span>
        </div>

        {/* Hero Title */}
        <div>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: "1.05",
            color: "var(--text-primary, #ffffff)"
          }}>
            One Platform.<br />Six DevOps Superpowers.
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "var(--text-secondary, #94a3b8)",
            marginTop: "1rem",
            maxWidth: "600px",
            lineHeight: "1.5"
          }}>
            All-in-one build log intelligence, release studio, pipeline kanban, test analytics, and automation triggers. Deployed on Supabase.
          </p>
        </div>

        {/* Action Loader Card matching Landing Page card shape and style */}
        <div style={{
          border: "1px solid var(--border-color, #334155)",
          padding: "2.5rem",
          backgroundColor: "var(--color-off-white, #f8fafc)",
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          boxShadow: "8px 8px 0px var(--border-color, #334155)",
          textAlign: "left"
        }}>
          <div className="corner-dot tl">+</div>
          <div className="corner-dot tr">+</div>
          <div className="corner-dot bl">+</div>
          <div className="corner-dot br">+</div>

          {error ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h3 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-danger, #ef4444)", borderBottom: "1px dotted var(--border-color, #334155)", paddingBottom: "0.75rem" }}>
                ❌ Authentication Error
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", lineHeight: "1.4" }}>
                {error}
              </p>
              <button
                onClick={() => router.replace("/")}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--color-danger, #ef4444)",
                  color: "#ffffff",
                  border: "none",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px #000000"
                }}
              >
                Back to Landing Page
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", alignItems: "center", padding: "1rem 0" }}>
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--color-accent, #3b82f6)" }} />
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "monospace" }}>
                  🔑 Secure Handshake
                </h3>
                <p style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)", marginTop: "0.5rem", fontFamily: "monospace" }}>
                  {status}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          width: "100%",
          marginTop: "1.5rem",
          textAlign: "left",
          opacity: 0.5 // Dimmed during authentication loader for hierarchy
        }}>
          <div style={{ border: "1px solid var(--border-color, #334155)", padding: "1.25rem", backgroundColor: "var(--color-off-white, #f8fafc)" }}>
            <div style={{ color: "var(--color-accent, #3b82f6)", marginBottom: "0.5rem" }}><Cpu size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Log Diagnostics</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)", lineHeight: "1.4" }}>Parse failing docker/compile logs and generate target hotfix code patches.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color, #334155)", padding: "1.25rem", backgroundColor: "var(--color-off-white, #f8fafc)" }}>
            <div style={{ color: "var(--color-accent, #3b82f6)", marginBottom: "0.5rem" }}><Sparkles size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Release & Docs Studio</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)", lineHeight: "1.4" }}>Compile markdown changelogs, release notes, and commit summaries instantly.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color, #334155)", padding: "1.25rem", backgroundColor: "var(--color-off-white, #f8fafc)" }}>
            <div style={{ color: "var(--color-accent, #3b82f6)", marginBottom: "0.5rem" }}><Network size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Visual Automation</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)", lineHeight: "1.4" }}>Map Git hooks to test builds and deploy sequences in a visual forge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
