"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav-wrapper hairline-bottom">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <GitBranch size={20} strokeWidth={2.5} />
        <Link href="/" className="nav-logo">
          OutPost CI/CD
        </Link>
        <span className="version-tag" style={{ marginLeft: "1rem" }}>
          [v0.8.2-BETA]
        </span>
      </div>
      <div className="nav-links">
        <Link
          href="/"
          className={`nav-link ${pathname === "/" ? "active" : ""}`}
        >
          DASHBOARD
        </Link>
        <Link
          href="/history"
          className={`nav-link ${pathname === "/history" ? "active" : ""}`}
        >
          RUN HISTORY
        </Link>
        <Link
          href="/settings"
          className={`nav-link ${pathname === "/settings" ? "active" : ""}`}
        >
          SETTINGS
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <a
          href="https://github.com/outpost-ai/outpost"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
          style={{ display: "flex", alignItems: "center" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
            <path d="M9 18c-4.5 1.6-5-2.5-7-3" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
