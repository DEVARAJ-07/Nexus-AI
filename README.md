# Outpost AI — Business Command Center 🧠 [Beta Version]

> [!IMPORTANT]
> This repository contains the **Beta Version** of the Outpost AI Business Command Center. Active development is underway for core AI workflows, CRM pipelines, and integrations.

Outpost AI is an AI-powered all-in-one business command center that helps teams manage intelligence, content creation, leads, analytics, workflows, and integrations from a single unified platform. Replace 5–10 tools with one AI-native workspace.

Core Promise: **One platform. Six superpowers. Zero context-switching.**

---

## 🏗️ Architecture Layout

```
[ Frontend: React + Vite SPA ] ◄──(HTTPS REST / WebSockets)──► [ Backend: Node.js + Express ]
                                                                      │
                                                                      ├──► Supabase DB & Auth
                                                                      ├──► Upstash Redis (BullMQ)
                                                                      └──► Claude & OpenAI APIs
```

- **frontend/**: React + Vite SPA (Tailwind styled, Zustand state management, react-router v6 navigation).
- **backend/**: Node.js + Express.js API server (real-time Socket.io, BullMQ worker queues, Claude stream API integrations).
- **database/**: Prisma ORM schemas mapping all workspace, intelligence, content, crm, and automation tables.

---

## 🔌 Modules Map

1. **🧠 Intelligence Hub** (`/intelligence`): Knowledge base semantic search, document Q&A, and web research summaries.
2. **✍️ Content Studio** (`/content`): SEO long-form post generator, content calendar scheduler, andbrand voice analyzer.
3. **🎯 CRM & Lead Engine** (`/crm`): Prospects Kanban card pipelines and AI lead scoring (1-100).
4. **📊 Analytics Center** (`/analytics`): conversion funnels, activity heatmaps, and AI metrics insight cards.
5. **⚡ Automation Forge** (`/automation`): Visual drag-and-drop node builders for triggers and actions mapping.
6. **🔌 Integration Gateway** (`/integrations`): Prebuilt marketplace bindings (Slack, Notion), API Keys generation, and webhooks config.

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

### 3. Run Development Environments
Start the backend and frontend dev environments concurrently:
```bash
# Start backend API (Default Port: 5000)
npm run dev:backend

# Start frontend UI (Default Port: 5173)
npm run dev:frontend
```
Open [http://localhost:5173](http://localhost:5173) in your browser to launch the command center.
