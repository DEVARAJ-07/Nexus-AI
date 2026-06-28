const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "default-workspace-id" },
    update: {},
    create: {
      id: "default-workspace-id",
      name: "Nexus Headquarters",
      plan: "FREE",
    },
  });
  console.log("Workspace created/verified:", workspace.name);

  // 2. Create User
  const user = await prisma.user.upsert({
    where: { email: "john@nexus-ci.com" },
    update: {},
    create: {
      id: "default-user-id",
      email: "john@nexus-ci.com",
      name: "John Doe",
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });
  console.log("User created/verified:", user.name);

  // 3. Create initial Repositories (mapped to Contact table)
  const repos = [
    { id: "repo-1", name: "nexus-auth-service", branch: "master", stage: "PRODUCTION", health: 98 },
    { id: "repo-2", name: "nexus-backend-api", branch: "main", stage: "PRODUCTION", health: 95 },
    { id: "repo-3", name: "nexus-worker-node", branch: "release/v0.1", stage: "STAGING", health: 85 },
    { id: "repo-4", name: "nexus-frontend-client", branch: "dev", stage: "TESTING", health: 74 },
    { id: "repo-5", name: "nexus-data-pipeline", branch: "hotfix/db-leak", stage: "DEV", health: 42 },
  ];

  for (const r of repos) {
    await prisma.contact.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        source: r.branch,
        stage: r.stage,
        score: r.health,
      },
      create: {
        id: r.id,
        name: r.name,
        email: `${r.name}@nexus-ci.com`, // Required fields in Contact schema
        source: r.branch,
        stage: r.stage,
        score: r.health,
        workspaceId: workspace.id,
      },
    });
  }
  console.log("Mock repositories seeded into contacts table.");

  // 4. Create initial Server Clusters (mapped to Company table)
  await prisma.company.upsert({
    where: { id: "cluster-1" },
    update: {},
    create: {
      id: "cluster-1",
      name: "Nexus Kubernetes Cluster",
      website: "HEALTHY", // using website for status
      industry: "AWS EKS", // using industry for type
      workspaceId: workspace.id,
    },
  });
  console.log("Mock cluster seeded into companies table.");

  // 5. Create initial Workflows
  const workflows = [
    {
      id: "wf-1",
      name: "Production Auto-Deploy on Push",
      triggerConfig: JSON.stringify({ type: "GIT_PUSH" }),
      stepsJson: JSON.stringify([{ action: "TRIGGER_DEPLOY", provider: "Vercel" }]),
      status: "ACTIVE",
    },
    {
      id: "wf-2",
      name: "AI Log Repair on Build Failure",
      triggerConfig: JSON.stringify({ type: "PIPELINE_FAILED" }),
      stepsJson: JSON.stringify([{ action: "AI_LOG_DIAGNOSTICS" }]),
      status: "ACTIVE",
    },
    {
      id: "wf-3",
      name: "Post Slack Alert on PR Open",
      triggerConfig: JSON.stringify({ type: "PR_OPENED" }),
      stepsJson: JSON.stringify([{ action: "POST_SLACK_ALERT", channel: "alerts" }]),
      status: "INACTIVE",
    },
  ];

  for (const w of workflows) {
    await prisma.workflow.upsert({
      where: { id: w.id },
      update: {
        name: w.name,
        triggerConfig: w.triggerConfig,
        stepsJson: w.stepsJson,
        status: w.status,
      },
      create: {
        id: w.id,
        name: w.name,
        triggerConfig: w.triggerConfig,
        stepsJson: w.stepsJson,
        status: w.status,
        workspaceId: workspace.id,
      },
    });
  }
  console.log("Mock workflows seeded.");

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
