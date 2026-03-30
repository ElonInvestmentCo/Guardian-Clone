/**
 * Admin credential bootstrapping.
 *
 * Priority order:
 *   1. ADMIN_USERNAME / ADMIN_PASSWORD_HASH / ADMIN_JWT_SECRET env vars (production secrets)
 *   2. data/admin.json (auto-generated on first run, persisted across restarts)
 *   3. Generates new credentials on first launch and saves them to data/admin.json
 *
 * The auto-generated password is printed to the server console on first run ONLY.
 * In production, always set the three env vars and delete data/admin.json.
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

function readAdminFile(): AdminCredentials | null {
  const p = getAdminFilePath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw) as AdminCredentials;
    if (parsed.username && parsed.passwordHash && parsed.jwtSecret) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeAdminFile(creds: AdminCredentials): void {
  const p = getAdminFilePath();
  fs.writeFileSync(p, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

let _cachedCreds: AdminCredentials | null = null;

export async function setupAdminCredentials(): Promise<AdminCredentials> {
  if (_cachedCreds) return _cachedCreds;

  const envUsername = process.env.ADMIN_USERNAME;
  const envHash     = process.env.ADMIN_PASSWORD_HASH;
  const envSecret   = process.env.ADMIN_JWT_SECRET;

  if (envUsername && envHash && envSecret) {
    console.log("[Admin] Credentials loaded from environment variables.");
    _cachedCreds = { username: envUsername, passwordHash: envHash, jwtSecret: envSecret };
    return _cachedCreds;
  }

  const fromFile = readAdminFile();
  if (fromFile) {
    console.log("[Admin] Credentials loaded from data/admin.json.");
    _cachedCreds = fromFile;
    return _cachedCreds;
  }

  console.log("[Admin] No credentials found — generating new admin account...");
  const username = "guardian_admin";
  const password = generatePassword();
  const passwordHash = await generatePasswordHash(password);
  const jwtSecret = generateJwtSecret();

  const creds: AdminCredentials = { username, passwordHash, jwtSecret };
  writeAdminFile(creds);

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║           GUARDIAN ADMIN — AUTO-GENERATED LOGIN          ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Username : ${username.padEnd(46)}║`);
  console.log(`║  Password : ${password.padEnd(46)}║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Saved to : data/admin.json (persisted across restarts)  ║");
  console.log("║  For production: set ADMIN_USERNAME, ADMIN_PASSWORD_HASH,║");
  console.log("║  and ADMIN_JWT_SECRET as environment secrets.            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  _cachedCreds = creds;
  return _cachedCreds;
}

export function getAdminCredentials(): AdminCredentials {
  if (!_cachedCreds) {
    throw new Error("[Admin] setupAdminCredentials() must be called before getAdminCredentials()");
  }
  return _cachedCreds;
}
