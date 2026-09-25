/**
 * GitHub & CI/CD Pipeline Routes
 * Handles repository fetching, workflow runs, log inspection, webhooks,
 * and direct 'nexus' branch creation.
 */

const express = require('express');
const router = express.Router();
const githubService = require('../services/github.service');
const logParser = require('../services/logParser.service');

// Memory store for incident logs & deployment guard status
const deploymentGuardStore = {
  // 'user/nexus-demo-app': { isBlocked: true, reason: 'Log mismatch in build run #8921' }
  'user/nexus-demo-app': { isBlocked: true, reason: 'Module build error in payment module', lastRunId: 8921 }
};

const sampleRawErrorLog = `2026-09-11T09:42:10Z [INFO] Initializing CI/CD build runner v2.4.1
2026-09-11T09:42:11Z [INFO] Checking out repository ref: refs/heads/main (commit #7f3a9b2)
2026-09-11T09:42:13Z [INFO] Running 'npm install' in project directory...
2026-09-11T09:42:18Z [INFO] Dependencies installed successfully (248 packages)
2026-09-11T09:42:19Z [INFO] Executing build command: 'npm run build'
2026-09-11T09:42:21Z [INFO] Compiling modules...
2026-09-11T09:42:22Z [INFO] Compiling src/app.js ... OK
2026-09-11T09:42:23Z [INFO] Compiling src/modules/auth.js ... OK
2026-09-11T09:42:24Z [ERROR] Failed to compile src/modules/payment/stripe.js:42:18
2026-09-11T09:42:24Z [ERROR] TypeError: Cannot read property 'create' of undefined
    at processPayment (src/modules/payment/stripe.js:42:18)
    at Object.execute (src/routes/checkout.js:15:9)
    at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
2026-09-11T09:42:25Z [ERR!] Module build failed. New module cannot be implemented.
2026-09-11T09:42:25Z [FATAL] Live web deployment BLOCKED by Nexus AI Guard.`;

const sampleBaselineCleanLog = `2026-09-10T14:10:00Z [INFO] Initializing CI/CD build runner v2.4.1
2026-09-10T14:10:01Z [INFO] Checking out repository ref: refs/heads/main (commit #3c1d8e9)
2026-09-10T14:10:05Z [INFO] Running 'npm install' ... OK
2026-09-10T14:10:09Z [INFO] Executing build command: 'npm run build' ... OK
2026-09-10T14:10:12Z [INFO] All modules compiled successfully with 0 errors.
2026-09-10T14:10:15Z [INFO] Deployment completed to production live web.`;

/**
 * GET /api/github/repos
 * Get list of monitored repositories and their deployment status
 */
router.get('/repos', async (req, res) => {
  try {
    const repos = await githubService.getRepositories(req.headers['x-github-token']);
    const augmented = repos.map(repo => {
      const guard = deploymentGuardStore[repo.fullName] || { isBlocked: false };
      return {
        ...repo,
        isBlocked: guard.isBlocked,
        blockReason: guard.reason || null,
        lastRunId: guard.lastRunId || 8921
      };
    });
    return res.json({ success: true, repositories: augmented });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/repos/:owner/:repo/contents
 * Fetch files and folders for a specific repo and path
 */
router.get('/repos/:owner/:repo/contents', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const folderPath = req.query.path || '';
    const files = await githubService.getRepositoryFiles(owner, repo, folderPath, req.headers['x-github-token']);
    return res.json({ success: true, files });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/repos/:owner/:repo/raw
 * Fetch raw file content
 */
router.get('/repos/:owner/:repo/raw', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const filePath = req.query.path || '';
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Path parameter required' });
    }
    const content = await githubService.getFileContent(owner, repo, filePath, req.headers['x-github-token']);
    return res.json({ success: true, content });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/repos/:owner/:repo/commits
 * Fetch commit history for a repo
 */
router.get('/repos/:owner/:repo/commits', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const commits = await githubService.getRepositoryCommits(owner, repo, req.headers['x-github-token']);
    return res.json({ success: true, commits });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/repos/:owner/:repo/runs
 * Fetch workflow runs for a specific repo
 */
router.get('/repos/:owner/:repo/runs', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const runs = await githubService.getWorkflowRuns(owner, repo, req.headers['x-github-token']);
    return res.json({ success: true, runs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/runs/:runId/logs
 * Retrieve raw ANSI build log, baseline comparison, and parsed error details
 */
router.get('/runs/:runId/logs', async (req, res) => {
  const { runId } = req.params;

  const rawCurrentLog = sampleRawErrorLog;
  const rawBaselineLog = sampleBaselineCleanLog;

  const parsed = logParser.parseLogErrors(rawCurrentLog);
  const comparison = logParser.compareLogBaseline(rawCurrentLog, rawBaselineLog);

  return res.json({
    success: true,
    runId,
    rawCurrentLog,
    rawBaselineLog,
    parsedError: parsed,
    comparison,
    isBlocked: comparison.hasErrors,
    blockReason: comparison.diffSummary
  });
});

/**
 * POST /api/github/push-nexus-branch
 * Create/update 'nexus' branch on GitHub repo and push rectified file
 */
router.post('/push-nexus-branch', async (req, res) => {
  try {
    const { owner, repo, branchName, filePath, fileContent, commitMessage } = req.body;

    if (!owner || !repo || !filePath || !fileContent) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: owner, repo, filePath, fileContent' });
    }

    const token = req.headers['x-github-token'];
    const result = await githubService.createNexusBranchAndCommit({
      owner,
      repo,
      branchName: branchName || 'nexus',
      filePath,
      fileContent,
      commitMessage,
      token
    });

    // Reset deployment block status for this repo upon successful push
    if (deploymentGuardStore[`${owner}/${repo}`]) {
      deploymentGuardStore[`${owner}/${repo}`].isBlocked = false;
      deploymentGuardStore[`${owner}/${repo}`].reason = `Rectified code pushed to ${branchName || 'nexus'} branch`;
    }

    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/webhooks/github
 * Webhook receiver for GitHub push / workflow_run events
 */
router.post('/webhook', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  if (event === 'workflow_run') {
    const action = payload.action;
    const conclusion = payload.workflow_run?.conclusion;
    const repoFullName = payload.repository?.full_name;

    if (conclusion === 'failure') {
      deploymentGuardStore[repoFullName] = {
        isBlocked: true,
        reason: `CI/CD workflow run '${payload.workflow_run.name}' failed. Live web deployment update halted.`,
        lastRunId: payload.workflow_run.id
      };
    }
  }

  return res.json({ success: true, message: 'Webhook event processed by Nexus AI' });
});

module.exports = router;
