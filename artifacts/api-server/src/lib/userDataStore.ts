import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve(process.cwd(), "data");
const MASTER_FILE = path.join(DATA_DIR, "users.json");
const USERS_DIR = path.join(DATA_DIR, "users");

const SENSITIVE_FIELDS = new Set([
  "taxId",
  "idNumber",
  "dateOfBirth",
  "password",
  "passwordHash",
  "foreignIdType",
  "accountNumber",
  "abaSwift",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Convert an email address into a safe directory/file name component.
 * e.g. "john.doe@example.com" → "john.doe_at_example.com"
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().replace(/@/g, "_at_").replace(/[^a-z0-9._-]/g, "_");
}

/** Path to the per-user profile directory */
export function getUserDir(email: string): string {
  return path.join(USERS_DIR, sanitizeEmail(email));
}

/** Path to the per-user documents directory */
export function getUserDocDir(email: string): string {
  return path.join(getUserDir(email), "documents");
}

/** Path to the per-user profile JSON file */
export function getUserProfilePath(email: string): string {
  return path.join(getUserDir(email), "profile.json");
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

// ── Retry-capable file writer ─────────────────────────────────────────────────

function writeWithRetry(filePath: string, content: string, retries = 3): void {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.writeFileSync(filePath, content, { encoding: "utf8", mode: 0o600, flag: "w" });
      try { fs.chmodSync(filePath, 0o600); } catch { /* ignore */ }
      return;
    } catch (err) {
      console.error(`[UserDataStore] Write failed (attempt ${attempt}/${retries}):`, err);
      if (attempt === retries) throw err;
    }
  }
}

// ── Master users.json (all users in one file) ──────────────────────────────────

function readMaster(): Record<string, Record<string, unknown>> {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(MASTER_FILE)) return {};
  try {
    const raw = fs.readFileSync(MASTER_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Record<string, unknown>>;
  } catch {
    console.error("[UserDataStore] Failed to parse users.json — starting fresh");
    return {};
  }
}

function writeMaster(users: Record<string, Record<string, unknown>>): void {
  ensureDir(DATA_DIR);
  writeWithRetry(MASTER_FILE, JSON.stringify(users, null, 2));
}

// ── Per-user profile.json ──────────────────────────────────────────────────────

function readProfile(email: string): Record<string, unknown> {
  const p = getUserProfilePath(email);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, unknown>;
  } catch {
    console.error(`[UserDataStore] Failed to parse profile for ${email}`);
    return {};
  }
}

function writeProfile(email: string, data: Record<string, unknown>): void {
  ensureDir(getUserDir(email));
  ensureDir(getUserDocDir(email));
  writeWithRetry(getUserProfilePath(email), JSON.stringify(data, null, 2));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Save a single onboarding step for a user.
 * Writes to both the shared users.json and the per-user profile.json.
 */
export function upsertUserStep(
  email: string,
  step: string,
  data: Record<string, unknown>
): void {
  const now = new Date().toISOString();
  const sanitized = encryptSensitive(data);

  // ── 1. Master file ──
  const master = readMaster();
  if (!master[email]) {
    master[email] = { email, createdAt: now, updatedAt: now };
  }
  master[email][step] = sanitized;
  master[email]["updatedAt"] = now;
  writeMaster(master);

  // ── 2. Per-user profile ──
  const profile = readProfile(email);
  if (!profile["email"]) {
    profile["email"] = email;
    profile["createdAt"] = now;
  }
  profile[step] = sanitized;
  profile["updatedAt"] = now;
  writeProfile(email, profile);

  console.log(`[UserDataStore] Saved step "${step}" for ${email}`);
}

/**
 * Add a document reference to the user's profile after a file upload.
 * Updates both the master file and the per-user profile.
 */
export function addDocumentRef(
  email: string,
  role: string,
  filePath: string
): void {
  const now = new Date().toISOString();

  const updateRecord = (record: Record<string, unknown>) => {
    const docs = (record["documents"] as Record<string, unknown>) ?? {};
    docs[role] = filePath;
    record["documents"] = docs;
    record["updatedAt"] = now;
    return record;
  };

  // Master
  const master = readMaster();
  if (!master[email]) master[email] = { email, createdAt: now };
  master[email] = updateRecord(master[email]);
  writeMaster(master);

  // Per-user
  const profile = readProfile(email);
  if (!profile["email"]) { profile["email"] = email; profile["createdAt"] = now; }
  writeProfile(email, updateRecord(profile));

  console.log(`[UserDataStore] Document ref saved: ${role} → ${filePath} (${email})`);
}

export function getUserData(email: string): Record<string, unknown> | null {
  const master = readMaster();
  return master[email] ?? null;
}
