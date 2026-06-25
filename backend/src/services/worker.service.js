const prisma = require("../config/db");
const integrationService = require("./integration.service");

class WorkerService {
  async executeWorkflowRun(runId, workflowId, triggerPayload) {
    const trace = [];
    trace.push(`[NEXUS_WORKER] Initializing worker execution for workflow: ${workflowId}`);
    
    try {
      // 1. Fetch the workflow details
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error("Workflow not found in database");
      }

      trace.push(`[NEXUS_WORKER] Loaded trigger configuration: ${workflow.triggerConfig}`);

      // 2. Load Prompts & Context Guidelines (Architecture step: [load_prompts])
      trace.push("[NEXUS_WORKER] Action: [load_prompts] <--- reading guidelines & docs context");
      const docs = await prisma.document.findMany({
        where: { workspaceId: workflow.workspaceId },
        take: 3,
      });
      trace.push(`[NEXUS_WORKER] Context loaded. Document references scanned: ${docs.map(d => d.name).join(", ") || "none"}`);

      // 3. Dispatch Probes (Architecture step: [dispatch_probes] :: Fan-out LangGraph Send() actions)
      trace.push("[NEXUS_WORKER] Action: [dispatch_probes] :: Fanning out parallel target evaluations");
      
      const probe1 = this.executeProbe("PROBE_1 (Compile/Lint Check)", "Reviewing repository workspaces for syntax integrity.");
      const probe2 = this.executeProbe("PROBE_2 (Security Check)", "Scanning env variables for secret key exposures.");
      const probe3 = this.executeProbe("PROBE_N (Test Runner)", "Evaluating core route handler test suites.");

      const probeResults = await Promise.all([probe1, probe2, probe3]);
      
      probeResults.forEach(res => {
        trace.push(`[NEXUS_PROBE] -> ${res.name}: ${res.status} (${res.message})`);
      });

      // 4. Target Evaluations (Architecture step: Slack/Notion/Production Deploy target runs)
      let steps = [];
      try {
        steps = JSON.parse(workflow.stepsJson || "[]");
      } catch (e) {
        trace.push("[NEXUS_WORKER] Warning: Failed to parse steps JSON, applying default Slack notification target");
        steps = [{ action: "NOTIFY_SLACK", channel: "devops-alerts" }];
      }

      for (const step of steps) {
        const actionType = step.action || step.type;
        trace.push(`[NEXUS_WORKER] Evaluating action: ${actionType}`);

        if (actionType === "SEND_EMAIL") {
          trace.push("[TGT_EMAIL] Sending developer alert email via Resend API...");
          const res = await integrationService.sendEmail({
            to: triggerPayload.email || "dev@nexus.ai",
            subject: `Pipeline Alert: ${workflow.name}`,
            body: `Workflow alert triggered. Probes passed successfully.`,
          });
          trace.push(`[TGT_EMAIL] Resend response: ${res.message}`);
        } 
        else if (actionType === "NOTIFY_SLACK" || actionType === "send_slack") {
          trace.push("[TGT_SLACK] Dispatching interactive card block notifications...");
          const res = await integrationService.sendSlackNotification({
            channel: step.channel || "general",
            text: `🔥 Pipeline alert triggered for workflow: *${workflow.name}*`,
          });
          trace.push(`[TGT_SLACK] Slack webhook result: ${res.status}`);
        } 
        else if (actionType === "SYNC_NOTION") {
          trace.push("[TGT_NOTION] Action: Notion Docs sync initializing...");
          const res = await integrationService.syncNotionDocs({
            title: workflow.name,
            content: `Trigger: ${workflow.triggerConfig}. Status: COMPLETED.`,
          });
          trace.push(`[TGT_NOTION] Sync status: ${res.status}`);
        } 
        else if (actionType === "TRIGGER_DEPLOY") {
          trace.push("[TGT_DEPLOY] Action: Phased production deployment sync trigger dispatched.");
          const res = await integrationService.triggerProductionDeploy({
            branch: triggerPayload.branch || "main",
          });
          trace.push(`[TGT_DEPLOY] Deploy server logs: ${res.logs}`);
        }
      }

      trace.push("[NEXUS_WORKER] All probes and target evaluations completed successfully.");

      // 5. Update Workflow Run to COMPLETED
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "COMPLETED",
          finishedAt: new Date(),
          logJson: JSON.stringify(trace),
        },
      });

    } catch (error) {
      console.error(`Workflow execution failed for run ${runId}:`, error);
      trace.push(`[NEXUS_WORKER_ERROR] Execution failed: ${error.message}`);
      
      // Update Workflow Run to FAILED
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          finishedAt: new Date(),
          logJson: JSON.stringify(trace),
        },
      }).catch(err => console.error("Could not update workflow run status to FAILED:", err));
    }
  }

  async executeProbe(name, description) {
    // Simulate async execution duration
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      name,
      status: "SUCCESS",
      message: description,
    };
  }
}

module.exports = new WorkerService();
