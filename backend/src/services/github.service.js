/**
 * GitHub API Service
 * Interacts with GitHub REST API to fetch workflow runs, repositories, files,
 * commit trees, and handles direct 'nexus' branch creation.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GITHUB_API_BASE = 'https://api.github.com';

function getHeaders(token) {
  const authToken = token || process.env.GITHUB_TOKEN || '';
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Nexus-AI-CICD-Agent'
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

const DEFAULT_REPOSITORIES = [
  {
    id: 101,
    name: 'Nexus-AI',
    fullName: 'DEVARAJ-07/Nexus-AI',
    owner: 'DEVARAJ-07',
    defaultBranch: 'main',
    private: false,
    description: 'All-in-one build log intelligence, release studio, pipeline kanban, test analytics, and automation triggers.',
    language: 'JavaScript',
    stargazers_count: 5,
    forks_count: 2,
    url: 'https://github.com/DEVARAJ-07/Nexus-AI',
    updatedAt: new Date().toISOString()
  },
  {
    id: 102,
    name: 'LeetCode-Solutions',
    fullName: 'DEVARAJ-07/LeetCode-Solutions',
    owner: 'DEVARAJ-07',
    defaultBranch: 'main',
    private: false,
    description: 'Data Structures & Algorithms problem solutions in Java and Python (including 0001-two-sum).',
    language: 'Java',
    stargazers_count: 3,
    forks_count: 1,
    url: 'https://github.com/DEVARAJ-07/LeetCode-Solutions',
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 103,
    name: 'SmartEco',
    fullName: 'DEVARAJ-07/SmartEco',
    owner: 'DEVARAJ-07',
    defaultBranch: 'main',
    private: false,
    description: 'Smart environmental monitoring and IoT energy management system.',
    language: 'JavaScript',
    stargazers_count: 2,
    forks_count: 0,
    url: 'https://github.com/DEVARAJ-07/SmartEco',
    updatedAt: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: 104,
    name: 'DevOps-Automation-Engine',
    fullName: 'DEVARAJ-07/DevOps-Automation-Engine',
    owner: 'DEVARAJ-07',
    defaultBranch: 'main',
    private: false,
    description: 'Automated CI/CD pipeline triggers and deployment webhook handlers.',
    language: 'TypeScript',
    stargazers_count: 4,
    forks_count: 1,
    url: 'https://github.com/DEVARAJ-07/DevOps-Automation-Engine',
    updatedAt: new Date(Date.now() - 518400000).toISOString()
  },
  {
    id: 105,
    name: 'Fullstack-Portfolio',
    fullName: 'DEVARAJ-07/Fullstack-Portfolio',
    owner: 'DEVARAJ-07',
    defaultBranch: 'main',
    private: false,
    description: 'Modern developer portfolio and interactive showcase built with Next.js & Tailwind CSS.',
    language: 'TypeScript',
    stargazers_count: 7,
    forks_count: 3,
    url: 'https://github.com/DEVARAJ-07/Fullstack-Portfolio',
    updatedAt: new Date(Date.now() - 691200000).toISOString()
  }
];

/**
 * Fetch connected GitHub repositories
 */
