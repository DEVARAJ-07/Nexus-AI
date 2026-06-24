const prisma = require("../config/db");
const workerService = require("./worker.service");

class QueueService {
  constructor() {
    this.jobsQueue = [];
  }

  async dispatchJob(workflowId, triggerPayload = {}) {
    try {
      // Create execution log entry in database
      const run = await prisma.workflowRun.create({
        data: {
          workflowId,
          status: "RUNNING",
          logJson: JSON.stringify(["Job queued in background task manager"]),
        },
      });

      // Schedule background execution
      setTimeout(async () => {
        try {
          await workerService.executeWorkflowRun(run.id, workflowId, triggerPayload);
        } catch (err) {
          console.error(`Background worker execution failed for run: ${run.id}`, err);
        }
      }, 500);

      return run;
    } catch (error) {
      console.error("Queue dispatch error:", error);
      throw error;
    }
  }
}

module.exports = new QueueService();
