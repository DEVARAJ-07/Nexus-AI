/**
 * Settings & Credentials Management Routes
 * Configures GitHub PAT, AI API Keys (DeepSeek, OpenRouter, Groq, Gemini),
 * and live web deployment gatekeeper rules.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

function maskKey(key) {
  if (!key) return '';
  return '••••••••' + key.slice(-4);
}

let settingsStore = {
  githubToken: maskKey(process.env.GITHUB_TOKEN),
  deepseekApiKey: maskKey(process.env.DEEPSEEK_API_KEY),
  openrouterApiKey: maskKey(process.env.OPENROUTER_API_KEY),
  groqApiKey: maskKey(process.env.GROQ_API_KEY),
  geminiApiKey: maskKey(process.env.GEMINI_API_KEY),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-coder',
  autoBlockDeploymentOnFailure: true,
  defaultBranchTarget: 'nexus',
  webhookSecret: 'nexus_sec_' + Math.random().toString(36).substring(2, 10)
};

/**
 * GET /api/settings
 */
router.get('/', (req, res) => {
  return res.json({ success: true, settings: settingsStore });
});

/**
 * POST /api/settings
 */
router.post('/', (req, res) => {
  const {
    githubToken,
    deepseekApiKey,
    openrouterApiKey,
    groqApiKey,
    geminiApiKey,
    deepseekModel,
    autoBlockDeploymentOnFailure,
    defaultBranchTarget
  } = req.body;

  if (githubToken && !githubToken.includes('••••')) {
    process.env.GITHUB_TOKEN = githubToken;
    settingsStore.githubToken = maskKey(githubToken);
  }

  if (deepseekApiKey && !deepseekApiKey.includes('••••')) {
    process.env.DEEPSEEK_API_KEY = deepseekApiKey;
    settingsStore.deepseekApiKey = maskKey(deepseekApiKey);
  }

  if (openrouterApiKey && !openrouterApiKey.includes('••••')) {
    process.env.OPENROUTER_API_KEY = openrouterApiKey;
    settingsStore.openrouterApiKey = maskKey(openrouterApiKey);
  }

  if (groqApiKey && !groqApiKey.includes('••••')) {
    process.env.GROQ_API_KEY = groqApiKey;
    settingsStore.groqApiKey = maskKey(groqApiKey);
  }

  if (geminiApiKey && !geminiApiKey.includes('••••')) {
    process.env.GEMINI_API_KEY = geminiApiKey;
    settingsStore.geminiApiKey = maskKey(geminiApiKey);
  }

  if (deepseekModel) settingsStore.deepseekModel = deepseekModel;
  if (typeof autoBlockDeploymentOnFailure === 'boolean') settingsStore.autoBlockDeploymentOnFailure = autoBlockDeploymentOnFailure;
  if (defaultBranchTarget) settingsStore.defaultBranchTarget = defaultBranchTarget;

  return res.json({ success: true, message: 'Settings saved successfully', settings: settingsStore });
});

/**
 * POST /api/settings/test-github
 */
router.post('/test-github', async (req, res) => {
  const token = req.body.token || process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(400).json({ success: false, error: 'No GitHub token provided' });
  }

  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Nexus-AI-Agent'
      }
    });
    return res.json({
      success: true,
      user: response.data.login,
      message: `Successfully connected to GitHub as @${response.data.login}`
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.response?.data?.message || err.message
    });
  }
});

/**
 * POST /api/settings/test-deepseek
 */
router.post('/test-deepseek', async (req, res) => {
  const apiKey = req.body.apiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'No DeepSeek or OpenRouter API key provided' });
  }

  try {
    const endpoint = process.env.DEEPSEEK_API_KEY
      ? 'https://api.deepseek.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const response = await axios.post(
      endpoint,
      {
        model: process.env.DEEPSEEK_API_KEY ? 'deepseek-coder' : 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: 'Ping test' }],
        max_tokens: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return res.json({
      success: true,
      message: 'Successfully authenticated with AI Provider'
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.response?.data?.error?.message || err.message
    });
  }
});

module.exports = router;