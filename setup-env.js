#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get ngrok URL from command line argument or prompt
const ngrokUrl = process.argv[2];

if (!ngrokUrl) {
  console.log("Usage: node setup-env.js <ngrok-url>");
  console.log("Example: node setup-env.js https://abc123.ngrok-free.app");
  process.exit(1);
}

// Validate ngrok URL format
if (!ngrokUrl.includes("ngrok") || !ngrokUrl.startsWith("https://")) {
  console.error(
    "Error: Please provide a valid ngrok URL (e.g., https://abc123.ngrok-free.app)"
  );
  process.exit(1);
}

// Create .env.local file content
const envContent = `# Environment Configuration for Local Development
# This file is for local development only and should not be committed to version control

# Ngrok URL for Shopify Database Sync API
VITE_NGROK_URL=${ngrokUrl}

# API Base URL (will be constructed from NGROK_URL)
VITE_API_BASE_URL=${ngrokUrl}/api

# Development mode
VITE_DEV_MODE=true
`;

// Write .env.local file
const envPath = path.join(__dirname, ".env.local");
fs.writeFileSync(envPath, envContent);

console.log("✅ Environment file created successfully!");
console.log(`📁 File location: ${envPath}`);
console.log(`🔗 Ngrok URL: ${ngrokUrl}`);
console.log(`🌐 API Base URL: ${ngrokUrl}/api`);
console.log("");
console.log("🚀 You can now start the development server with: npm run dev");
console.log("");
console.log("📝 To update the ngrok URL later, run:");
console.log(`   node setup-env.js <new-ngrok-url>`);
