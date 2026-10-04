"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Github, Folder, File, ChevronRight, Loader2, ArrowLeft,
  GitCommit, Star, GitFork, Brain, GitBranch, Search, Copy,
  Check, ExternalLink, FileText, ChevronDown, BookOpen, Layers
} from "lucide-react";
import { API_URL } from "../config";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Java: "#b07219",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051"
};

export default function Dashboard() {
  const [username, setUsername] = useState("DEVARAJ-07");
  const [avatar, setAvatar] = useState("https://avatars.githubusercontent.com/u/211518264?v=4");
  const [token, setToken] = useState("");
  
  // GitHub Browser states
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");

  const [selectedRepo, setSelectedRepo] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [commits, setCommits] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Loading states
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("github_username") || "DEVARAJ-07";
      const storedAvatar = localStorage.getItem("github_avatar") || "https://avatars.githubusercontent.com/u/211518264?v=4";
      const storedToken = localStorage.getItem("github_token") || "";

      setUsername(storedUser);
      setAvatar(storedAvatar);
      setToken(storedToken);

      fetchRepos(storedUser, storedToken);
    }
  }, []);

  const fetchRepos = async (user, tok) => {
    setLoadingRepos(true);
    setError("");
    try {
      // 1. Try our backend GitHub router
      const res = await fetch(`${API_URL}/api/github/repos`, {
        headers: tok ? { "x-github-token": tok } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.repositories)) {
          const validRepos = data.repositories.filter(
            r => r.name !== "renishandrick/SmartEco" && r.fullName !== "renishandrick/SmartEco"
          );
          setRepos(validRepos);
          setFilteredRepos(validRepos);
          setLoadingRepos(false);
          return;
        }
      }

      // 2. Direct GitHub API fallback
      const ghUrl = tok 
        ? "https://api.github.com/user/repos?sort=updated&per_page=100"
        : `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`;

      const ghRes = await fetch(ghUrl, {
        headers: tok ? { Authorization: `token ${tok}` } : {}
      });

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        if (Array.isArray(ghData)) {
          const mapped = ghData
            .filter(r => r.name !== "renishandrick/SmartEco" && r.full_name !== "renishandrick/SmartEco")
            .map(r => ({
              id: r.id,
              name: r.name,
              fullName: r.full_name,
              owner: r.owner?.login || user,
              defaultBranch: r.default_branch || "main",
              private: r.private,
              description: r.description || "Personal project repository",
              language: r.language || "JavaScript",
              stargazers_count: r.stargazers_count || 0,
              forks_count: r.forks_count || 0,
              url: r.html_url,
              updatedAt: r.updated_at
            }));
          setRepos(mapped);
          setFilteredRepos(mapped);
        }
      }
    } catch (err) {
      console.error("Fetch repos error:", err);
      setError("Failed to load GitHub repositories. Please verify your connection.");
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    let result = repos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
    }
    if (selectedLanguage !== "All") {
      result = result.filter(r => r.language === selectedLanguage);
    }
    setFilteredRepos(result);
  }, [searchQuery, selectedLanguage, repos]);

  const selectRepository = async (repo) => {
    setSelectedRepo(repo);
    setCurrentPath("");
    setFileContent(null);
    fetchFiles(repo.owner || username, repo.name, "");
    fetchCommits(repo.owner || username, repo.name);
  };

  const fetchFiles = async (owner, repoName, folderPath = "") => {
    setLoadingFiles(true);
    setFileContent(null);
    try {
      const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repoName}/contents?path=${encodeURIComponent(folderPath)}`, {
        headers: token ? { "x-github-token": token } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          const sorted = [...data.files].sort((a, b) => (b.type === "dir" ? 1 : 0) - (a.type === "dir" ? 1 : 0));
          setFiles(sorted);
          setCurrentPath(folderPath);
          setLoadingFiles(false);
          return;
        }
      }

      // Direct GitHub API fallback
      const cleanPath = folderPath.replace(/^\/+/, "");
      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}`, {
        headers: token ? { Authorization: `token ${token}` } : {}
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        if (Array.isArray(ghData)) {
          ghData.sort((a, b) => (b.type === "dir" ? 1 : 0) - (a.type === "dir" ? 1 : 0));
          setFiles(ghData);
          setCurrentPath(folderPath);
        }
      }
    } catch (err) {
      console.error("Failed to load folder files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchCommits = async (owner, repoName) => {
    setLoadingCommits(true);
    try {
      const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repoName}/commits`, {
        headers: token ? { "x-github-token": token } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.commits)) {
          setCommits(data.commits);
          setLoadingCommits(false);
          return;
        }
      }

      // Direct fallback
      const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/commits?per_page=5`, {
        headers: token ? { Authorization: `token ${token}` } : {}
      });
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        setCommits(ghData);
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
      const owner = selectedRepo.owner || username;
      const repoName = selectedRepo.name;

      const res = await fetch(`${API_URL}/api/github/repos/${owner}/${repoName}/raw?path=${encodeURIComponent(fileObj.path)}`, {
        headers: token ? { "x-github-token": token } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.content) {
          setFileContent({
            name: fileObj.name,
            path: fileObj.path,
            content: data.content,
            size: fileObj.size || data.content.length
          });
          setLoadingContent(false);
          return;
        }
      }

      // Direct fallback if download_url available
      if (fileObj.download_url) {
        const rawRes = await fetch(fileObj.download_url);
        if (rawRes.ok) {
          const text = await rawRes.text();
          setFileContent({
            name: fileObj.name,
            path: fileObj.path,
            content: text,
            size: fileObj.size || text.length
          });
        }
      }
    } catch (err) {
      console.error("Failed to load file content:", err);
    } finally {
      setLoadingContent(false);
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
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parentPath = parts.join("/");
    fetchFiles(selectedRepo.owner || username, selectedRepo.name, parentPath);
  };

  const handleBreadcrumbClick = (index) => {
    const parts = currentPath.split("/").filter(Boolean);
    const targetPath = parts.slice(0, index + 1).join("/");
    fetchFiles(selectedRepo.owner || username, selectedRepo.name, targetPath);
  };

  const copyToClipboard = () => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const languagesList = ["All", ...Array.from(new Set(repos.map(r => r.language).filter(Boolean)))];

  const latestCommit = commits[0] || {
    sha: "296d45c",
    commit: {
      message: "feat: sync repository and optimize file tree rendering",
      author: { name: username, date: new Date().toISOString() }
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }}>
      
      {/* GITHUB USER HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #d0d7de", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img 
            src={avatar} 
            alt="Avatar"
            onError={(e) => { e.target.src = "https://avatars.githubusercontent.com/u/211518264?v=4"; }}
            style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #d0d7de" }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#1f2328" }}>{username}</h2>
              <span style={{ fontSize: "0.75rem", color: "#656d76", border: "1px solid #d0d7de", borderRadius: "2em", padding: "0.1rem 0.5rem", fontWeight: 500 }}>
                GitHub Workspace
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#656d76", margin: "0.15rem 0 0 0" }}>
              Direct access to all your repositories, files, branches, and code assets.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.8rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: "#f6f8fa",
              color: "#1f2328",
              border: "1px solid #d0d7de",
              borderRadius: "6px",
              cursor: "pointer",
              textDecoration: "none"
            }}
          >
            <Github size={14} />
            <span>Open on GitHub</span>
            <ExternalLink size={12} style={{ opacity: 0.6 }} />
          </a>
        </div>
      </div>

      {/* GITHUB SUBNAV TABS */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #d0d7de", marginBottom: "1.5rem", paddingBottom: "0.25rem" }}>
        <button
          onClick={handleBackToRepos}
          style={{
            background: "none",
            border: "none",
            borderBottom: !selectedRepo ? "2px solid #fd8c73" : "2px solid transparent",
            padding: "0.5rem 0.75rem",
            fontSize: "0.85rem",
            fontWeight: !selectedRepo ? 600 : 400,
            color: "#1f2328",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <BookOpen size={16} />
          <span>Repositories</span>
          <span style={{ backgroundColor: "#afb8c133", color: "#1f2328", borderRadius: "24px", fontSize: "0.72rem", padding: "0 6px", fontWeight: 600 }}>
            {repos.length}
          </span>
        </button>

        {selectedRepo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            borderBottom: "2px solid #fd8c73",
            color: "#1f2328"
          }}>
            <Layers size={16} />
            <span>Code: {selectedRepo.name}</span>
          </div>
        )}
      </div>

      {/* REPOSITORY LIST VIEW (IDENTICAL TO GITHUB REPO TAB) */}
      {!selectedRepo && (
        <div>
          {/* Search and Filters Bar */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", flexGrow: 1 }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#656d76" }} />
              <input
                type="text"
                placeholder="Find a repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  border: "1px solid #d0d7de",
                  backgroundColor: "#ffffff",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem",
                  fontSize: "0.85rem",
                  borderRadius: "6px",
                  border: "1px solid #d0d7de",
                  backgroundColor: "#f6f8fa",
                  color: "#1f2328",
                  cursor: "pointer"
                }}
              >
                {languagesList.map(lang => (
                  <option key={lang} value={lang}>{lang === "All" ? "Language: All" : lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Repo list container */}
          {loadingRepos ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px", flexDirection: "column", gap: "0.75rem" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "#0969da" }} />
              <span style={{ fontSize: "0.85rem", color: "#656d76" }}>Loading repositories from GitHub...</span>
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#cf222e", border: "1px solid #d0d7de", borderRadius: "6px" }}>
              {error}
            </div>
          ) : filteredRepos.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#656d76", border: "1px dashed #d0d7de", borderRadius: "6px" }}>
              No repositories matched your search query.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid #d0d7de" }}>
              {filteredRepos.map((repo) => (
                <div 
                  key={repo.id}
                  style={{
                    padding: "1.25rem 0",
                    borderBottom: "1px solid #d0d7de",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    transition: "background-color 0.15s"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "80%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <button
                        onClick={() => selectRepository(repo)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          color: "#0969da",
                          cursor: "pointer",
                          textAlign: "left",
                          textDecoration: "none"
                        }}
                        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                      >
                        {repo.name}
                      </button>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        color: "#656d76",
                        border: "1px solid #d0d7de",
                        borderRadius: "2em",
                        padding: "0 7px",
                        lineHeight: "18px"
                      }}>
                        {repo.private ? "Private" : "Public"}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "#656d76", margin: 0, lineHeight: "1.4" }}>
                      {repo.description || "No description provided for this repository."}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.4rem", fontSize: "0.75rem", color: "#656d76" }}>
                      {repo.language && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e",
                            display: "inline-block"
                          }} />
                          <span>{repo.language}</span>
                        </div>
                      )}
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Star size={13} />
                        <span>{repo.stargazers_count || 0}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <GitFork size={13} />
                        <span>{repo.forks_count || 0}</span>
                      </div>

                      <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => selectRepository(repo)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      backgroundColor: "#f6f8fa",
                      color: "#1f2328",
                      border: "1px solid #d0d7de",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ebecf0"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f6f8fa"}
                  >
                    <span>Browse Files</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPOSITORY CODE EXPLORER VIEW (IDENTICAL TO GITHUB REPO VIEW) */}
      {selectedRepo && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Top Repo Header Breadcrumb & Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem" }}>
              <button 
                onClick={handleBackToRepos}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#0969da", padding: 0, fontWeight: 500 }}
              >
                {selectedRepo.owner || username}
              </button>
              <span style={{ color: "#656d76" }}>/</span>
              <strong style={{ color: "#0969da", fontWeight: 700 }}>{selectedRepo.name}</strong>
              <span style={{ fontSize: "0.72rem", border: "1px solid #d0d7de", borderRadius: "2em", padding: "0 7px", color: "#656d76", fontWeight: 500, marginLeft: "0.25rem" }}>
                {selectedRepo.private ? "Private" : "Public"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleBackToRepos}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: "#f6f8fa",
                  color: "#1f2328",
                  border: "1px solid #d0d7de",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                <ArrowLeft size={13} />
                <span>All Repositories</span>
              </button>
            </div>
          </div>

          {/* Branch & Path Navigation Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* Branch Selector */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.65rem",
                backgroundColor: "#f6f8fa",
                border: "1px solid #d0d7de",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1f2328"
              }}>
                <GitBranch size={14} style={{ color: "#656d76" }} />
                <span>{selectedRepo.defaultBranch || "main"}</span>
                <ChevronDown size={12} style={{ color: "#656d76" }} />
              </div>

              {/* Breadcrumbs */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#1f2328" }}>
                <span 
                  onClick={() => fetchFiles(selectedRepo.owner || username, selectedRepo.name, "")}
                  style={{ cursor: "pointer", color: "#0969da", fontWeight: 600 }}
                >
                  {selectedRepo.name}
                </span>
                {currentPath && currentPath.split("/").filter(Boolean).map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <span style={{ color: "#656d76" }}>/</span>
                    <span 
                      onClick={() => handleBreadcrumbClick(idx)}
                      style={{ cursor: "pointer", color: "#0969da", fontWeight: idx === currentPath.split("/").length - 1 ? 700 : 500 }}
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "#656d76" }}>
              <span>{commits.length} commits</span>
            </div>
          </div>

          {/* FILE BROWSER TABLE OR FILE CONTENT VIEWER */}
          {!fileContent ? (
            <div style={{ border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden", backgroundColor: "#ffffff" }}>
              
              {/* Table Header: Latest Commit Bar */}
              <div style={{
                backgroundColor: "#f6f8fa",
                borderBottom: "1px solid #d0d7de",
                padding: "0.65rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <img 
                    src={avatar} 
                    alt="Author"
                    onError={(e) => { e.target.src = "https://avatars.githubusercontent.com/u/211518264?v=4"; }}
                    style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                  />
                  <span style={{ fontWeight: 600, color: "#1f2328" }}>{latestCommit.commit?.author?.name || username}</span>
                  <span style={{ color: "#656d76", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "420px" }}>
                    {latestCommit.commit?.message?.split("\n")[0] || "update files"}
                  </span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#656d76", fontSize: "0.75rem" }}>
                  <span style={{ fontFamily: "monospace" }}>{latestCommit.sha?.substring(0, 7)}</span>
                  <span>{new Date(latestCommit.commit?.author?.date || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Files Table Rows */}
              {loadingFiles ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "0.5rem" }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: "#0969da" }} />
                  <span style={{ fontSize: "0.82rem", color: "#656d76" }}>Fetching directory contents...</span>
                </div>
              ) : files.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#656d76", fontSize: "0.82rem" }}>
                  Empty folder or no files found.
                </div>
              ) : (
                <div>
                  {/* Up directory row */}
                  {currentPath && (
                    <div 
                      onClick={handleNavigateUp}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.55rem 1rem",
                        borderBottom: "1px solid #d0d7de",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        backgroundColor: "#ffffff",
                        color: "#0969da",
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f6f8fa"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                    >
                      <Folder size={16} style={{ color: "#54aeff" }} />
                      <span>.. (Parent directory)</span>
                    </div>
                  )}

                  {/* Directory items */}
                  {files.map((file) => (
                    <div
                      key={file.sha || file.name}
                      onClick={() => file.type === "dir" ? fetchFiles(selectedRepo.owner || username, selectedRepo.name, file.path) : loadFileContent(file)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "300px 1fr 140px",
                        alignItems: "center",
                        padding: "0.55rem 1rem",
                        borderBottom: "1px solid #d0d7de",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        backgroundColor: "#ffffff",
                        transition: "background-color 0.1s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f6f8fa"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                    >
                      {/* Name column */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.type === "dir" ? (
                          <Folder size={16} style={{ color: "#54aeff", flexShrink: 0 }} />
                        ) : (
                          <FileText size={16} style={{ color: "#656d76", flexShrink: 0 }} />
                        )}
                        <span style={{ color: file.type === "dir" ? "#1f2328" : "#0969da", fontWeight: file.type === "dir" ? 600 : 400 }}>
                          {file.name}
                        </span>
                      </div>

                      {/* Commit Message column */}
                      <div style={{ color: "#656d76", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "1rem" }}>
                        {file.type === "dir" ? `Explore ${file.name} directory` : `update ${file.name}`}
                      </div>

                      {/* Age / Size column */}
                      <div style={{ textAlign: "right", color: "#656d76", fontSize: "0.75rem" }}>
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "folder"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* GITHUB FILE BLOB VIEWER */
            <div style={{ border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden", backgroundColor: "#ffffff" }}>
              {/* File Header Bar */}
              <div style={{
                backgroundColor: "#f6f8fa",
                borderBottom: "1px solid #d0d7de",
                padding: "0.6rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                  <FileText size={16} style={{ color: "#656d76" }} />
                  <span style={{ fontWeight: 600, color: "#1f2328" }}>{fileContent.path}</span>
                  <span style={{ color: "#656d76", fontSize: "0.75rem", borderLeft: "1px solid #d0d7de", paddingLeft: "0.5rem" }}>
                    {fileContent.content.split("\n").length} lines ({fileContent.size ? `${(fileContent.size / 1024).toFixed(1)} KB` : "text"})
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0d7de",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#1f2328"
                    }}
                  >
                    {copied ? <Check size={12} style={{ color: "#1a7f37" }} /> : <Copy size={12} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>

                  <Link
                    href={`/intelligence?file_name=${encodeURIComponent(fileContent.name)}&file_path=${encodeURIComponent(fileContent.path)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.3rem 0.7rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      backgroundColor: "#0969da",
                      color: "#ffffff",
                      borderRadius: "6px",
                      textDecoration: "none"
                    }}
                  >
                    <Brain size={13} />
                    <span>Review in AI Intelligence</span>
                  </Link>

                  <button
                    onClick={() => setFileContent(null)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0d7de",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#cf222e"
                    }}
                  >
                    Close Viewer
                  </button>
                </div>
              </div>

              {/* Code Text Box with Line Numbers */}
              {loadingContent ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "240px", gap: "0.5rem" }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: "#0969da" }} />
                  <span style={{ fontSize: "0.82rem", color: "#656d76" }}>Loading code...</span>
                </div>
              ) : (
                <div style={{
                  display: "flex",
                  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
                  fontSize: "0.78rem",
                  lineHeight: "1.6",
                  backgroundColor: "#ffffff",
                  overflowX: "auto"
                }}>
                  {/* Line Numbers Column */}
                  <div style={{
                    padding: "0.75rem 0.5rem",
                    textAlign: "right",
                    userSelect: "none",
                    color: "#8c959f",
                    backgroundColor: "#f6f8fa",
                    borderRight: "1px solid #d0d7de",
                    minWidth: "40px"
                  }}>
                    {fileContent.content.split("\n").map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code Lines Column */}
                  <pre style={{
                    margin: 0,
                    padding: "0.75rem 1rem",
                    color: "#1f2328",
                    overflowX: "auto",
                    whiteSpace: "pre",
                    flexGrow: 1
                  }}>
                    {fileContent.content}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* README PREVIEW SECTION (JUST LIKE GITHUB REPO PAGE) */}
          {!fileContent && (
            <div style={{ border: "1px solid #d0d7de", borderRadius: "6px", overflow: "hidden", marginTop: "1rem", backgroundColor: "#ffffff" }}>
              <div style={{
                backgroundColor: "#f6f8fa",
                borderBottom: "1px solid #d0d7de",
                padding: "0.6rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1f2328",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <BookOpen size={15} style={{ color: "#656d76" }} />
                <span>README.md</span>
              </div>
              <div style={{ padding: "1.5rem", color: "#1f2328", lineHeight: "1.6", fontSize: "0.85rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid #d0d7de", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                  {selectedRepo.name}
                </h3>
                <p style={{ color: "#656d76", marginBottom: "1rem" }}>
                  {selectedRepo.description || "A high-performance repository maintained by DEVARAJ-07."}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "#656d76" }}>
                  <span style={{ border: "1px solid #d0d7de", borderRadius: "4px", padding: "0.2rem 0.5rem", backgroundColor: "#f6f8fa" }}>
                    Branch: {selectedRepo.defaultBranch || "main"}
                  </span>
                  <span style={{ border: "1px solid #d0d7de", borderRadius: "4px", padding: "0.2rem 0.5rem", backgroundColor: "#f6f8fa" }}>
                    Primary Language: {selectedRepo.language || "JavaScript"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
