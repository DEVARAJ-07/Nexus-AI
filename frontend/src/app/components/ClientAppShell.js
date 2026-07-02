"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./Navbar";
import TransitionProvider from "./TransitionProvider";

export default function ClientAppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem("nexus_auth") === "true";
    setIsAuthenticated(auth);

    // Route guard: unauthenticated users → landing page
    if (!auth && pathname !== "/") {
      router.replace("/");
      return;
    }

    // Route guard: authenticated users must never see the landing page
    // replace() removes it from history so back-button navigation skips it
    if (auth && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  // Sync auth updates across components
  useEffect(() => {
    const handleAuthChange = () => {
      const auth = localStorage.getItem("nexus_auth") === "true";
      setIsAuthenticated(auth);
      if (!auth) {
        router.replace("/");
      } else {
        router.replace("/dashboard");
      }
    };
    window.addEventListener("nexus-auth-change", handleAuthChange);
    return () => window.removeEventListener("nexus-auth-change", handleAuthChange);
  }, [router]);

  // Prevent flash of unstyled content during SSR hydration
  if (!mounted) {
    return <div style={{ backgroundColor: "#0b0f19", minHeight: "100vh" }} />;
  }

  const showLayout = isAuthenticated && pathname !== "/";

  if (!showLayout) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0b0f19", overflow: "hidden" }}>
        <TransitionProvider>{children}</TransitionProvider>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">Nexus AI Command Center</div>
          <div className="topbar-meta">V.0.1</div>
        </header>
        <main className="content-container">
          <TransitionProvider>{children}</TransitionProvider>
        </main>
      </div>
    </div>
  );
}
