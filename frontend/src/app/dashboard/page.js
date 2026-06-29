"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Github, Folder, File, ChevronRight, Loader2, ArrowLeft, Terminal,
  GitCommit, Star, GitFork, Brain
} from "lucide-react";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [token, setToken] = useState("");
  
  // GitHub Browser states
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedRepoOwner, setSelectedRepoOwner] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState([]);
  const [commits, setCommits] = useState([]);
  const [fileContent, setFileContent] = useState(null);
  
  // Loading states
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    const storedUser = localStorage.getItem("github_username") || "";
    const storedAvatar = localStorage.getItem("github_avatar") || "";
    const storedToken = localStorage.getItem("github_token") || "";

    setUsername(storedUser);
    setAvatar(storedAvatar);
    setToken(storedToken);

    if (storedUser) {
      fetchRepos(storedUser, storedToken);
    }
  }, []);

  const fetchRepos = async (user, tok) => {
    setLoadingRepos(true);
    setError("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (tok) {
        headers["Authorization"] = `token ${tok}`;
      }

      const url = tok 
        ? `https://api.github.com/user/repos?sort=updated&per_page=100`
        : `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
      }
      const data = await res.json();
      
      // Filter out duplicate repositories by unique GitHub ID
      const uniqueRepos = [];
      const seenIds = new Set();
      if (Array.isArray(data)) {
        for (const repo of data) {
          if (repo && repo.id && !seenIds.has(repo.id)) {
            // Hide the Python version of SmartEco
            if (repo.name === "SmartEco" && repo.language === "Python") {
              continue;
            }
            seenIds.add(repo.id);
            uniqueRepos.push(repo);
          }
        }
      }
      setRepos(uniqueRepos);
    } catch (err) {
      console.error(err);
      setError("Failed to load GitHub repositories. Check your API credentials or rate limit.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const selectRepository = async (repo) => {
    setSelectedRepo(repo.name);
    setSelectedRepoOwner(repo.owner.login);
    fetchFiles(repo.name, repo.owner.login, "");
    fetchCommits(repo.name, repo.owner.login);
  };

  const fetchFiles = async (repoName, repoOwner, path = "") => {
    setLoadingFiles(true);
    setFileContent(null);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, { headers });
      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
      }
      const data = await res.json();
      
      // Sort: directories first, then files alphabetically
      data.sort((a, b) => (b.type === "dir" ? 1 : 0) - (a.type === "dir" ? 1 : 0));
      setFiles(data);
      setCurrentPath(path);
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
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=5`, { headers });
      if (res.ok) {
        const data = await res.json();
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
      const res = await fetch(fileObj.download_url);
      if (!res.ok) throw new Error("Failed to download file");
      const text = await res.text();
      setFileContent({
        name: fileObj.name,
        path: fileObj.path,
        content: text
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load file content.");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleBackToRepos = () => {
    setSelectedRepo("");
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
    fetchFiles(selectedRepo, parentPath);
  };

  return (
    <div style={{ paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Workspace Dashboard</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Welcome back, {username || "Developer"}. Unified DevOps command center.
          </p>
        </div>
      </div>

      {/* Main Workspace Section */}
      <div style={{
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--color-off-white)",
        boxShadow: "6px 6px 0px var(--border-color)",
        padding: "1.5rem"
      }}>
        
        {/* Section Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          borderBottom: "1px solid var(--border-color)", 
          paddingBottom: "0.75rem", 
          marginBottom: "1.5rem" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Github size={18} />
            <h3 style={{ fontFamily: "monospace", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700 }}>
              {selectedRepo ? `Repository Explorer: ${selectedRepoOwner}/${selectedRepo}` : "Linked GitHub Repositories"}
            </h3>
          </div>
          {selectedRepo && (
            <button 
              onClick={handleBackToRepos}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                padding: "0.25rem 0.75rem",
                fontSize: "0.7rem",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: "#ffffff",
                boxShadow: "2px 2px 0px var(--border-color)"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <ArrowLeft size={12} /> Back to Repositories
              </span>
            </button>
          )}
        </div>

        {/* LOADING REPOS */}
        {loadingRepos && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", flexDirection: "column", gap: "0.5rem" }}>
            <Loader2 size={24} className="animate-spin" />
            <span style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>Loading repositories...</span>
          </div>
        )}

        {error && (
          <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-danger)", padding: "2rem", textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* LIST VIEW: Repository Card Boxes */}
        {!selectedRepo && !loadingRepos && !error && (
          <div>
            {repos.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.8rem", border: "1px dashed var(--border-color)", backgroundColor: "#ffffff" }}>
                No repositories found. Sign in with GitHub on the landing page to load repositories.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                {repos.map((repo) => (
                  <div 
                    key={repo.id}
                    onClick={() => selectRepository(repo)}
                    style={{
                      border: "1px solid var(--border-color)",
                      padding: "1.25rem",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      boxShadow: "3px 3px 0px var(--border-color)",
                      transition: "all 0.1s ease",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: "150px"
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
                      <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.6rem", fontFamily: "monospace", padding: "0.1rem 0.4rem", backgroundColor: "var(--color-warm-grey)", border: "1px solid var(--border-color)", fontWeight: 700 }}>
                          {repo.private ? "🔒 PRIVATE" : "🌐 PUBLIC"}
                        </span>
                      </div>
                      <strong style={{ fontSize: "0.85rem", display: "block", marginBottom: "0.5rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={repo.full_name}>{repo.full_name}</strong>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0.5rem 0", height: "40px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {repo.description || "No description provided for this repository."}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", borderTop: "1px dotted var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.65rem", fontFamily: "monospace" }}>
                        {repo.language && (
                          <span style={{ fontWeight: 700 }}>{repo.language}</span>
                        )}
                        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <Star size={10} /> {repo.stargazers_count}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                          <GitFork size={10} /> {repo.forks_count}
                        </span>
                      </div>
                      <ChevronRight size={14} style={{ marginLeft: "auto" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW: File Traversal & Commits Side-by-Side */}
        {selectedRepo && !fileContent && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem", alignItems: "start" }}>
            
            {/* Left Sub-column: File Explorer */}
            <div>
              <div style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                padding: "0.5rem 0.75rem",
                backgroundColor: "var(--color-warm-grey)",
                border: "1px solid var(--border-color)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                {currentPath && (
                  <button 
                    onClick={handleNavigateUp}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    <ArrowLeft size={14} />
                  </button>
                )}
                <span>/{currentPath || "root"}</span>
              </div>

              {loadingFiles ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-color)", backgroundColor: "#ffffff" }}>
                  {files.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                      This folder is empty.
                    </div>
                  ) : (
                    files.map((file) => (
                      <div 
                        key={file.sha}
                        onClick={() => file.type === "dir" ? fetchFiles(selectedRepo, file.path) : loadFileContent(file)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.6rem 0.75rem",
                          borderBottom: "1px solid var(--border-color)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          transition: "background-color 0.1s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-warm-grey)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        {file.type === "dir" ? (
                          <Folder size={16} style={{ color: "#d97706" }} />
                        ) : (
                          <File size={16} style={{ color: "var(--text-secondary)" }} />
                        )}
                        <span style={{ flexGrow: 1, fontFamily: "monospace" }}>{file.name}</span>
                        <ChevronRight size={12} style={{ opacity: 0.5 }} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right Sub-column: Commits Timeline */}
            <div style={{
              border: "1px solid var(--border-color)",
              padding: "1rem",
              backgroundColor: "var(--color-warm-grey)"
            }}>
              <h4 style={{ fontFamily: "monospace", fontSize: "0.75rem", textTransform: "uppercase", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <GitCommit size={14} /> Recent Repository Commits
              </h4>

              {loadingCommits ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px" }}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
              ) : commits.length === 0 ? (
                <div style={{ padding: "1rem", fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  No commits found or unable to fetch history.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {commits.map((c, i) => (
                    <div 
                      key={c.sha} 
                      style={{
                        padding: "0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.7rem",
                        fontFamily: "monospace",
                        position: "relative"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        <span>@{c.commit.author.name}</span>
                        <span>{new Date(c.commit.author.date).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontWeight: 700, margin: "0.25rem 0", lineHeight: "1.3" }}>
                        {c.commit.message.split("\n")[0]}
                      </p>
                      <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", display: "block", marginTop: "0.25rem", backgroundColor: "var(--color-warm-grey)", padding: "0.1rem 0.3rem", width: "fit-content" }}>
                        SHA: {c.sha.substring(0, 7)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILE CONTENT PANEL */}
        {selectedRepo && fileContent && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 700 }}>
                📄 {fileContent.path}
              </span>
              <button
                onClick={() => setFileContent(null)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color)",
                  padding: "0.2rem 0.6rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  backgroundColor: "#ffffff"
                }}
              >
                Close File Viewer
              </button>
            </div>

            {loadingContent ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <textarea
                  readOnly
                  value={fileContent.content}
                  style={{
                    width: "100%",
                    height: "350px",
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    padding: "0.75rem",
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                    border: "1px solid var(--border-color)",
                    resize: "none"
                  }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <Link
                    href={`/intelligence?file_name=${encodeURIComponent(fileContent.name)}&file_path=${encodeURIComponent(fileContent.path)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.55rem 1rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      backgroundColor: "var(--color-accent)",
                      color: "#ffffff",
                      border: "1px solid var(--border-color)",
                      boxShadow: "3px 3px 0px var(--border-color)",
                      textDecoration: "none",
                      fontWeight: 700
                    }}
                  >
                    <Brain size={14} />
                    Load File in AI Console
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
