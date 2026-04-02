/**
 * Admin credential bootstrapping.
 *
 * Priority order:
 *   1. ADMIN_USERNAME / ADMIN_PASSWORD_HASH env vars (override username/hash)
 *      combined with ADMIN_JWT_SECRET env var (always required for the JWT secret)
 *   2. data/admin.json (auto-generated on first run, persisted across restarts)
 *      NOTE: jwtSecret is NEVER stored in admin.json — it must always be supplied
 *      via the ADMIN_JWT_SECRET environment variable / secret.
 *   3. Generates new credentials on first launch and saves username+hash to data/admin.json.
 *
 * ADMIN_JWT_SECRET must always be set as an environment secret.
 * The auto-generated password is printed to the server console on first run ONLY.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDataDir } from "./userDataStore.js";

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  jwtSecret: string;
}

interface AdminFileData {
  username: string;
  passwordHash: string;
}

const ADMIN_FILE_NAME = "admin.json";

function getAdminFilePath(): string {
  return path.join(getDataDir(), ADMIN_FILE_NAME);
}

function generateJwtSecret(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from(crypto.randomBytes(14))
    .map((b) => chars[b % chars.length])
    .join("");
}

function readAdminFile(): AdminFileData | null {
  const p = getAdminFilePath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw) as AdminFileData;
    if (parsed.username && parsed.passwordHash) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeAdminFile(data: AdminFileData): void {
  const p = getAdminFilePath();
  fs.writeFileSync(p, JSON.stringify(data, null, 2), { mode: 0o600 });
}

let _cachedCreds: AdminCredentials | null = null;

export async function setupAdminCredentials(): Promise<AdminCredentials> {
  if (_cachedCreds) return _cachedCreds;

  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "[Admin] ADMIN_JWT_SECRET environment variable is required but not set. " +
      "Add it as a Replit secret before starting the server."
    );
  }

  const envUsername = process.env.ADMIN_USERNAME;
  const envHash     = process.env.ADMIN_PASSWORD_HASH;

  if (envUsername && envHash) {
    console.log("[Admin] Credentials loaded from environment variables.");
    _cachedCreds = { username: envUsername, passwordHash: envHash, jwtSecret };
    return _cachedCreds;
  }

  const fromFile = readAdminFile();
  if (fromFile) {
    console.log("[Admin] Credentials loaded from data/admin.json.");
    _cachedCreds = { ...fromFile, jwtSecret };
    return _cachedCreds;
  }

  console.log("[Admin] No credentials found — generating new admin account...");
  const username = "guardian_admin";
  const password = generatePassword();
  const passwordHash = await generatePasswordHash(password);

  const fileData: AdminFileData = { username, passwordHash };
  writeAdminFile(fileData);

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║           GUARDIAN ADMIN — AUTO-GENERATED LOGIN          ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Username : ${username.padEnd(46)}║`);
  console.log(`║  Password : ${password.padEnd(46)}║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Saved to : data/admin.json (username + password hash)   ║");
  console.log("║  JWT secret is read from ADMIN_JWT_SECRET env secret.    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  _cachedCreds = { username, passwordHash, jwtSecret };
  return _cachedCreds;
}

export function getAdminCredentials(): AdminCredentials {
  if (!_cachedCreds) {
    throw new Error("[Admin] setupAdminCredentials() must be called before getAdminCredentials()");
  }
  return _cachedCreds;
}
