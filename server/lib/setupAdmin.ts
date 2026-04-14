/**
 * Admin credential bootstrapping.
 *
 * Priority order:
 *   1. ADMIN_USERNAME / ADMIN_PASSWORD_HASH env vars (override username/hash)
 *      combined with ADMIN_JWT_SECRET env var (required in production)
 *   2. data/admin.json (auto-generated on first run, persisted across restarts)
 *      NOTE: jwtSecret is NEVER stored in admin.json.
 *   3. Generates new credentials on first launch and saves username+hash to data/admin.json.
 *
 * ADMIN_JWT_SECRET must be set as an environment secret in production.
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
const ADMIN_JWT_SECRET_FILE_NAME = "admin.jwt-secret";

function getAdminFilePath(): string {
  return path.join(getDataDir(), ADMIN_FILE_NAME);
}

function getAdminJwtSecretFilePath(): string {
  return path.join(getDataDir(), ADMIN_JWT_SECRET_FILE_NAME);
}

function generateJwtSecret(): string {
  return crypto.randomBytes(48).toString("hex");
}

function readPersistedDevJwtSecret(): string | null {
  const p = getAdminJwtSecretFilePath();
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8").trim();
    return raw.length >= 64 ? raw : null;
  } catch {
    return null;
  }
}

function writePersistedDevJwtSecret(secret: string): void {
  const p = getAdminJwtSecretFilePath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, secret, { mode: 0o600 });
}

function getJwtSecret(): string {
  const fromEnv = process.env.ADMIN_JWT_SECRET;
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Admin] ADMIN_JWT_SECRET environment variable is required in production. " +
      "Add it as a Replit secret before starting the server."
    );
  }

  const existing = readPersistedDevJwtSecret();
  if (existing) return existing;

  const generated = generateJwtSecret();
  writePersistedDevJwtSecret(generated);
  console.warn(
    "[Admin] ADMIN_JWT_SECRET not set — generated a development-only JWT secret in data/admin.jwt-secret. " +
    "Set ADMIN_JWT_SECRET as a secret before production use."
  );
  return generated;
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
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2), { mode: 0o600 });
}

let _cachedCreds: AdminCredentials | null = null;

export async function setupAdminCredentials(): Promise<AdminCredentials> {
  if (_cachedCreds) return _cachedCreds;

  const jwtSecret = getJwtSecret();

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
