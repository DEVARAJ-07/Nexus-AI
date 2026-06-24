# Nexus AI Monorepo - Master Tasks & Daily Tracker

This file serves as the workspace's master list of daily tasks and progress tracking. Mark items as completed as development progresses.

---

## 🏗️ 1. SETUP & CONFIGURATION

- [ ] **Environment Variables Setup**
  - [ ] Create `.env` in `backend/` and `frontend/` matching specifications
  - [ ] Configure `DATABASE_URL` (Supabase Postgres)
  - [ ] Configure API keys: `CLAUDE_API_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`
- [ ] **Database Setup & Migrations**
  - [ ] Verify Prisma Schema models
  - [ ] Run initial migrations or push schema using `npm run db:push`
  - [ ] Set up a workspace seed script for demo user/workspace records
  - [ ] Establish Row Level Security (RLS) policies on database level
  - [ ] Verify database indexes on foreign keys and frequently searched fields
- [ ] **Security Checks**
  - [ ] Enable CORS rules matching the frontend URL
  - [ ] Add Helmet.js to backend configurations
  - [ ] Set up rate limiters on AI chat and authentication endpoints

---

## 🧠 2. MODULE 1 — LOG & PIPELINE INTELLIGENCE (INTELLIGENCE CORE)

- [ ] **Core Chat Workflows**
  - [ ] Integrate Claude SSE streaming response endpoint in backend `/api/ai/chat-stream`
  - [ ] Configure custom workspace system prompts
  - [ ] Verify frontend streaming token assembly and UI render
- [ ] **Document Diagnostics**
  - [ ] Configure Multer storage to handle build log and PDF uploads
  - [ ] Build parsing script using `pdf-parse` (or plain text parser for logs)
  - [ ] Set up text splitter/chunker (500 tokens, 50 token overlap)
  - [ ] Integrate OpenAI embeddings (`text-embedding-3-small`)
  - [ ] Integrate Pinecone index connection and document search query
- [ ] **Web Research Assistant**
  - [ ] Integrate web search tool calls within Claude chats
  - [ ] Build UI selectors for research depth (Quick 30s vs Deep 2m)
  - [ ] Add "Save to Knowledge Base" button for summaries
- [ ] **Knowledge Base**
  - [ ] Implement semantic search routing on Knowledge items
  - [ ] Add CSV import/export endpoints for knowledge base items
  - [ ] Add access controls (e.g. admin-only articles)
- [ ] **Prompt Library**
  - [ ] Populate database prompt library categories
  - [ ] Enable prompt saving from active chat sessions

---

## ✍️ 3. MODULE 2 — RELEASE & DOCS STUDIO (CONTENT FORGE)

- [ ] **Content Generation**
  - [ ] Build form templates for blog, social, email, ad, product, and landing page copies
  - [ ] Connect generation prompt builder to Claude API (with stream support)
  - [ ] Add TipTap rich text editor integration on frontend with AI "Continue Writing" and "Improve Section" controls
- [ ] **Brand Voice System**
  - [ ] Set up Brand Voice model and profile analyzer prompt
  - [ ] Enable global brand voice toggle on content generation endpoints
- [ ] **Content Calendar**
  - [ ] Build interactive calendar UI with drag-and-drop cards
  - [ ] Add iCal/CSV export functionalities
- [ ] **Version History & Templates**
  - [ ] Implement version snapshots for content pieces (retain last 10 versions)
  - [ ] Enable template saving and loading controls

---

## 🎯 4. MODULE 3 — PIPELINE KANBAN & REPOSITORIES (LEAD CRM)

- [ ] **Interactive Kanban Boards**
  - [ ] Set up drag-and-drop Kanban view of pipeline stages (DEV to PRODUCTION)
  - [ ] Connect stage changes to active database mutations
  - [ ] Add duration tracking per pipeline stage
- [ ] **AI Diagnostics & Health Scores**
  - [ ] Implement Claude-powered pipeline health scoring API
  - [ ] Display next-best-action alerts on anomalies and low-health states
- [ ] **Repository Import**
  - [ ] Build repository import/sync mapping interface
  - [ ] Implement activity log tracking for pipeline adjustments

---

## 📊 5. MODULE 4 — PIPELINE ANALYTICS (ANALYTICS PULSE)

- [ ] **Overview Dashboards**
  - [ ] Integrate KPI summary statistics (Active repos, builds run, success rates)
  - [ ] Build trend line charts of build durations and test coverage
- [ ] **AI Insights Feed**
  - [ ] Set up daily cron jobs to analyze logs and event history
  - [ ] Implement Claude-powered diagnostic insight generations (collapsible summaries and recommendations)
- [ ] **Custom Reports**
  - [ ] Build custom metric aggregator interface
  - [ ] Set up email digest deliveries via Resend API

---

## ⚡ 6. MODULE 5 — DEVOPS AUTOMATION (AUTOMATION ENGINE)

- [ ] **Visual Workflow Builder**
  - [ ] Render visual builder canvas using `@dnd-kit/core`
  - [ ] Set up step nodes (Triggers, Conditions, Actions, Delays)
- [ ] **Workflow Executor**
  - [ ] Integrate BullMQ queue system to schedule and execute steps
  - [ ] Build action adapters (Slack alerts, deploy triggers, email notifications)
- [ ] **Execution Logs**
  - [ ] Implement step-by-step execution tracer and rerun trigger buttons

---

## 🔌 7. MODULE 6 — DEVOPS INTEGRATIONS (CONNECT HUB)

- [ ] **Integration Marketplace**
  - [ ] Set up OAuth handlers (Google, Slack, GitHub)
  - [ ] Secure token storage using environment encryption
- [ ] **API Keys & Webhooks**
  - [ ] Build API Key generator and bcrypt hashing check middleware
  - [ ] Create HMAC-SHA256 signature verification for inbound webhooks
  - [ ] Implement outbound webhook dispatch with exponential backoff retry cycles
- [ ] **Sync Monitoring**
  - [ ] Design sync log logs view with connection testing buttons

---

## 🏁 8. CI/CD PIPELINE & TESTING

- [ ] **Unit & Integration Tests**
  - [ ] Add Vitest config for frontend testing
  - [ ] Add Jest and Supertest configurations for backend API routes
- [ ] **CI/CD Pipeline**
  - [ ] Set up GitHub Actions CI workflow (linting, typechecks, tests, builds)
  - [ ] Hook Vercel and Render deploy webhooks to workflow runs
