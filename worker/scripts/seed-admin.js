#!/usr/bin/env node

/**
 * Seed an admin account into ICCA KV.
 *
 * Usage:
 *   ADMIN_USER=admin ADMIN_PASS=yourpass node scripts/seed-admin.js
 *
 * This script uses the Wrangler CLI to write to KV.
 * Make sure you have wrangler configured and authenticated.
 */

import { execSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const username = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASS;

if (!username || !password) {
  console.error("Usage: ADMIN_USER=admin ADMIN_PASS=yourpass node scripts/seed-admin.js");
  process.exit(1);
}

// Hash password using same algorithm as the Worker (PBKDF2 SHA-256, 100k iterations)
const salt = randomBytes(16).toString("hex");
const hash = pbkdf2Sync(password, salt, 100_000, 32, "sha256").toString("hex");
const passwordHash = `${salt}:${hash}`;

const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString();

const record = {
  username,
  name: "Admin",
  passwordHash,
  role: "admin",
  status: "running",
  expiresAt,
  containerId: null,
  telegramId: null,
  telegramUsername: null,
  creds: {
    host: "N/A",
    sshPort: 0,
    sshUser: username,
    sshPass: "N/A",
  },
  warned24h: false,
  warned1h: false,
  notifiedExpired: false,
  revoked: false,
  createdAt: new Date().toISOString(),
};

const kvKey = `student:${username}`;
const kvValue = JSON.stringify(record);

// Write to KV via wrangler
try {
  execSync(
    `npx wrangler kv:key put --binding=ICCA_KV "${kvKey}" '${kvValue.replace(/'/g, "'\\''")}'`,
    { stdio: "inherit", cwd: new URL("..", import.meta.url).pathname }
  );
  console.log(`\n✅ Admin account "${username}" seeded successfully.`);
  console.log(`   Password hash: ${passwordHash.substring(0, 20)}...`);
} catch (e) {
  console.error("Failed to seed admin account:", e.message);
  process.exit(1);
}
