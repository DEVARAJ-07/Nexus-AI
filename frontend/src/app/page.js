"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Terminal, ArrowRight, Cpu, Sparkles, Network, Loader2, LogOut } from "lucide-react";
import { API_URL } from "./config";

export default function LandingPage() {
  const router = useRouter();
  const [supabaseProjectRef, setSupabaseProjectRef] = useState("nuerryjlhezvihpxhvmo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Logged in states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storedUser, setStoredUser] = useState("");

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("nexus_auth") === "true";
      const user = localStorage.getItem("github_username") || "";
      setIsLoggedIn(auth);
      setStoredUser(user);
    }

    // Fetch configuration from backend on mount to resolve database project ref
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/github-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.supabaseProjectRef) {
            setSupabaseProjectRef(data.supabaseProjectRef);
          }
        }
      } catch (err) {
        console.error("Failed to load OAuth configuration:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleSupabaseLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const redirectUri = `${window.location.origin}/auth/callback`;

    if (supabaseProjectRef) {
      // Direct Native Supabase GoTrue Auth redirection with repository scope
      const oauthUrl = `https://${supabaseProjectRef}.supabase.co/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(redirectUri)}&scopes=repo`;
      window.location.href = oauthUrl;
    } else {
      setError("Supabase project reference is not configured on the backend server.");
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.setItem("nexus_auth", "false");
    localStorage.removeItem("github_username");
    localStorage.removeItem("github_avatar");
    localStorage.removeItem("github_token");
    setIsLoggedIn(false);
    setStoredUser("");
    
    // Dispatch auth state change
    window.dispatchEvent(new Event("nexus-auth-change"));
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--bg-color)",
      color: "var(--text-primary)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      position: "relative"
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        pointerEvents: "none",
        backgroundImage: "radial-gradient(var(--border-color) 1px, transparent 1px)",
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
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--color-off-white)",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          color: "var(--text-primary)",
          boxShadow: "2px 2px 0px var(--border-color)"
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
            color: "var(--text-primary)"
          }}>
            One Platform.<br />Six DevOps Superpowers.
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            marginTop: "1rem",
            maxWidth: "600px",
            lineHeight: "1.5"
          }}>
            All-in-one build log intelligence, release studio, pipeline kanban, test analytics, and automation triggers. Deployed on Supabase.
          </p>
        </div>

        {/* Action Auth Card */}
        <div style={{
          border: "1px solid var(--border-color)",
          padding: "2.5rem",
          backgroundColor: "var(--color-off-white)",
          width: "100%",
          maxWidth: "460px",
          position: "relative",
          boxShadow: "8px 8px 0px var(--border-color)",
          textAlign: "left"
        }}>
          <div className="corner-dot tl">+</div>
          <div className="corner-dot tr">+</div>
          <div className="corner-dot bl">+</div>
          <div className="corner-dot br">+</div>

          {isLoggedIn ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h3 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px dotted var(--border-color)", paddingBottom: "0.75rem" }}>
                👋 Session Active
              </h3>
              
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                You are currently signed in as <strong style={{ color: "var(--text-primary)" }}>@{storedUser}</strong>. You can navigate directly to your workspace dashboard or sign out below.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="brutalist-button"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    padding: "0.85rem 1.5rem",
                    boxShadow: "4px 4px 0px var(--border-color)",
                    backgroundColor: "var(--color-accent)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>Go to Workspace Dashboard</span>
                  <ArrowRight size={14} />
                </button>

                <button 
                  onClick={handleLogout}
                  className="brutalist-button"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    padding: "0.85rem 1.5rem",
                    boxShadow: "4px 4px 0px var(--border-color)",
                    backgroundColor: "var(--color-warm-grey)",
                    color: "var(--color-failed)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out Account</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSupabaseLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h3 style={{ fontFamily: "monospace", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px dotted var(--border-color)", paddingBottom: "0.75rem" }}>
                🔑 Secure Handshake
              </h3>
              
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Sign in securely via Supabase Auth to connect your GitHub profile and sync your workspace repositories.
              </p>

              {error && (
                <div style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "var(--color-danger)",
                  border: "1px solid var(--color-danger)",
                  padding: "0.5rem",
                  backgroundColor: "rgba(239, 68, 68, 0.05)"
                }}>
                  [ERR] {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="brutalist-button"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  padding: "0.85rem 1.5rem",
                  boxShadow: "4px 4px 0px var(--border-color)",
                  backgroundColor: isLoading ? "var(--color-warm-grey)" : "var(--color-accent)",
                  color: isLoading ? "var(--text-secondary)" : "#ffffff",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  marginTop: "0.5rem"
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Redirecting to GitHub...</span>
                  </>
                ) : (
                  <>
                    <Github size={16} />
                    <span>Continue with GitHub</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          width: "100%",
          marginTop: "1.5rem",
          textAlign: "left"
        }}>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Cpu size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Log Diagnostics</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Parse failing docker/compile logs and generate target hotfix code patches.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Sparkles size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Release & Docs Studio</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Compile markdown changelogs, release notes, and commit summaries instantly.</p>
          </div>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-off-white)" }}>
            <div style={{ color: "var(--color-accent)", marginBottom: "0.5rem" }}><Network size={18} /></div>
            <strong style={{ fontSize: "0.8rem", display: "block", marginBottom: "0.25rem" }}>Visual Automation</strong>
            <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>Map Git hooks to test builds and deploy sequences in a visual forge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
