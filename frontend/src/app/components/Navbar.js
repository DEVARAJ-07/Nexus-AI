"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Terminal as TerminalIcon
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "HOME", icon: Home },
    { href: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
    { href: "/intelligence", label: "LOG INTELLIGENCE", icon: Brain },
    { href: "/content", label: "RELEASE STUDIO", icon: FileText },
    { href: "/crm", label: "PIPELINES & REPOS", icon: Target },
    { href: "/analytics", label: "PIPELINE ANALYTICS", icon: BarChart4 },
    { href: "/automation", label: "DEVOPS AUTOMATION", icon: Cpu },
    { href: "/integrations", label: "INTEGRATIONS", icon: Network },
    { href: "/settings", label: "SETTINGS", icon: SettingsIcon },
  ];

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

      <div className="sidebar-footer">
        <strong>SYSTEM: ONLINE</strong>
        <div style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "var(--color-steel)" }}>
          API: localhost:5000
        </div>
      </div>
    </aside>
  );
}
