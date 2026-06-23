# Nexus AI — Pipeline Command Center 🧠 [Beta Version]

> [!IMPORTANT]
> This repository contains the **Beta Version** of the Nexus AI Pipeline Command Center. Active development is underway for core AI workflows, repository pipelines, and integrations.

Nexus AI is an AI-powered all-in-one developer pipeline command center that helps teams manage build log intelligence, release changelogs, repository pipelines, analytics, workflows, and integrations from a single unified platform. Replace 5–10 tools with one AI-native workspace.

Core Promise: **One platform. Six superpowers. Zero context-switching.**

---

## 🏗️ Architecture Layout

```
[ Frontend: Next.js App Router ] ◄──(HTTPS REST / SSE Streams)──► [ Backend: Node.js + Express ]
                                                                        │
                                                                        ├──► Supabase DB & Auth
                                                                        ├──► Upstash Redis (BullMQ)
                                                                        └──► Claude & OpenAI APIs
```

- **frontend/**: Next.js App Router workspace (Vanilla CSS, Zustand state management, lucide-react iconography).
- **backend/**: Node.js + Express.js API server (real-time streaming API, BullMQ worker queues, Claude stream API integrations).
- **database/**: Prisma ORM schemas mapping all workspace, pipeline, and automation tables.

---

## 🔌 Modules Map

1. **🧠 Log & Pipeline Intelligence** (`/intelligence`): Build log failure diagnosis, interactive code patch diff generation, and vulnerability security scanners.
2. **✍️ Release & Docs Studio** (`/content`): Technical changelog compiler, release notes generator, and PR description synthesis.
3. **🎯 Pipeline Kanban & Repositories** (`/crm`): Active branch delivery visualizer and AI health diagnostics engine.
4. **📊 Pipeline Analytics** (`/analytics`): Build duration trends, cache anomaly warnings, and test failure tracking.
5. **⚡ DevOps Automation** (`/automation`): Visual trigger-action engine mapping Git hooks to test execution, deploys, and alerts.
6. **🔌 DevOps Integrations** (`/integrations`): Prebuilt marketplace credentials (GitHub, Vercel, Render), API Token key vault, and webhook triggers.

---

## 🛠️ Getting Started

### 1. Installation & Setup
Make sure you have [Node.js](https://nodejs.org) installed. From the monorepo root:
```bash
npm install
```

### 2. Generate Prisma ORM client
Generate database schema typings:
```bash
npm run db:generate
```

### 3. Run Production Server Environments
Start the backend and frontend dev/start environments concurrently:
```bash
# Start backend API (Default Port: 5000) and Frontend Next.js (Default Port: 3000)
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser to launch the command center.
