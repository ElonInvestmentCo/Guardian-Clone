import fs from "fs";
import path from "path";
import crypto from "crypto";

function resolveDataDir(): string {
  if (process.env.USER_DATA_DIR) return path.resolve(process.env.USER_DATA_DIR);
  const cwd = process.cwd();
  const cwdData = path.join(cwd, "data");
  if (cwd.endsWith("api-server") || cwd.endsWith("api-server/") || cwd.endsWith("api-server\\")) {
    return cwdData;
  }
  const prodData = path.join(cwd, "artifacts", "api-server", "data");
  if (fs.existsSync(prodData)) return prodData;
  return cwdData;
}

const DATA_DIR = resolveDataDir();
const MASTER_FILE = path.join(DATA_DIR, "users.json");
const USERS_DIR = path.join(DATA_DIR, "users");

export function getDataDir(): string {
  return DATA_DIR;
}

console.log(`[UserDataStore] DATA_DIR resolved to: ${DATA_DIR}`);

const SENSITIVE_FIELDS = new Set([
  "taxId",
  "ssn",
  "idNumber",
  "dateOfBirth",
  "password",
  "passwordHash",
  "foreignIdType",
  "accountNumber",
  "abaSwift",
  "bankAccountNumber",
  "routingNumber",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

let _encKeyCache: Buffer | null = null;
function getEncryptionKey(): Buffer {
  if (_encKeyCache) return _encKeyCache;
  const passphrase = process.env["USER_DATA_KEY"];
  if (!passphrase) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[UserDataStore] USER_DATA_KEY is required in production");
    }
    console.warn("[UserDataStore] USER_DATA_KEY not set — using development fallback key");
  }
  const key = passphrase ?? "guardian-trading-dev-fallback-key-v1";
  const salt = crypto.createHash("sha256").update("guardian-key-derivation-salt").digest().subarray(0, 16);
  _encKeyCache = crypto.scryptSync(key, salt, 32);
  return _encKeyCache;
}

function encryptValue(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptValue(ciphertext: string): string {
  if (!ciphertext.startsWith("enc:")) return ciphertext;
  const parts = ciphertext.split(":");
  if (parts.length !== 4) return ciphertext;
  const key = getEncryptionKey();
  const iv = Buffer.from(parts[1]!, "hex");
  const authTag = Buffer.from(parts[2]!, "hex");
  const encrypted = Buffer.from(parts[3]!, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
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
  const tmpPath = filePath + ".tmp";
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      fs.writeFileSync(tmpPath, content, { encoding: "utf8", mode: 0o600, flag: "w" });
      fs.renameSync(tmpPath, filePath);
      try { fs.chmodSync(filePath, 0o600); } catch { /* ignore */ }
      return;
    } catch (err) {
      console.error(`[UserDataStore] Write failed (attempt ${attempt}/${retries}):`, err);
      try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch { /* cleanup */ }
      if (attempt === retries) throw err;
    }
  }
}

const fileLocks = new Map<string, Promise<void>>();
function withFileLock<T>(filePath: string, fn: () => T): T {
  const key = path.resolve(filePath);
  const prev = fileLocks.get(key) ?? Promise.resolve();
  let resolve: () => void;
  const next = new Promise<void>((r) => { resolve = r; });
  fileLocks.set(key, next);
  try {
    const result = fn();
    return result;
  } finally {
    resolve!();
    if (fileLocks.get(key) === next) fileLocks.delete(key);
  }
}

// ── Master users.json (all users in one file) ──────────────────────────────────

