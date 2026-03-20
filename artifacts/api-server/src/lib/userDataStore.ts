import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

const SENSITIVE_FIELDS = new Set([
  "taxId",
  "idNumber",
  "dateOfBirth",
  "password",
  "passwordHash",
  "foreignIdType",
]);

function getEncryptionKey(): Buffer {
  const passphrase = process.env["USER_DATA_KEY"] ?? "guardian-trading-dev-fallback-key-v1";
  if (!process.env["USER_DATA_KEY"]) {
    console.warn("[UserDataStore] USER_DATA_KEY not set — using development fallback key");
  }
  return crypto.scryptSync(passphrase, "guardian-salt-v1", 32);
}

function encryptValue(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function encryptSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key) && typeof value === "string" && value.length > 0) {
      result[key] = encryptValue(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

function readAllUsers(): Record<string, Record<string, unknown>> {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Record<string, unknown>>;
  } catch {
    console.error("[UserDataStore] Failed to parse users.json — starting fresh");
    return {};
  }
}

function writeAllUsers(users: Record<string, Record<string, unknown>>): void {
  ensureDataDir();
  const content = JSON.stringify(users, null, 2);
  fs.writeFileSync(DATA_FILE, content, { encoding: "utf8", mode: 0o600, flag: "w" });
  try {
    fs.chmodSync(DATA_FILE, 0o600);
  } catch {
  }
}

export function upsertUserStep(
  email: string,
  step: string,
  data: Record<string, unknown>
): void {
  const users = readAllUsers();
  const now = new Date().toISOString();

  if (!users[email]) {
    users[email] = { email, createdAt: now, updatedAt: now };
  }

  users[email][step] = encryptSensitive(data);
  users[email]["updatedAt"] = now;

  writeAllUsers(users);
  console.log(`[UserDataStore] Saved step "${step}" for ${email}`);
}

export function getUserData(email: string): Record<string, unknown> | null {
  const users = readAllUsers();
  return users[email] ?? null;
}
