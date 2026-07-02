"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Brain,
  FileText,
  Target,
  BarChart4,
  Cpu,
  Network,
  Settings as SettingsIcon,
  LayoutDashboard,
  Terminal as TerminalIcon,
  LogOut,
  ChevronUp
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState("John Doe");
  const [avatar, setAvatar] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("github_username");
      const storedAvatar = localStorage.getItem("github_avatar");
      if (storedUser) setUsername(storedUser);
      if (storedAvatar) setAvatar(storedAvatar);
    }
  }, []);

  const navItems = [
    { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
    { href: "/intelligence", label: "LOG INTELLIGENCE", icon: Brain },
    { href: "/content", label: "RELEASE STUDIO", icon: FileText },
    { href: "/crm", label: "PIPELINES & REPOS", icon: Target },
    { href: "/analytics", label: "PIPELINE ANALYTICS", icon: BarChart4 },
    { href: "/automation", label: "DEVOPS AUTOMATION", icon: Cpu },
    { href: "/integrations", label: "INTEGRATIONS", icon: Network },
    { href: "/settings", label: "SETTINGS", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    localStorage.setItem("nexus_auth", "false");
    localStorage.removeItem("github_username");
    localStorage.removeItem("github_avatar");
    localStorage.removeItem("github_token");
    window.dispatchEvent(new Event("nexus-auth-change"));
    router.replace("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <TerminalIcon size={18} strokeWidth={2.5} style={{ color: "var(--text-primary)" }} />
        <span>NEXUS AI</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer section */}
      <div style={{ position: "relative", marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
        {showProfileMenu && (
          <div style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "0",
            width: "100%",
            backgroundColor: "var(--color-off-white)",
            border: "1px solid var(--border-color)",
            padding: "0.4rem",
            boxShadow: "4px 4px 0px var(--border-color)",
            zIndex: 110,
            display: "flex",
            flexDirection: "column"
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.6rem 0.8rem",
                color: "var(--color-failed)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "var(--color-warm-grey)"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              <LogOut size={12} />
              <span>LOGOUT ACCOUNT</span>
            </button>
          </div>
        )}
        
        <div 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            padding: "0.5rem",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--color-off-white)",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "2px 2px 0px var(--border-color)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img 
              src={avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
              onError={(e) => { e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"; }}
              style={{ width: "26px", height: "26px", borderRadius: "50%", border: "1px solid var(--border-color)" }}
              alt="User Avatar"
            />
            <div style={{ display: "flex", flexDirection: "column", maxWidth: "120px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{username}</span>
              <span style={{ fontSize: "0.55rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>DEVELOPER</span>
            </div>
          </div>
          <ChevronUp size={14} style={{ color: "var(--text-secondary)", transform: showProfileMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>
    </aside>
  );
}
