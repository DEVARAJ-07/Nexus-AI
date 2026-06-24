# Nexus AI Monorepo - Roadmap & What's Next to Implement

This document details the current implementation status and provides an end-to-end implementation roadmap for the remainder of the Nexus AI platform.

---

## 🚀 1. RECENTLY COMPLETED

We have successfully refined the backend foundations and API routing layer:
1. **Prisma Client Database Layer**: Initialized a global database connector instance at `backend/src/config/db.js` and successfully built Prisma client binaries.
2. **Refactored Backend Routes**: Changed all backend endpoints (Auth, Log Intelligence, Release Studio, CRM Pipeline, Analytics, DevOps Automation, DevOps Integrations) to query and write to the database using Prisma client, replacing the previous static in-memory arrays.
3. **Graceful Seeding**: Enabled auto-seeding for documents, content pieces, contacts (repositories), workflows, integrations, and reports so that if database tables are empty, they populate with robust initial DevOps data automatically.
4. **Local Dev Infrastructure**: Created a root `docker-compose.yml` to boot local PostgreSQL and Redis servers, alongside matching `.env` configuration files for the database and backend.

---

## 🛠️ 2. END-TO-END EXECUTION STEPS

To run the unified application with a live database:
1. **Boot Services**: Run `docker-compose up -d` in the root folder to start PostgreSQL and Redis.
2. **Push DB Schema**: Run `npm run db:push` to sync the Prisma models with the PostgreSQL instance.
3. **Launch Monorepo**: Run `npm run dev` to start both the Next.js frontend (port 3000) and Express.js API (port 5000) concurrently.

---

## 📋 3. WHAT'S NEXT TO IMPLEMENT

Here is the exhaustive, end-to-end list of remaining feature implementations for all modules:

### 🧠 Module 1: Log & Pipeline Intelligence (Intelligence Core)
- [ ] **Claude 3.5 Sonnet Integration**:
  - Replace the SSE stream token mock in `/api/ai/chat-stream` with actual calls to the Anthropic Claude API (`@google/generative-ai` or `sdk` as required).
  - Inject workspace context prompts and history from the database into the Claude system message.
- [ ] **Pinecone & Embeddings Ingestion**:
  - Implement a document upload parsing utility using `pdf-parse`.
  - Set up a text splitter (e.g. 500-token chunks with 50-token overlap).
  - Call OpenAI `text-embedding-3-small` API to generate vectors.
  - Integrate a Pinecone client connection to upsert vectors scoped by `workspaceId` namespaces.
- [ ] **Web Research Assistant**:
  - Implement a web search tool capability inside the Claude agent.
  - Connect the summary output save handler to write semantic entries directly to `prisma.knowledgeItem` table.

### ✍️ Module 2: Release & Docs Studio (Content Forge)
- [ ] **Claude Content Prompts**:
  - Replace the SSE generation stream text mock in `/api/content/generate` with a custom prompt framework for blog, social, email, ad, product, and landing page content types.
- [ ] **Brand Voice Style Profile**:
  - Connect `/api/content/brand-voice/analyze` to a Claude parser that reads paste examples and outputs styled JSON guidelines.
  - Append the style guidelines to generation prompts if the brand voice toggle is active.
- [ ] **Content Calendar Drag-and-Drop**:
  - Build date-updating endpoints in the backend to support card moving on the calendar UI.

### 🎯 Module 3: Pipeline Kanban & Repositories (Lead CRM)
- [ ] **Health Scoring & Next Actions**:
  - Connect score calculations to a Claude evaluator that reviews commit logs, branch activity, and test reports to compute health scores (1-100) and writes them to the DB.
- [ ] **Activity Logs**:
  - Map pipeline drag events to insert events into `prisma.activity` and `prisma.note` tables.

### 📊 Module 4: Pipeline Analytics (Analytics Pulse)
- [ ] **Analytics Event Tracking**:
  - Implement middleware to log frontend events into the `AnalyticsEvent` DB table.
- [ ] **AI Daily Insights Agent**:
  - Schedule a daily cron job using BullMQ to gather the last 7 days of events.
  - Prompt Claude to generate 3-5 high-priority insights, suggestions, and actions, and write them to an `insights` feed table.
- [ ] **Report Email Digests**:
  - Implement HTML rendering for saved reports and schedule email delivery via Resend API.

### ⚡ Module 5: DevOps Automation (Automation Engine)
- [ ] **BullMQ Automation Queues**:
  - Initialize BullMQ workers in `backend/src/workers/` connecting to Redis.
  - Parse trigger configurations (e.g. `contact.created` or `contact.stage_changed`).
  - Implement condition evaluation logic (AND/OR field operators).
  - Build action adapters: `SEND_EMAIL` (via Resend), `NOTIFY_SLACK` (via webhooks), `TRIGGER_DEPLOY` (via HTTP POST).

### 🔌 Module 6: DevOps Integrations (Connect Hub)
- [ ] **OAuth Connection Flows**:
  - Implement callback routes for Slack, GitHub, and Google OAuth redirection.
  - Encrypt and store access tokens in `prisma.integration` credentials.
- [ ] **Security Middleware**:
  - Enforce `ApiKey` verification on inbound external routes.
  - Check HMAC signatures on inbound webhooks.
  - Set up rate limiters on AI and auth endpoints.
- [ ] **Outbound Webhook Delivery**:
  - Build a webhook dispatch queue in BullMQ with automated exponential backoff retries.

---

## 🏁 4. QA & PRODUCTION DEPLOYMENT
- [ ] **Testing Suite**:
  - Add unit tests with Vitest on the frontend.
  - Write API routes integration tests using Jest and Supertest in the backend.
- [ ] **AWS Paid v2 Upgrade**:
  - Set up GitHub Actions workflow to build Docker image and push to AWS ECR.
  - Set up AWS ECS Fargate task definitions for autoscale containers.
  - Provision AWS RDS PostgreSQL Multi-AZ and ElastiCache Redis.
