"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Users, Trash2, Save, Check } from "lucide-react";

export default function Settings() {
  const [profileName, setProfileName] = useState("John Doe");
  const [profileEmail, setProfileEmail] = useState("john@nexus-ci.com");
  const [orgName, setOrgName] = useState("Nexus Headquarters");
  
  const [team, setTeam] = useState([
    { id: "u-1", name: "John Doe", email: "john@nexus-ci.com", role: "ADMIN" },
    { id: "u-2", name: "Sarah Connor", email: "sarah@skynet.com", role: "MEMBER" }
  ]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savedOrg, setSavedOrg] = useState(false);

  // Fetch initial configuration on mount
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch("http://localhost:5000/api/settings/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileName(profileData.name || "John Doe");
          setProfileEmail(profileData.email || "john@nexus-ci.com");
        }

        const wsRes = await fetch("http://localhost:5000/api/settings/workspace");
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setOrgName(wsData.name || "Nexus Headquarters");
        }

        const teamRes = await fetch("http://localhost:5000/api/settings/team");
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData);
        }
      } catch (err) {
        console.log("Failed to load settings from server, using local defaults:", err.message);
      }
    }

    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setSavedProfile(false);
    try {
      const res = await fetch("http://localhost:5000/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail })
      });
      if (res.ok) {
        setSavedProfile(true);
        setTimeout(() => setSavedProfile(false), 2000);
      }
    } catch (err) {
      console.log("Failed to save profile:", err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    setSavedOrg(false);
    try {
      const res = await fetch("http://localhost:5000/api/settings/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName })
      });
      if (res.ok) {
        setSavedOrg(true);
        setTimeout(() => setSavedOrg(false), 2000);
      }
    } catch (err) {
      console.log("Failed to save workspace:", err.message);
    } finally {
      setSavingOrg(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      const res = await fetch("http://localhost:5000/api/settings/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (res.ok) {
        const data = await res.json();
        setTeam((prev) => [...prev, data.member]);
        setInviteEmail("");
      } else {
        throw new Error("Invite failed");
      }
    } catch (err) {
      console.log("Failed to send invite, using local fallback:", err.message);
      // Fallback
      const newMember = {
        id: `u-${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole
      };
      setTeam((prev) => [...prev, newMember]);
      setInviteEmail("");
    }
  };

  const handleRevoke = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/settings/team/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTeam((prev) => prev.filter((m) => m.id !== id));
      } else {
        throw new Error("Revoke failed");
      }
    } catch (err) {
      console.log("Failed to revoke access, using local fallback:", err.message);
      setTeam((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
      {/* Left Column: Profiles & Billing */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Profile Settings */}
        <div>
          <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            Workspace Settings
          </h3>
          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>PROFILE NAME</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="brutalist-input"
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="brutalist-input"
              />
            </div>

            <button type="submit" className="brutalist-button" style={{ display: "flex", gap: "0.25rem", width: "100%", justifyContent: "center" }} disabled={savingProfile}>
              {savedProfile ? (
                <>
                  <Check size={14} /> Profile Saved
                </>
              ) : (
                <>
                  <Save size={14} /> Save Profile Settings
                </>
              )}
            </button>
          </form>

          {/* Org / Workspace Settings */}
          <form onSubmit={handleSaveWorkspace} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>ORGANIZATION NAME</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="brutalist-input"
              />
            </div>

            <button type="submit" className="brutalist-button" style={{ display: "flex", gap: "0.25rem", width: "100%", justifyContent: "center" }} disabled={savingOrg}>
              {savedOrg ? (
                <>
                  <Check size={14} /> Organization Saved
                </>
              ) : (
                <>
                  <Save size={14} /> Save Organization Name
                </>
              )}
            </button>
          </form>
        </div>

        {/* Subscription Plan & Billing */}
        <div>
          <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
            Billing & Resource Utilization
          </h3>
          <div style={{ border: "1px solid var(--border-color)", padding: "1.25rem", backgroundColor: "var(--color-warm-grey)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>ENTERPRISE TIER STATUS</span>
              <span style={{ fontSize: "0.7rem", fontFamily: "monospace", padding: "0.1rem 0.4rem", border: "1px solid var(--border-color)", backgroundColor: "var(--color-off-white)" }}>
                $199 / MONTH
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>SUPABASE POSTGRES DB STORAGE</span>
                  <span>45MB / 5GB</span>
                </div>
                <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-slate)" }}>
                  <div style={{ height: "100%", width: "1%", backgroundColor: "var(--text-primary)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>PINECONE LOG DIAGNOSTICS DB</span>
                  <span>4.2K / 100K VECTOR RUNS</span>
                </div>
                <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-slate)" }}>
                  <div style={{ height: "100%", width: "4%", backgroundColor: "var(--text-primary)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>PIPELINE AUTOMATION RUNS</span>
                  <span>410 / 5000 RUNS</span>
                </div>
                <div style={{ height: "4px", width: "100%", backgroundColor: "var(--color-slate)" }}>
                  <div style={{ height: "100%", width: "8%", backgroundColor: "var(--text-primary)" }} />
                </div>
              </div>
            </div>

            <button className="brutalist-button" style={{ display: "flex", gap: "0.25rem", width: "100%", marginTop: "0.5rem" }}>
              <CreditCard size={14} /> Manage Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Team Management */}
      <div>
        <h3 style={{ fontFamily: "monospace", fontSize: "0.9rem", textTransform: "uppercase", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
          Team Access Control
        </h3>

        <form onSubmit={handleInvite} style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Invite email address"
            className="brutalist-input"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="brutalist-input"
            style={{ width: "120px" }}
          >
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button type="submit" className="brutalist-button" style={{ padding: "0.5rem", whiteSpace: "nowrap" }}>
            <Users size={14} /> Send Invite
          </button>
        </form>

        <table className="spec-table">
          <thead>
            <tr className="spec-header-row">
              <th className="spec-cell spec-cell-header">Team Member</th>
              <th className="spec-cell spec-cell-header">Email Address</th>
              <th className="spec-cell spec-cell-header">Role Scope</th>
              <th className="spec-cell spec-cell-header" style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="spec-row">
                <td className="spec-cell" style={{ fontWeight: 800 }}>{m.name}</td>
                <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{m.email}</td>
                <td className="spec-cell" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{m.role}</td>
                <td className="spec-cell" style={{ textAlign: "center" }}>
                  {m.role !== "ADMIN" ? (
                    <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-failed)" }} onClick={() => handleRevoke(m.id)} />
                  ) : (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>OWNER</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
