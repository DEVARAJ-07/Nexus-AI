#!/usr/bin/env node

const prisma = require("./backend/src/config/db");
const queueService = require("./backend/src/services/queue.service");

// Note: We use a simple argv parsing to avoid extra package dependencies if commander is not installed globally
const args = process.argv.slice(2);

console.log(`
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEXUS AI — DEVOPS PIPELINE RUNNER & PROBE ENGINE v1.0
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

if (args.length === 0 || args[0] !== "run") {
  console.log("Usage: node nexus.js run --branch <branch> --module <module>");
  console.log("Example: node nexus.js run --branch main --module intelligence");
  process.exit(0);
}

// Simple parsing
let branch = "main";
let moduleName = "intelligence";

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--branch" && args[i + 1]) {
    branch = args[i + 1];
  }
  if (args[i] === "--module" && args[i + 1]) {
    moduleName = args[i + 1];
  }
}

async function main() {
  try {
    console.log(`[CLI_INGESTION] Triggered run command:`);
    console.log(`  - Target Branch : ${branch}`);
    console.log(`  - Target Module : ${moduleName}`);
    console.log("---------------------------------------------------------");

    // Get or create workspace
    let ws = await prisma.workspace.findFirst();
    if (!ws) {
      ws = await prisma.workspace.create({
        data: {
          name: "CLI Workspace",
          plan: "PRO",
        },
      });
    }

    // Find or create workflow corresponding to the CLI probe run
    let workflow = await prisma.workflow.findFirst({
      where: {
        name: `CLI ${moduleName.toUpperCase()} PROBES FLOW`,
        workspaceId: ws.id,
      },
    });

    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: {
          name: `CLI ${moduleName.toUpperCase()} PROBES FLOW`,
          triggerConfig: JSON.stringify({ type: "CLI_TRIGGER", branch, module: moduleName }),
          stepsJson: JSON.stringify([
            { action: "NOTIFY_SLACK", channel: "devops-alerts" },
            { action: "SYNC_NOTION" },
            { action: "TRIGGER_DEPLOY" }
          ]),
          status: "ACTIVE",
          workspaceId: ws.id,
        },
      });
    }

    console.log(`[CLI_INGESTION] Resolved Workflow: ${workflow.name} (ID: ${workflow.id})`);
    console.log("[CLI_INGESTION] Dispatching execution job payload to SQS/Redis Queue...");

    // Dispatch job to queue
    const run = await queueService.dispatchJob(workflow.id, { branch, email: "cli@nexus.ai" });
    console.log(`[CLI_INGESTION] Job queued successfully. Run ID: ${run.id}`);
    console.log("[CLI_INGESTION] Nexus Worker boot initiated. Running active probes...");
    console.log("---------------------------------------------------------");

    // Wait 2 seconds for worker to process probes and complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch finished run logs
    const completedRun = await prisma.workflowRun.findUnique({
      where: { id: run.id },
    });

    const logs = JSON.parse(completedRun.logJson || "[]");
    
    // Print out the worker traces beautifully
    logs.forEach(log => {
      if (log.includes("ERROR")) {
        console.log(`\x1b[31m${log}\x1b[0m`);
      } else if (log.includes("PROBE") || log.includes("Action:")) {
        console.log(`\x1b[36m${log}\x1b[0m`);
      } else if (log.includes("TGT_")) {
        console.log(`\x1b[32m${log}\x1b[0m`);
      } else {
        console.log(log);
      }
    });

    console.log("---------------------------------------------------------");
    console.log(`[CLI_INGESTION] Pipeline Execution Result: \x1b[32m${completedRun.status} 🟢\x1b[0m`);
    process.exit(0);
  } catch (error) {
    console.error("\x1b[31m[CLI_INGESTION_ERROR] Pipeline run failed:\x1b[0m", error);
    process.exit(1);
  }
}

main();