async function getRepositories(token, username = 'DEVARAJ-07') {
  if (token || process.env.GITHUB_TOKEN) {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=100`, {
        headers: getHeaders(token),
        timeout: 4000
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data
          .filter(r => r.name !== 'renishandrick/SmartEco' && r.full_name !== 'renishandrick/SmartEco')
          .map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            owner: repo.owner.login,
            defaultBranch: repo.default_branch || 'main',
            private: repo.private,
            description: repo.description || 'Personal project repository',
            language: repo.language || 'JavaScript',
            stargazers_count: repo.stargazers_count || 0,
            forks_count: repo.forks_count || 0,
            url: repo.html_url,
            updatedAt: repo.updated_at
          }));
      }
    } catch (err) {
      console.warn('GitHub API fetch user repos failed, using fallback repositories:', err.message);
    }
  }

  return DEFAULT_REPOSITORIES;
}

/**
 * Fetch files/folders for a repository path
 */
async function getRepositoryFiles(owner, repo, folderPath = '', token) {
  if (token || process.env.GITHUB_TOKEN) {
    try {
      const cleanPath = folderPath.replace(/^\/+/, '');
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${cleanPath}`, {
        headers: getHeaders(token),
        timeout: 4000
      });
      return response.data;
    } catch (err) {
      console.warn(`GitHub API contents failed for ${owner}/${repo}/${folderPath}:`, err.message);
    }
  }

  // Fallback repo files
  if (repo === 'LeetCode-Solutions' || repo.toLowerCase().includes('leetcode')) {
    if (!folderPath) {
      return [
        { name: '0001-two-sum', path: '0001-two-sum', type: 'dir', sha: 'dir_twosum_1' },
        { name: '0002-add-two-numbers', path: '0002-add-two-numbers', type: 'dir', sha: 'dir_twonum_2' },
        { name: '0020-valid-parentheses', path: '0020-valid-parentheses', type: 'dir', sha: 'dir_parens_3' },
        { name: 'README.md', path: 'README.md', type: 'file', sha: 'file_lc_readme', size: 1042 }
      ];
    }
    if (folderPath.includes('0001-two-sum')) {
      return [
        { name: '0001-two-sum.java', path: '0001-two-sum/0001-two-sum.java', type: 'file', sha: 'file_twosum_java', size: 512 }
      ];
    }
    if (folderPath.includes('0002-add-two-numbers')) {
      return [
        { name: '0002-add-two-numbers.java', path: '0002-add-two-numbers/0002-add-two-numbers.java', type: 'file', sha: 'file_twonum_java', size: 680 }
      ];
    }
  }

  if (repo === 'Nexus-AI') {
    if (!folderPath) {
      return [
        { name: 'backend', path: 'backend', type: 'dir', sha: 'dir_backend' },
        { name: 'frontend', path: 'frontend', type: 'dir', sha: 'dir_frontend' },
        { name: 'package.json', path: 'package.json', type: 'file', sha: 'file_pkg', size: 620 },
        { name: 'README.md', path: 'README.md', type: 'file', sha: 'file_readme', size: 1420 },
        { name: 'nexus.js', path: 'nexus.js', type: 'file', sha: 'file_nexus', size: 890 }
      ];
    }
    if (folderPath === 'frontend') {
      return [
        { name: 'src', path: 'frontend/src', type: 'dir', sha: 'dir_fe_src' },
        { name: 'public', path: 'frontend/public', type: 'dir', sha: 'dir_fe_pub' },
        { name: 'package.json', path: 'frontend/package.json', type: 'file', sha: 'file_fe_pkg', size: 850 }
      ];
    }
    if (folderPath === 'frontend/src') {
      return [
        { name: 'app', path: 'frontend/src/app', type: 'dir', sha: 'dir_fe_app' }
      ];
    }
    if (folderPath === 'backend') {
      return [
        { name: 'src', path: 'backend/src', type: 'dir', sha: 'dir_be_src' },
        { name: 'package.json', path: 'backend/package.json', type: 'file', sha: 'file_be_pkg', size: 910 }
      ];
    }
  }

  if (repo === 'SmartEco') {
    if (!folderPath) {
      return [
        { name: 'src', path: 'src', type: 'dir', sha: 'dir_se_src' },
        { name: 'package.json', path: 'package.json', type: 'file', sha: 'file_se_pkg', size: 450 },
        { name: 'README.md', path: 'README.md', type: 'file', sha: 'file_se_readme', size: 980 }
      ];
    }
    if (folderPath === 'src') {
      return [
        { name: 'index.js', path: 'src/index.js', type: 'file', sha: 'file_se_idx', size: 1200 },
        { name: 'energyMonitor.js', path: 'src/energyMonitor.js', type: 'file', sha: 'file_se_em', size: 840 }
      ];
    }
  }

  // Generic fallback folder
  return [
    { name: 'src', path: `${folderPath ? folderPath + '/' : ''}src`, type: 'dir', sha: 'dir_gen_src' },
    { name: 'package.json', path: `${folderPath ? folderPath + '/' : ''}package.json`, type: 'file', sha: 'file_gen_pkg', size: 500 },
    { name: 'README.md', path: `${folderPath ? folderPath + '/' : ''}README.md`, type: 'file', sha: 'file_gen_readme', size: 600 }
  ];
}

/**
 * Fetch file content
 */
async function getFileContent(owner, repo, filePath, token) {
  if (token || process.env.GITHUB_TOKEN) {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: getHeaders(token),
        timeout: 4000
      });
      if (response.data?.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf8');
      }
    } catch (err) {
      console.warn(`GitHub API get file content failed for ${filePath}:`, err.message);
    }
  }

  // Pre-configured real file contents
  if (filePath.endsWith('0001-two-sum.java')) {
    return `// 0001-two-sum.java
import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        throw new IllegalArgumentException("No two sum solution found");
    }
}
`;
  }

  if (filePath.endsWith('0002-add-two-numbers.java')) {
    return `// 0002-add-two-numbers.java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummyHead = new ListNode(0);
        ListNode curr = dummyHead;
        int carry = 0;
        while (l1 != null || l2 != null || carry != 0) {
            int x = (l1 != null) ? l1.val : 0;
            int y = (l2 != null) ? l2.val : 0;
            int sum = carry + x + y;
            carry = sum / 10;
            curr.next = new ListNode(sum % 10);
            curr = curr.next;
            if (l1 != null) l1 = l1.next;
            if (l2 != null) l2 = l2.next;
        }
        return dummyHead.next;
    }
}
`;
  }

  if (filePath === 'README.md') {
    return `# ${repo}
Developed by @${owner}

A high-performance repository featuring modern automated CI/CD pipeline capabilities and production cloud architectures.

## Features
- Scalable code structure
- Continuous deployment integration
- Automated log diagnostics & bug rectifications
`;
  }

  // Check if file exists locally in repo
  const localFilePath = path.join(__dirname, '../../../', filePath);
  if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
    return fs.readFileSync(localFilePath, 'utf8');
  }

  return `// ${filePath}\n// Author: @${owner}\n// Repository: ${repo}\n\nexport default function moduleHandler() {\n  console.log("Loaded ${filePath} successfully.");\n}\n`;
}

