require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "supabase_fallback_jwt_secret_4082",
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || "claude_mock_api_key_4082",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "openai_mock_api_key_4082",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "resend_mock_api_key_4082",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OLLAMA_HOST: process.env.OLLAMA_HOST || "http://localhost:11434",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};