export function readMaster(): Record<string, Record<string, unknown>> {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(MASTER_FILE)) return {};
  try {
    const raw = fs.readFileSync(MASTER_FILE, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, Record<string, unknown>>;
  } catch (err) {
    console.error("[UserDataStore] CRITICAL: Failed to parse users.json — attempting backup recovery", err);
    const backupPath = MASTER_FILE + ".corrupt." + Date.now();
    try { fs.copyFileSync(MASTER_FILE, backupPath); } catch { /* ignore */ }
    console.error(`[UserDataStore] Corrupt file backed up to: ${backupPath}`);
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
    const raw = fs.readFileSync(p, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    console.error(`[UserDataStore] CRITICAL: Failed to parse profile for ${email}`, err);
    const backupPath = p + ".corrupt." + Date.now();
    try { fs.copyFileSync(p, backupPath); } catch { /* ignore */ }
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
  withFileLock(MASTER_FILE, () => {
    const now = new Date().toISOString();
    const sanitized = encryptSensitive(data);

    const master = readMaster();
    if (!master[email]) {
      master[email] = { email, createdAt: now, updatedAt: now, status: "pending" };
    }
    master[email][step] = sanitized;
    master[email]["updatedAt"] = now;
    writeMaster(master);

    const profile = readProfile(email);
    if (!profile["email"]) {
      profile["email"] = email;
      profile["createdAt"] = now;
      profile["status"] = "pending";
    }
    profile[step] = sanitized;
    profile["updatedAt"] = now;
    writeProfile(email, profile);

    const userCount = Object.keys(master).length;
    console.log(`[UserDataStore] Saved step "${step}" for ${email} (total users: ${userCount})`);
  });
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
  withFileLock(MASTER_FILE, () => {
    const now = new Date().toISOString();

    const updateRecord = (record: Record<string, unknown>) => {
      const docs = (record["documents"] as Record<string, unknown>) ?? {};
      docs[role] = filePath;
      record["documents"] = docs;
      record["updatedAt"] = now;
      return record;
    };

    const master = readMaster();
    if (!master[email]) master[email] = { email, createdAt: now };
    master[email] = updateRecord(master[email]);
    writeMaster(master);

    const profile = readProfile(email);
    if (!profile["email"]) { profile["email"] = email; profile["createdAt"] = now; }
    writeProfile(email, updateRecord(profile));

    console.log(`[UserDataStore] Document ref saved: ${role} → ${filePath} (${email})`);
  });
}

/**
 * Update a user's top-level status field (e.g. "pending" → "verified").
 */
export function setUserStatus(email: string, status: string): void {
  withFileLock(MASTER_FILE, () => {
    const now = new Date().toISOString();

    const master = readMaster();
    if (!master[email]) master[email] = { email, createdAt: now };
    master[email]["status"] = status;
    master[email]["updatedAt"] = now;
    if (status === "verified") master[email]["verifiedAt"] = now;
    writeMaster(master);

    const profile = readProfile(email);
    if (!profile["email"]) { profile["email"] = email; profile["createdAt"] = now; }
    profile["status"] = status;
    profile["updatedAt"] = now;
    if (status === "verified") profile["verifiedAt"] = now;
    writeProfile(email, profile);

    console.log(`[UserDataStore] Status set to "${status}" for ${email}`);
  });
}

export function getUserData(email: string): Record<string, unknown> | null {
  const master = readMaster();
  return master[email] ?? null;
}

/**
 * Persist a hashed password for a user so login survives server restarts.
 * The hash is stored encrypted in the user's profile under "credentials.passwordHash".
 */
export function saveUserCredentials(email: string, passwordHash: string): void {
  upsertUserStep(email, "credentials", { passwordHash });
}

/**
 * Retrieve and decrypt the stored password hash for a user.
 * Returns null if no credentials exist for the user.
 */
export function getStoredPasswordHash(email: string): string | null {
  const profile = readProfile(email);
  const creds = profile["credentials"] as Record<string, unknown> | undefined;
  if (!creds || typeof creds["passwordHash"] !== "string") return null;
  try {
    return decryptValue(creds["passwordHash"]);
  } catch {
    return null;
  }
}

/**
 * Read the full per-user profile JSON (all saved steps, meta fields, etc.).
 * Returns an empty object if the user has no profile yet.
 */
export function getUserProfileData(email: string): Record<string, unknown> {
  return readProfile(email);
}

/**
 * Write a single meta field (prefixed with `_` by convention) directly into
 * the user's per-user profile JSON without going through encryptSensitive.
 * Used for storing `_completedStepNumbers`, `_auditLog`, etc.
 */
export function setUserProfileMeta(
  email: string,
  key: string,
  value: unknown
): void {
  withFileLock(getUserProfilePath(email), () => {
    const profile = readProfile(email);
    profile[key] = value;
    profile["updatedAt"] = new Date().toISOString();
    writeProfile(email, profile);
  });
}

/**
 * Permanently delete a user from the master file and remove their profile directory.
 */
export function deleteUser(email: string): void {
  withFileLock(MASTER_FILE, () => {
    const master = readMaster();
    delete master[email];
    writeMaster(master);
    const userDir = getUserDir(email);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
    console.log(`[UserDataStore] Deleted user: ${email}`);
  });
}

/**
 * Set (or update) a user's balance and profit, with full history tracking.
 */
export function setUserBalance(
  email: string,
  balance: number,
  profit: number,
  adminNote: string,
  actor = "admin"
): void {
  withFileLock(getUserProfilePath(email), () => {
    const now = new Date().toISOString();
    const profile = readProfile(email);
    const current = (profile["_balance"] as { balance: number; profit: number } | undefined) ?? { balance: 0, profit: 0 };
    const history = (profile["_balanceHistory"] as unknown[]) ?? [];

    history.push({
      timestamp: now,
      actor,
      prevBalance: current.balance,
      prevProfit: current.profit,
      newBalance: balance,
      newProfit: profit,
      note: adminNote,
    });

    profile["_balance"] = { balance, profit, updatedAt: now };
    profile["_balanceHistory"] = history;
    profile["updatedAt"] = now;

    const auditLog = (profile["_auditLog"] as unknown[]) ?? [];
    auditLog.push({
      actionType: "ADMIN_SET_BALANCE",
      actor,
      note: adminNote || null,
      meta: { balance, profit },
      timestamp: now,
    });
    profile["_auditLog"] = auditLog;
    writeProfile(email, profile);

    console.log(`[UserDataStore] Balance set for ${email}: $${balance}, profit: $${profit}`);
  });
}

/**
 * Get a user's current balance, profit, and transaction history.
 */
export function getUserBalance(email: string): { balance: number; profit: number; updatedAt: string | null; history: unknown[] } {
  const profile = readProfile(email);
  const bal = profile["_balance"] as { balance: number; profit: number; updatedAt: string } | undefined;
  return {
    balance: bal?.balance ?? 0,
    profit: bal?.profit ?? 0,
    updatedAt: bal?.updatedAt ?? null,
    history: (profile["_balanceHistory"] as unknown[]) ?? [],
  };
}

/**
 * Assign a role to a user (e.g. "user", "vip", "restricted", "admin").
 */
export function setUserRole(email: string, role: string, actor = "admin"): void {
  withFileLock(MASTER_FILE, () => {
    const now = new Date().toISOString();
    const master = readMaster();
    if (!master[email]) master[email] = { email, createdAt: now };
    master[email]["role"] = role;
    master[email]["updatedAt"] = now;
    writeMaster(master);

    const profile = readProfile(email);
    profile["role"] = role;
    profile["updatedAt"] = now;
    const auditLog = (profile["_auditLog"] as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_ASSIGN_ROLE", actor, note: `Role set to: ${role}`, timestamp: now });
    profile["_auditLog"] = auditLog;
    writeProfile(email, profile);
    console.log(`[UserDataStore] Role set to "${role}" for ${email}`);
  });
}

/**
 * Collect all audit log entries across every user, sorted by timestamp descending.
 */
export function getGlobalAuditLog(): Array<{ email: string; entry: unknown }> {
  const master = readMaster();
  const all: Array<{ email: string; entry: unknown }> = [];
  for (const email of Object.keys(master)) {
    const profile = readProfile(email);
    const log = (profile["_auditLog"] as unknown[]) ?? [];
    for (const entry of log) {
      all.push({ email, entry });
    }
  }
  all.sort((a, b) => {
    const ta = ((a.entry as Record<string, unknown>)["timestamp"] as string) ?? "";
    const tb = ((b.entry as Record<string, unknown>)["timestamp"] as string) ?? "";
    return tb.localeCompare(ta);
  });
  return all;
}

/**
 * Create a brand-new user account directly (admin-initiated, no onboarding required).
 */
export function addNotification(
  email: string,
  notification: { type: string; title: string; message: string; actionUrl?: string }
): void {
  withFileLock(getUserProfilePath(email), () => {
    const profile = readProfile(email);
    const notifications = (profile["_notifications"] as unknown[]) ?? [];
    notifications.unshift({
      id: crypto.randomUUID(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (notifications.length > 100) notifications.length = 100;
    profile["_notifications"] = notifications;
    writeProfile(email, profile);
  });
}

export function getNotifications(email: string): unknown[] {
  const profile = readProfile(email);
  return (profile["_notifications"] as unknown[]) ?? [];
}

export function markNotificationsRead(email: string, ids: string[]): void {
  withFileLock(getUserProfilePath(email), () => {
    const profile = readProfile(email);
    const notifications = (profile["_notifications"] as Array<Record<string, unknown>>) ?? [];
    const idSet = new Set(ids);
    for (const n of notifications) {
      if (idSet.has(n["id"] as string)) n["read"] = true;
    }
    profile["_notifications"] = notifications;
    writeProfile(email, profile);
  });
}

export function markAllNotificationsRead(email: string): void {
  withFileLock(getUserProfilePath(email), () => {
    const profile = readProfile(email);
    const notifications = (profile["_notifications"] as Array<Record<string, unknown>>) ?? [];
    for (const n of notifications) n["read"] = true;
    profile["_notifications"] = notifications;
    writeProfile(email, profile);
  });
}

export function setProfilePicture(email: string, filename: string): void {
  withFileLock(MASTER_FILE, () => {
    const master = readMaster();
    if (master[email]) {
      master[email]["profilePicture"] = filename;
      writeMaster(master);
    }
    const profile = readProfile(email);
    profile["profilePicture"] = filename;
    writeProfile(email, profile);
  });
}

export function getProfilePicture(email: string): string | null {
  const profile = readProfile(email);
  return (profile["profilePicture"] as string) ?? null;
}

export function getCompletedStepNumbers(email: string): number[] {
  const profile = readProfile(email);
  return (profile["_completedStepNumbers"] as number[]) ?? [];
}

export function createAdminUser(
  email: string,
  displayName: string,
  role: string,
  actor = "admin"
): void {
  withFileLock(MASTER_FILE, () => {
    const now = new Date().toISOString();
    const master = readMaster();
    if (master[email]) throw new Error(`User ${email} already exists`);
    master[email] = { email, createdAt: now, updatedAt: now, status: "pending", role, createdBy: actor };
    writeMaster(master);

    const profile: Record<string, unknown> = {
      email,
      role,
      createdAt: now,
      updatedAt: now,
      status: "pending",
      createdBy: actor,
      personal: { firstName: displayName.split(" ")[0] ?? "", lastName: displayName.split(" ").slice(1).join(" ") ?? "" },
      _auditLog: [{ actionType: "ADMIN_CREATE_USER", actor, note: `Account created by admin. Name: ${displayName}`, timestamp: now }],
    };
    ensureDir(getUserDir(email));
    ensureDir(getUserDocDir(email));
    writeWithRetry(getUserProfilePath(email), JSON.stringify(profile, null, 2));
    console.log(`[UserDataStore] Admin created user: ${email}`);
  });
}
