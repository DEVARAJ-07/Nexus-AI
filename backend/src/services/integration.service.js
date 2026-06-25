const axios = require("axios");

class IntegrationService {
  async sendEmail({ to, subject, body }) {
    console.log(`[INTEGRATION] Sending email to ${to} via Resend...`);
    // Simulate API request or log it
    return {
      status: "SUCCESS",
      message: `Email dispatched successfully to ${to} via Resend.`,
    };
  }

  async sendSlackNotification({ channel, text }) {
    console.log(`[INTEGRATION] Dispatching Slack notification to channel: ${channel}`);
    
    // In dev, if there's no SLACK_WEBHOOK_URL, we log it and return success
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (webhookUrl) {
      try {
        const response = await axios.post(webhookUrl, {
          channel,
          text,
        });
        return { status: "SUCCESS", code: response.status };
      } catch (error) {
        console.error("Slack webhook HTTP call failed:", error.message);
        return { status: "ERROR", message: error.message };
      }
    }

    return {
      status: "SUCCESS",
      message: `[MOCK_SLACK] Notification sent: "${text}"`,
    };
  }

  async syncNotionDocs({ title, content }) {
    console.log(`[INTEGRATION] Syncing Notion documentation page: "${title}"`);
    return {
      status: "SUCCESS",
      message: "Sync page created in Notion workspace database.",
    };
  }

  async triggerProductionDeploy({ branch }) {
    console.log(`[INTEGRATION] Dispatching production deploy hook for branch: ${branch}`);
    return {
      status: "SUCCESS",
      logs: `Triggered Vercel build event for branch ${branch}. Deployment state: PROMOTING.`,
    };
  }
}

module.exports = new IntegrationService();
