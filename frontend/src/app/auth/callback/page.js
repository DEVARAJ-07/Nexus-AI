"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { API_URL } from "../../config";

export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying credentials...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;

    // Supabase OAuth redirect — tokens arrive in the hash fragment (#)
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const supabaseToken = params.get("access_token");
      const githubToken = params.get("provider_token");

      if (supabaseToken) {
        handleSupabaseCallback(githubToken, supabaseToken);
        return;
      }
    }

    setError("No active authentication session received. Please try signing in again.");
  }, []);

  // Safe decoding of base64url encoded Supabase JWT
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

  const handleSupabaseCallback = async (githubToken, supabaseToken) => {
    try {
      setStatus("Verifying credentials...");

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

      if (!username) {
        throw new Error("Could not identify your GitHub account details.");
      }

      setStatus("Welcome back! Loading workspace...");
      localStorage.setItem("nexus_auth", "true");
      localStorage.setItem("github_username", username);
      localStorage.setItem("github_avatar", avatarUrl);
      if (githubToken) {
        localStorage.setItem("github_token", githubToken);
      }

      // Notify app shell to update state
      window.dispatchEvent(new Event("nexus-auth-change"));

      // Navigate to dashboard immediately
      router.replace("/dashboard");

      // Sync user profile & repositories in the background
      if (githubToken) {
        syncToBackground(username, avatarUrl, githubToken).catch(() => {});
      }
    } catch (err) {
      console.error("Supabase callback error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    }
  };

  const syncToBackground = async (username, avatarUrl, githubToken) => {
    try {
      // Fetch repos quietly
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

      // Sync profile & repos to our database via backend
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
      // Silent catch (runs in background)
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          border: "2px solid #ffffff",
          backgroundColor: "#0b0f19",
          boxShadow: "8px 8px 0px #ffffff",
          padding: "2.5rem 2rem",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ color: "#ef4444" }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, textTransform: "uppercase" }}>Handshake Failed</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: "1.6" }}>{error}</p>
            <button
              onClick={() => router.push("/")}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.8rem",
                border: "1px solid #ffffff",
                backgroundColor: "#ffffff",
                color: "#0b0f19",
                cursor: "pointer",
                boxShadow: "3px 3px 0px #94a3b8",
                marginTop: "1rem",
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ color: "#3b82f6" }}>
              {status.includes("Welcome") ? (
                <ShieldCheck size={48} className="text-success" />
              ) : (
                <Loader2 size={48} className="animate-spin" />
              )}
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Secure Handshake
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8", fontFamily: "monospace" }}>
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