/**
 * Fetch Repository Commits
 */
async function getRepositoryCommits(owner, repo, token) {
  if (token || process.env.GITHUB_TOKEN) {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=10`, {
        headers: getHeaders(token),
        timeout: 4000
      });
      return response.data;
    } catch (err) {
      console.warn(`GitHub API commits failed for ${owner}/${repo}:`, err.message);
    }
  }

  return [
    {
      sha: '296d45c1a8e2',
      commit: {
        message: 'feat: add GitHub repository explorer and live file browser',
        author: { name: owner, date: new Date().toISOString() }
      }
    },
    {
      sha: 'c08747bf41b0',
      commit: {
        message: 'fix: optimize dashboard layout and responsive navigation',
        author: { name: owner, date: new Date(Date.now() - 86400000).toISOString() }
      }
    },
    {
      sha: 'de48d37a912e',
      commit: {
        message: 'chore: initial project repository structure setup',
        author: { name: owner, date: new Date(Date.now() - 172800000).toISOString() }
      }
    }
  ];
}

/**
 * Fetch Workflow Runs for a repository
 */
async function getWorkflowRuns(owner, repo, token) {
  if (token || process.env.GITHUB_TOKEN) {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs?per_page=5`, {
        headers: getHeaders(token),
        timeout: 4000
      });
      return response.data.workflow_runs.map(run => ({
        id: run.id,
        name: run.name,
        headBranch: run.head_branch,
        headSha: run.head_sha.substring(0, 7),
        commitMessage: run.head_commit ? run.head_commit.message : 'Update module code',
        author: run.head_commit ? run.head_commit.author.name : 'Developer',
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        htmlUrl: run.html_url
      }));
    } catch (err) {
      console.warn(`GitHub workflow runs API failed for ${owner}/${repo}:`, err.message);
    }
  }

  return [
    {
      id: 8921,
      name: 'Build & Test Pipeline',
      headBranch: 'main',
      headSha: '7f3a9b2',
      commitMessage: 'feat: add payment processing new module',
      author: owner,
      status: 'completed',
      conclusion: 'failure',
      createdAt: new Date().toISOString(),
      htmlUrl: `https://github.com/${owner}/${repo}/actions/runs/8921`
    },
    {
      id: 8900,
      name: 'Build & Test Pipeline',
      headBranch: 'main',
      headSha: '3c1d8e9',
      commitMessage: 'chore: update release config',
      author: owner,
      status: 'completed',
      conclusion: 'success',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      htmlUrl: `https://github.com/${owner}/${repo}/actions/runs/8900`
    }
  ];
}

/**
 * Create a new branch named 'nexus' (or specified branch) and commit rectified file
 */
async function createNexusBranchAndCommit({ owner, repo, branchName = 'nexus', filePath, fileContent, commitMessage, token }) {
  const authToken = token || process.env.GITHUB_TOKEN;

  if (authToken) {
    try {
      const headers = getHeaders(authToken);
      const refRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
      const mainSha = refRes.data.object.sha;

      let branchSha = mainSha;
      try {
        const getBranchRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branchName}`, { headers });
        branchSha = getBranchRes.data.object.sha;
      } catch (e) {
        const createRefRes = await axios.post(
          `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`,
          {
            ref: `refs/heads/${branchName}`,
            sha: mainSha
          },
          { headers }
        );
        branchSha = createRefRes.data.object.sha;
      }

      let fileSha = undefined;
      try {
        const fileRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers });
        fileSha = fileRes.data.sha;
      } catch (e) {
        // File does not exist yet
      }

      const commitRes = await axios.put(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`,
        {
          message: commitMessage || `fix(nexus): rectify ${filePath} via DeepSeek AI`,
          content: Buffer.from(fileContent).toString('base64'),
          branch: branchName,
          ...(fileSha ? { sha: fileSha } : {})
        },
        { headers }
      );

      return {
        success: true,
        branch: branchName,
        commitSha: commitRes.data.commit.sha.substring(0, 7),
        commitUrl: commitRes.data.commit.html_url,
        filePath,
        message: `Successfully created branch '${branchName}' and committed ${filePath}`
      };
    } catch (err) {
      console.warn('GitHub API branch push failed, falling back to simulated push:', err.response?.data || err.message);
    }
  }

  const mockSha = Math.random().toString(36).substring(2, 9);
  return {
    success: true,
    simulated: true,
    branch: branchName,
    commitSha: mockSha,
    commitUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`,
    filePath,
    message: `[Simulated Mode] Branch '${branchName}' created and rectified file '${filePath}' committed cleanly!`
  };
}

module.exports = {
  getRepositories,
  getRepositoryFiles,
  getFileContent,
  getRepositoryCommits,
  getWorkflowRuns,
  createNexusBranchAndCommit
};
