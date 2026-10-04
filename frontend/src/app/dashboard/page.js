"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Github, Folder, File, ChevronRight, Loader2, ArrowLeft, Terminal,
  GitCommit, Star, GitFork, Brain, ExternalLink, Copy, Check,
  FileCode, FileText, CornerDownRight, RefreshCw, FolderGit2, BookOpen
} from "lucide-react";
import { API_URL } from "../config";

export default function Dashboard() {
  const [username, setUsername] = useState("DEVARAJ-07");
  const [avatar, setAvatar] = useState("https://avatars.githubusercontent.com/u/211518264?v=4");
  const [token, setToken] = useState("");
  
  // GitHub Repositories state
  const [repos, setRepos] = useState([]);

  // Selected Repository & Explorer state
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [commits, setCommits] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("explorer"); // 'explorer' | 'commits'
  const [fileFilter, setFileFilter] = useState("");
  
  // Loading states
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("github_username") || "DEVARAJ-07";
    const storedAvatar = localStorage.getItem("github_avatar") || "https://avatars.githubusercontent.com/u/211518264?v=4";
    const storedToken = localStorage.getItem("github_token") || "";

    setUsername(storedUser);
    setAvatar(storedAvatar);
    setToken(storedToken);

    fetchRepos(storedUser, storedToken);
  }, []);

  const fetchRepos = async (user, tok) => {
    setLoadingRepos(true);
    setError("");
    try {
      let repoList = [];

      // 1. Fetch from backend authenticated GitHub service
      try {
        const backendRes = await fetch(`${API_URL}/api/github/repos`, {
          headers: tok ? { "x-github-token": tok } : {}
        });
        if (backendRes.ok) {
          const bData = await backendRes.json();
          if (bData.success && Array.isArray(bData.repositories) && bData.repositories.length > 0) {
            repoList = bData.repositories;
          }
        }
      } catch (backendErr) {
        console.warn("Backend repos endpoint fetch warning:", backendErr);
      }

      // 2. Fallback directly to GitHub API
      if (repoList.length === 0) {
        const headers = { "Content-Type": "application/json" };
        if (tok) headers["Authorization"] = `token ${tok}`;

        const url = tok 
          ? `https://api.github.com/user/repos?sort=updated&per_page=100`
          : `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            repoList = data;
          }
        }
      }

      // STRICT FILTERING: Keep ONLY original repos belonging to DEVARAJ-07, remove duplicates & foreign repos
      const seenNames = new Set();
      const originalRepos = [];

      for (const r of repoList) {
        const repoOwner = (typeof r.owner === "string" ? r.owner : (r.owner?.login || user)).toLowerCase();
        const repoFullName = (r.fullName || r.full_name || "").toLowerCase();
        const repoName = (r.name || "").toLowerCase();

        // Exclude foreign SmartEco and any foreign author repos
        if (repoFullName.includes("renishandrick/")) continue;
        
        // Exclude forks or non-owner repos if specified
        const isUserRepo = repoOwner === "devaraj-07" || repoFullName.startsWith("devaraj-07/") || repoOwner === user.toLowerCase();
        if (!isUserRepo) continue;

        // Deduplicate by repository name
        if (seenNames.has(repoName)) continue;
        seenNames.add(repoName);

        originalRepos.push({
          id: r.id || repoName,
          name: r.name,
          fullName: r.fullName || r.full_name || `DEVARAJ-07/${r.name}`,
          description: r.description || "GitHub repository by DEVARAJ-07",
          url: r.url || r.html_url || `https://github.com/DEVARAJ-07/${r.name}`,
          isPrivate: r.private !== undefined ? r.private : (r.isPrivate || false),
          language: r.language || "Plain Text",
          stargazers_count: r.stargazers_count || 0,
          forks_count: r.forks_count || 0,
          updatedAt: r.updatedAt || r.updated_at,
          defaultBranch: r.defaultBranch || r.default_branch || "main",
          owner: { login: "DEVARAJ-07" }
        });
      }

      setRepos(originalRepos);
    } catch (err) {
      console.error(err);
      setError("Failed to load GitHub repositories. Please verify your connection.");
    } finally {
      setLoadingRepos(false);
    }
  };

  // Aggregated Stats
  const totalStars = useMemo(() => repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0), [repos]);
  const totalForks = useMemo(() => repos.reduce((acc, r) => acc + (r.forks_count || 0), 0), [repos]);

  const selectRepository = async (repo) => {
    setSelectedRepo(repo);
    setCurrentPath("");
    setFileContent(null);
    setActiveTab("explorer");
    fetchFiles(repo.name, "DEVARAJ-07", "");
    fetchCommits(repo.name, "DEVARAJ-07");
  };

  const fetchFiles = async (repoName, repoOwner, path = "") => {
    setLoadingFiles(true);
    setFileContent(null);
    try {
      let data = null;
      // 1. Try backend API
      try {
        const backendRes = await fetch(`${API_URL}/api/github/repos/${repoOwner}/${repoName}/contents?path=${encodeURIComponent(path)}`, {
          headers: token ? { "x-github-token": token } : {}
        });
        if (backendRes.ok) {
          const resJson = await backendRes.json();
          if (resJson.success && Array.isArray(resJson.files)) {
            data = resJson.files;
          }
        }
      } catch (e) {
        console.warn("Backend files fetch failed, trying direct GitHub", e);
      }

      // 2. Direct GitHub API fallback
      if (!data) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `token ${token}`;
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, { headers });
        if (res.ok) {
          data = await res.json();
        }
      }
      
      if (Array.isArray(data)) {
        // Sort: directories first, then files alphabetically
        data.sort((a, b) => (b.type === "dir" ? 1 : 0) - (a.type === "dir" ? 1 : 0));
        setFiles(data);
        setCurrentPath(path);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load folder files.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchCommits = async (repoName, repoOwner) => {
    setLoadingCommits(true);
    try {
      let data = null;
      // 1. Try backend API
      try {
        const backendRes = await fetch(`${API_URL}/api/github/repos/${repoOwner}/${repoName}/commits`, {
          headers: token ? { "x-github-token": token } : {}
        });
        if (backendRes.ok) {
          const resJson = await backendRes.json();
          if (resJson.success && Array.isArray(resJson.commits)) {
            data = resJson.commits;
          }
        }
      } catch (e) {
        console.warn("Backend commits fetch failed, trying direct GitHub", e);
      }

      // 2. Direct GitHub API fallback
      if (!data) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `token ${token}`;
        const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=10`, { headers });
        if (res.ok) {
          data = await res.json();
        }
      }

      if (Array.isArray(data)) {
        setCommits(data);
      }
    } catch (err) {
      console.error("Failed to fetch commits:", err);
    } finally {
      setLoadingCommits(false);
    }
  };

  const loadFileContent = async (fileObj) => {
    setLoadingContent(true);
    try {
      let text = null;
      // 1. Try backend raw endpoint first
      try {
        const backendRes = await fetch(`${API_URL}/api/github/repos/DEVARAJ-07/${selectedRepo.name}/raw?path=${encodeURIComponent(fileObj.path)}`, {
          headers: token ? { "x-github-token": token } : {}
        });
        if (backendRes.ok) {
          const resJson = await backendRes.json();
          if (resJson.success && resJson.content !== undefined) {
            text = resJson.content;
          }
        }
      } catch (e) {
        console.warn("Backend raw fetch failed, trying direct download", e);
      }

      // 2. Direct download_url fallback
      if (text === null && fileObj.download_url) {
        const res = await fetch(fileObj.download_url);
        if (res.ok) {
          text = await res.text();
        }
      }

      if (text !== null) {
        setFileContent({
          name: fileObj.name,
          path: fileObj.path,
          size: fileObj.size,
          content: text
        });
        setActiveTab("explorer");
      } else {
        throw new Error("Failed to load file content");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load file content.");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCopyCode = () => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackToRepos = () => {
    setSelectedRepo(null);
    setFiles([]);
    setCommits([]);
    setFileContent(null);
    setCurrentPath("");
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    fetchFiles(selectedRepo.name, "DEVARAJ-07", parentPath);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      fetchFiles(selectedRepo.name, "DEVARAJ-07", "");
      return;
    }
    const parts = currentPath.split("/");
    const newPath = parts.slice(0, index + 1).join("/");
    fetchFiles(selectedRepo.name, "DEVARAJ-07", newPath);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["js", "jsx", "ts", "tsx", "mjs"].includes(ext)) {
      return <FileCode size={16} style={{ color: "#eab308" }} />;
    }
    if (["css", "scss", "sass"].includes(ext)) {
      return <FileCode size={16} style={{ color: "#06b6d4" }} />;
    }
    if (["html", "htm"].includes(ext)) {
      return <FileCode size={16} style={{ color: "#f97316" }} />;
    }
    if (["json", "yaml", "yml"].includes(ext)) {
      return <FileText size={16} style={{ color: "#a855f7" }} />;
    }
    if (["md", "txt", "log"].includes(ext)) {
      return <FileText size={16} style={{ color: "#22c55e" }} />;
    }
    if (["py"].includes(ext)) {
      return <FileCode size={16} style={{ color: "#3b82f6" }} />;
    }
    return <File size={16} style={{ color: "var(--text-secondary)" }} />;
  };

  const filteredFiles = useMemo(() => {
    if (!fileFilter) return files;
    return files.filter(f => f.name.toLowerCase().includes(fileFilter.toLowerCase()));
  }, [files, fileFilter]);

  return (
    <div style={{ paddingBottom: "4rem" }}>
      
      {/* ============================================================== */}
      {/* TOP USER PROFILE & GITHUB ANALYTICS HERO CARD                   */}
      {/* ============================================================== */}
      <div style={{
        border: "2px solid var(--border-color)",
        backgroundColor: "#ffffff",
        boxShadow: "5px 5px 0px var(--border-color)",
        padding: "1.5rem 2rem",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        {/* Left: Avatar Photo & Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: "68px",
            height: "68px",
            border: "2px solid var(--border-color)",
            boxShadow: "3px 3px 0px var(--border-color)",
            overflow: "hidden",
            backgroundColor: "#f1f5f9",
            flexShrink: 0
          }}>
            <img
              src={avatar || "https://avatars.githubusercontent.com/u/211518264?v=4"}
              alt={username}
              onError={(e) => { e.currentTarget.src = "https://avatars.githubusercontent.com/u/211518264?v=4"; }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.5px", margin: 0 }}>
              {username || "DEVARAJ-07"}
            </h2>
          </div>
        </div>

        {/* Right: Stats Counter Badges & Visit GitHub Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          
          {/* Repositories Counter */}
          <div style={{
            border: "2px solid var(--border-color)",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-off-white)",
            boxShadow: "3px 3px 0px var(--border-color)",
            textAlign: "center",
            minWidth: "90px"
          }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, fontFamily: "monospace", color: "var(--text-primary)" }}>
              {repos.length}
            </div>
            <div style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Repositories
            </div>
          </div>

          {/* Total Stars Counter */}
          <div style={{
            border: "2px solid var(--border-color)",
            padding: "0.5rem 1rem",
            backgroundColor: "#fef9c3",
            boxShadow: "3px 3px 0px var(--border-color)",
            textAlign: "center",
            minWidth: "90px"
          }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, fontFamily: "monospace", color: "#854d0e", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <Star size={16} fill="#ca8a04" color="#ca8a04" />
              {totalStars}
            </div>
            <div style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 800, color: "#854d0e", textTransform: "uppercase" }}>
              Total Stars
            </div>
          </div>

          {/* Total Forks Counter */}
          <div style={{
            border: "2px solid var(--border-color)",
            padding: "0.5rem 1rem",
            backgroundColor: "#e0f2fe",
            boxShadow: "3px 3px 0px var(--border-color)",
            textAlign: "center",
            minWidth: "90px"
          }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, fontFamily: "monospace", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <GitFork size={16} color="#0284c7" />
              {totalForks}
            </div>
            <div style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 800, color: "#0369a1", textTransform: "uppercase" }}>
              Total Forks
            </div>
          </div>

          {/* Visit GitHub Button */}
          <a
            href={`https://github.com/${username || "DEVARAJ-07"}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "2px solid var(--border-color)",
              boxShadow: "3px 3px 0px var(--border-color)",
              fontWeight: 800,
              fontSize: "0.8rem",
              fontFamily: "monospace",
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.1s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-2px, -2px)";
              e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-color)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "3px 3px 0px var(--border-color)";
            }}
          >
            <Github size={16} />
            Visit GitHub
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN VIEW: REPOSITORIES LIST OR FILE EXPLORER                  */}
      {/* ============================================================== */}
      <div style={{
        border: "2px solid var(--border-color)",
        backgroundColor: "var(--color-off-white)",
        boxShadow: "6px 6px 0px var(--border-color)",
        padding: "1.5rem"
      }}>
        
        {/* Navigation Bar / Explorer Header (Only shown when repo is selected) */}
        {selectedRepo && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            borderBottom: "2px solid var(--border-color)", 
            paddingBottom: "1rem", 
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Github size={20} />
              <h3 style={{ fontFamily: "monospace", fontSize: "0.95rem", textTransform: "uppercase", fontWeight: 800, margin: 0 }}>
                File Explorer: {selectedRepo.fullName}
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <a
                href={selectedRepo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "#ffffff",
                  border: "1.5px solid var(--border-color)",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "2px 2px 0px var(--border-color)"
                }}
              >
                <ExternalLink size={12} /> View on GitHub
              </a>
              <button 
                onClick={handleBackToRepos}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid var(--border-color)",
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "2px 2px 0px var(--border-color)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                <ArrowLeft size={13} /> Back to Repositories
              </button>
            </div>
          </div>
        )}

        {/* LOADING REPOS */}
        {loadingRepos && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", flexDirection: "column", gap: "0.75rem" }}>
            <Loader2 size={28} className="animate-spin" />
            <span style={{ fontSize: "0.8rem", fontFamily: "monospace", fontWeight: 700 }}>Loading repositories...</span>
          </div>
        )}

        {error && (
          <div style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--color-danger)", padding: "2rem", textAlign: "center", border: "1px dashed var(--border-color)", backgroundColor: "#fff" }}>
            {error}
          </div>
        )}

        {/* ============================================================== */}
        {/* REPOSITORIES GRID VIEW                                         */}
        {/* ============================================================== */}
        {!selectedRepo && !loadingRepos && !error && (
          <div>
            {repos.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", border: "1.5px dashed var(--border-color)", backgroundColor: "#ffffff" }}>
                No repositories found.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {repos.map((repo) => (
                  <div 
                    key={repo.id} 
                    onClick={() => selectRepository(repo)}
                    style={{
                      border: "2px solid var(--border-color)",
                      padding: "1.25rem",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "3px 3px 0px var(--border-color)",
                      transition: "all 0.12s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "160px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translate(-2px, -2px)";
                      e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-color)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "3px 3px 0px var(--border-color)";
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <span style={{ 
                          fontSize: "0.62rem", 
                          fontFamily: "monospace", 
                          padding: "0.15rem 0.5rem", 
                          backgroundColor: repo.isPrivate ? "#fee2e2" : "#f1f5f9", 
                          color: repo.isPrivate ? "#991b1b" : "inherit",
                          border: "1px solid var(--border-color)", 
                          fontWeight: 800 
                        }}>
                          {repo.isPrivate ? "🔒 PRIVATE" : "🌐 PUBLIC"}
                        </span>

                        <span style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700, color: "var(--text-secondary)" }}>
                          branch: {repo.defaultBranch}
                        </span>
                      </div>

                      {/* Repo Name */}
                      <strong style={{ 
                        fontSize: "0.95rem", 
                        display: "block", 
                        marginBottom: "0.4rem", 
                        fontFamily: "monospace", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }} title={repo.fullName}>
                        {repo.name}
                      </strong>

                      {/* Description */}
                      <p style={{ 
                        fontSize: "0.72rem", 
                        color: "var(--text-secondary)", 
                        lineHeight: "1.4", 
                        margin: "0.4rem 0", 
                        height: "38px", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis" 
                      }}>
                        {repo.description}
                      </p>
                    </div>

                    {/* Bottom Metadata bar */}
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      borderTop: "1.5px dashed var(--border-color)", 
                      paddingTop: "0.6rem", 
                      marginTop: "0.6rem" 
                    }}>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.7rem", fontFamily: "monospace" }}>
                        {repo.language && (
                          <span style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b", display: "inline-block" }}></span>
                            {repo.language}
                          </span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Star size={11} fill="#ca8a04" color="#ca8a04" /> {repo.stargazers_count}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <GitFork size={11} /> {repo.forks_count}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: "0.7rem", 
                        fontFamily: "monospace", 
                        fontWeight: 800, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "2px",
                        color: "var(--color-accent)"
                      }}>
                        Explore <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ADVANCED FILE EXPLORER UI                                      */}
        {/* ============================================================== */}
        {selectedRepo && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* Explorer Breadcrumb Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1rem",
              backgroundColor: "#ffffff",
              border: "2px solid var(--border-color)",
              boxShadow: "2px 2px 0px var(--border-color)",
              fontFamily: "monospace",
              fontSize: "0.78rem",
              flexWrap: "wrap",
              gap: "0.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                {currentPath && (
                  <button 
                    onClick={handleNavigateUp}
                    title="Navigate Up"
                    style={{ 
                      background: "var(--color-warm-grey)", 
                      border: "1px solid var(--border-color)", 
                      cursor: "pointer", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      padding: "0.2rem 0.4rem",
                      fontWeight: 800
                    }}
                  >
                    <ArrowLeft size={13} />
                  </button>
                )}
                
                <span 
                  onClick={() => handleBreadcrumbClick(-1)} 
                  style={{ cursor: "pointer", fontWeight: 800, textDecoration: "underline" }}
                >
                  {selectedRepo.name}
                </span>

                {currentPath ? (
                  currentPath.split("/").map((segment, idx) => (
                    <React.Fragment key={idx}>
                      <span style={{ color: "var(--text-secondary)" }}>/</span>
                      <span 
                        onClick={() => handleBreadcrumbClick(idx)}
                        style={{ cursor: "pointer", fontWeight: idx === currentPath.split("/").length - 1 ? 800 : 500, textDecoration: "underline" }}
                      >
                        {segment}
                      </span>
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <span style={{ color: "var(--text-secondary)" }}>/</span>
                    <span style={{ color: "var(--text-secondary)" }}>root</span>
                  </>
                )}
              </div>

              {/* View Tabs */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setActiveTab("explorer")}
                  style={{
                    border: "1.5px solid var(--border-color)",
                    backgroundColor: activeTab === "explorer" ? "#000000" : "#ffffff",
                    color: activeTab === "explorer" ? "#ffffff" : "inherit",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    padding: "0.25rem 0.65rem",
                    cursor: "pointer"
                  }}
                >
                  📁 File Tree
                </button>
                <button
                  onClick={() => setActiveTab("commits")}
                  style={{
                    border: "1.5px solid var(--border-color)",
                    backgroundColor: activeTab === "commits" ? "#000000" : "#ffffff",
                    color: activeTab === "commits" ? "#ffffff" : "inherit",
                    fontSize: "0.7rem",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    padding: "0.25rem 0.65rem",
                    cursor: "pointer"
                  }}
                >
                  <GitCommit size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                  Commits ({commits.length})
                </button>
              </div>
            </div>

            {/* Main Split Layout: Left File Tree, Right Viewer / Commits */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: "1.5rem", alignItems: "start" }}>
              
              {/* LEFT COLUMN: File Explorer Directory Tree */}
              <div style={{
                border: "2px solid var(--border-color)",
                backgroundColor: "#ffffff",
                boxShadow: "3px 3px 0px var(--border-color)",
                display: "flex",
                flexDirection: "column"
              }}>
                {/* Explorer Title & Filter */}
                <div style={{
                  padding: "0.6rem 0.75rem",
                  backgroundColor: "var(--color-warm-grey)",
                  borderBottom: "1.5px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ fontSize: "0.72rem", fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase" }}>
                    Files in /{currentPath || "root"} ({files.length})
                  </span>
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={fileFilter}
                    onChange={(e) => setFileFilter(e.target.value)}
                    style={{
                      fontSize: "0.68rem",
                      fontFamily: "monospace",
                      padding: "0.2rem 0.4rem",
                      border: "1px solid var(--border-color)",
                      outline: "none",
                      width: "120px"
                    }}
                  />
                </div>

                {loadingFiles ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px" }}>
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                    No files found in this directory.
                  </div>
                ) : (
                  <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                    {filteredFiles.map((file) => {
                      const isSelected = fileContent?.path === file.path;
                      const isDir = file.type === "dir";

                      return (
                        <div
                          key={file.sha || file.name}
                          onClick={() => {
                            if (isDir) {
                              fetchFiles(selectedRepo.name, "DEVARAJ-07", file.path);
                            } else {
                              loadFileContent(file);
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.55rem 0.85rem",
                            borderBottom: "1px solid var(--border-color)",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            backgroundColor: isSelected ? "#fef3c7" : "transparent",
                            transition: "background-color 0.1s ease"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "var(--color-warm-grey)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", overflow: "hidden" }}>
                            {isDir ? (
                              <Folder size={16} style={{ color: "#d97706", flexShrink: 0 }} />
                            ) : (
                              getFileIcon(file.name)
                            )}
                            <span style={{ 
                              fontFamily: "monospace", 
                              fontWeight: isDir ? 700 : 500,
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              whiteSpace: "nowrap" 
                            }}>
                              {file.name}{isDir && "/"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                            {!isDir && file.size !== undefined && (
                              <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                                {formatFileSize(file.size)}
                              </span>
                            )}
                            {isDir ? (
                              <ChevronRight size={13} style={{ opacity: 0.6 }} />
                            ) : (
                              <CornerDownRight size={12} style={{ opacity: 0.4 }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Code Previewer OR Commits Timeline */}
              <div>
                
                {/* 1. CODE PREVIEW TAB */}
                {activeTab === "explorer" && (
                  <div style={{
                    border: "2px solid var(--border-color)",
                    backgroundColor: "#ffffff",
                    boxShadow: "3px 3px 0px var(--border-color)"
                  }}>
                    {/* Header */}
                    <div style={{
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "var(--color-warm-grey)",
                      borderBottom: "1.5px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 800 }}>
                        {fileContent ? `📄 ${fileContent.path}` : "File Preview Inspector"}
                      </span>
                      {fileContent && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={handleCopyCode}
                            style={{
                              border: "1px solid var(--border-color)",
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.68rem",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              cursor: "pointer",
                              backgroundColor: "#ffffff",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px"
                            }}
                          >
                            {copied ? <Check size={11} color="green" /> : <Copy size={11} />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                          <button
                            onClick={() => setFileContent(null)}
                            style={{
                              border: "1px solid var(--border-color)",
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.68rem",
                              fontFamily: "monospace",
                              cursor: "pointer",
                              backgroundColor: "#ffffff"
                            }}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>

                    {loadingContent ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    ) : fileContent ? (
                      <div style={{ padding: "0.75rem" }}>
                        <textarea
                          readOnly
                          value={fileContent.content}
                          style={{
                            width: "100%",
                            height: "360px",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                            padding: "0.75rem",
                            backgroundColor: "#0d1117",
                            color: "#c9d1d9",
                            border: "1.5px solid var(--border-color)",
                            resize: "vertical",
                            lineHeight: "1.5"
                          }}
                        />

                        {/* Action Toolbar */}
                        <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.68rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                            Size: {formatFileSize(fileContent.size)} • Lines: {fileContent.content.split("\n").length}
                          </span>
                          <Link
                            href={`/intelligence?file_name=${encodeURIComponent(fileContent.name)}&file_path=${encodeURIComponent(fileContent.path)}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.45rem",
                              padding: "0.5rem 1rem",
                              fontSize: "0.75rem",
                              fontFamily: "monospace",
                              backgroundColor: "var(--color-accent)",
                              color: "#ffffff",
                              border: "1.5px solid var(--border-color)",
                              boxShadow: "3px 3px 0px var(--border-color)",
                              textDecoration: "none",
                              fontWeight: 800
                            }}
                          >
                            <Brain size={14} />
                            Load File in AI Console
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        <FileCode size={36} style={{ opacity: 0.35, margin: "0 auto 0.75rem" }} />
                        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, margin: "0 0 0.25rem", fontFamily: "monospace" }}>
                          No file selected
                        </h4>
                        <p style={{ fontSize: "0.72rem", margin: 0, fontFamily: "monospace" }}>
                          Click any file from the explorer on the left to preview code & load in AI Console.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. COMMITS TIMELINE TAB */}
                {activeTab === "commits" && (
                  <div style={{
                    border: "2px solid var(--border-color)",
                    backgroundColor: "#ffffff",
                    boxShadow: "3px 3px 0px var(--border-color)"
                  }}>
                    <div style={{
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "var(--color-warm-grey)",
                      borderBottom: "1.5px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}>
                      <GitCommit size={14} />
                      <span style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 800, textTransform: "uppercase" }}>
                        Recent Commit History ({commits.length})
                      </span>
                    </div>

                    {loadingCommits ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
                        <Loader2 size={20} className="animate-spin" />
                      </div>
                    ) : commits.length === 0 ? (
                      <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.75rem", fontFamily: "monospace" }}>
                        No commits found or unable to fetch commit history.
                      </div>
                    ) : (
                      <div style={{ maxHeight: "480px", overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {commits.map((c) => (
                          <div 
                            key={c.sha} 
                            style={{
                              padding: "0.75rem",
                              backgroundColor: "var(--color-off-white)",
                              border: "1.5px solid var(--border-color)",
                              fontSize: "0.72rem",
                              fontFamily: "monospace",
                              boxShadow: "2px 2px 0px var(--border-color)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", color: "var(--text-secondary)" }}>
                              <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                                @{c.commit?.author?.name || c.author?.login || "DEVARAJ-07"}
                              </span>
                              <span>{c.commit?.author?.date ? new Date(c.commit.author.date).toLocaleDateString() : ""}</span>
                            </div>
                            <p style={{ fontWeight: 700, margin: "0.25rem 0", lineHeight: "1.35", fontSize: "0.75rem" }}>
                              {(c.commit?.message || "").split("\n")[0]}
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                              <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", backgroundColor: "#ffffff", border: "1px solid var(--border-color)", padding: "0.1rem 0.35rem" }}>
                                SHA: {(c.sha || "").substring(0, 7)}
                              </span>
                              <a
                                href={c.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: "0.65rem", textDecoration: "none", color: "var(--color-accent)", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}
                              >
                                View Commit <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
