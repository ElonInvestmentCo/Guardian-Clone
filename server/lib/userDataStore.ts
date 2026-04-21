import crypto from "crypto";
import path from "path";
import { getPool } from "./db.js";

console.log(`[UserDataStore] Using PostgreSQL-backed storage`);

const SENSITIVE_FIELDS = new Set([
  "taxId", "ssn", "idNumber", "dateOfBirth", "password", "passwordHash",
  "foreignIdType", "accountNumber", "abaSwift", "bankAccountNumber", "routingNumber",
]);

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

function decryptDeep(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("enc:")) {
    try {
      const decrypted = decryptValue(value);
      if (decrypted.startsWith("enc:")) return "[decryption failed]";
      return decrypted;
    } catch { return "[decryption failed]"; }
  }
  if (Array.isArray(value)) return value.map((item) => decryptDeep(item));
  if (value !== null && typeof value === "object") return decryptSensitiveProfile(value as Record<string, unknown>);
  return value;
}

export function decryptSensitiveProfile(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = decryptDeep(value);
  }
  return result;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeEmail(email: string): string {
  return normalizeEmail(email).replace(/@/g, "_at_").replace(/[^a-z0-9._-]/g, "_");
}

export function getDataDir(): string {
  return path.join(process.cwd(), "data");
}

export function getUserDir(email: string): string {
  return path.join(getDataDir(), "users", sanitizeEmail(email));
}

export function getUserDocDir(email: string): string {
  return path.join(getUserDir(email), "documents");
}

export function getUserProfilePath(email: string): string {
  return path.join(getUserDir(email), "profile.json");
}

async function getMasterEntry(email: string): Promise<Record<string, unknown> | null> {
  const pool = getPool();
  const result = await pool.query(`SELECT data FROM users WHERE email = $1`, [normalizeEmail(email)]);
  if (result.rows.length === 0) return null;
  return result.rows[0].data as Record<string, unknown>;
}

async function setMasterEntry(email: string, data: Record<string, unknown>): Promise<void> {
  const e = normalizeEmail(email);
  const pool = getPool();
  await pool.query(
    `INSERT INTO users (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [e, JSON.stringify(data)]
  );
}

async function getProfile(email: string): Promise<Record<string, unknown>> {
  const pool = getPool();
  const result = await pool.query(`SELECT data FROM user_profiles WHERE email = $1`, [normalizeEmail(email)]);
  if (result.rows.length === 0) return {};
  return result.rows[0].data as Record<string, unknown>;
}

async function setProfile(email: string, data: Record<string, unknown>): Promise<void> {
  const e = normalizeEmail(email);
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_profiles (email, data, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (email) DO UPDATE SET data = $2, updated_at = NOW()`,
    [e, JSON.stringify(data)]
  );
}

export async function readMaster(): Promise<Record<string, Record<string, unknown>>> {
  const pool = getPool();
  const result = await pool.query(`SELECT email, data FROM users`);
  const master: Record<string, Record<string, unknown>> = {};
  for (const row of result.rows) {
    master[row.email] = row.data as Record<string, unknown>;
  }
  return master;
}

export async function upsertUserStep(
  email: string,
  step: string,
  data: Record<string, unknown>
): Promise<void> {
  const now = new Date().toISOString();
  const sanitized = encryptSensitive(data);

  let master = await getMasterEntry(email);
  if (!master) {
    master = { email, createdAt: now, updatedAt: now, status: "pending" };
  }
  master[step] = sanitized;
  master["updatedAt"] = now;
  await setMasterEntry(email, master);

  const profile = await getProfile(email);
  if (!profile["email"]) {
    profile["email"] = email;
    profile["createdAt"] = now;
    profile["status"] = "pending";
  }
  profile[step] = sanitized;
  profile["updatedAt"] = now;
  await setProfile(email, profile);

  const pool = getPool();
  const countResult = await pool.query(`SELECT COUNT(*) as cnt FROM users`);
  const userCount = parseInt(countResult.rows[0].cnt);
  console.log(`[UserDataStore] Saved step "${step}" for ${email} (total users: ${userCount})`);
}

export async function addDocumentRef(
  email: string,
  role: string,
  filePath: string
): Promise<void> {
  const now = new Date().toISOString();

  let master = await getMasterEntry(email);
  if (!master) master = { email, createdAt: now };
  const docs = (master["documents"] as Record<string, unknown>) ?? {};
  docs[role] = filePath;
  master["documents"] = docs;
  master["updatedAt"] = now;
  await setMasterEntry(email, master);

  const profile = await getProfile(email);
  if (!profile["email"]) { profile["email"] = email; profile["createdAt"] = now; }
  const pDocs = (profile["documents"] as Record<string, unknown>) ?? {};
  pDocs[role] = filePath;
  profile["documents"] = pDocs;
  profile["updatedAt"] = now;
  await setProfile(email, profile);

  console.log(`[UserDataStore] Document ref saved: ${role} → ${filePath} (${email})`);
}

export async function setUserStatus(email: string, status: string): Promise<void> {
  const now = new Date().toISOString();

  let master = await getMasterEntry(email);
  if (!master) master = { email, createdAt: now };
  master["status"] = status;
  master["updatedAt"] = now;
  if (status === "verified") master["verifiedAt"] = now;
  await setMasterEntry(email, master);

  const profile = await getProfile(email);
  if (!profile["email"]) { profile["email"] = email; profile["createdAt"] = now; }
  profile["status"] = status;
  profile["updatedAt"] = now;
  if (status === "verified") profile["verifiedAt"] = now;
  await setProfile(email, profile);

  console.log(`[UserDataStore] Status set to "${status}" for ${email}`);
}

export async function getUserData(email: string): Promise<Record<string, unknown> | null> {
  const key = email.trim().toLowerCase();
  return getMasterEntry(key);
}

export async function saveUserCredentials(email: string, passwordHash: string): Promise<void> {
  await upsertUserStep(email, "credentials", { passwordHash });
}

export async function getStoredPasswordHash(email: string): Promise<string | null> {
  const profile = await getProfile(email);
  const creds = profile["credentials"] as Record<string, unknown> | undefined;
  if (!creds || typeof creds["passwordHash"] !== "string") return null;
  try {
    return decryptValue(creds["passwordHash"]);
  } catch { return null; }
}

export async function getUserProfileData(email: string): Promise<Record<string, unknown>> {
  return getProfile(email);
}

export async function setUserProfileMeta(
  email: string,
  key: string,
  value: unknown
): Promise<void> {
  const e = normalizeEmail(email);
  const pool = getPool();
  const patch = JSON.stringify({ [key]: value, updatedAt: new Date().toISOString() });
  await pool.query(
    `INSERT INTO user_profiles (email, data, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (email) DO UPDATE SET data = user_profiles.data || $2::jsonb, updated_at = NOW()`,
    [e, patch]
  );
}

export async function deleteUser(email: string): Promise<void> {
  const e = normalizeEmail(email);
  const pool = getPool();
  await pool.query(`DELETE FROM users WHERE email = $1`, [e]);
  await pool.query(`DELETE FROM user_profiles WHERE email = $1`, [e]);
  await pool.query(`DELETE FROM chat_conversations WHERE email = $1`, [e]);
  await pool.query(`DELETE FROM user_documents WHERE email = $1`, [e]);
  console.log(`[UserDataStore] Deleted user: ${e}`);
}

export const TRANSACTION_TYPES = [
  "deposit", "withdrawal", "adjustment", "bonus", "correction", "fee", "refund",
] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export async function setUserBalance(
  email: string,
  balance: number,
  profit: number,
  adminNote: string,
  actor = "admin",
  transactionType: TransactionType = "adjustment"
): Promise<void> {
  if (typeof balance !== "number" || isNaN(balance)) throw new Error("Invalid balance value");
  if (typeof profit !== "number" || isNaN(profit)) throw new Error("Invalid profit value");
  if (balance < 0) throw new Error("Balance cannot be negative");

  const now = new Date().toISOString();
  const profile = await getProfile(email);

  const current = (profile["_balance"] as { balance: number; profit: number } | undefined) ?? { balance: 0, profit: 0 };
  const history = (profile["_balanceHistory"] as unknown[]) ?? [];

  const balanceChange = balance - current.balance;
  const profitChange = profit - current.profit;

  history.push({
    timestamp: now, actor, transactionType,
    prevBalance: current.balance, prevProfit: current.profit,
    newBalance: balance, newProfit: profit,
    balanceChange, profitChange, note: adminNote,
  });

  profile["_balance"] = { balance, profit, updatedAt: now };
  profile["_balanceHistory"] = history;
  profile["updatedAt"] = now;

  const auditLog = (profile["_auditLog"] as unknown[]) ?? [];
  auditLog.push({
    actionType: "ADMIN_SET_BALANCE", actor, note: adminNote || null,
    meta: { balance, profit, transactionType, balanceChange, profitChange },
    timestamp: now,
  });
  profile["_auditLog"] = auditLog;
  await setProfile(email, profile);

  console.log(`[UserDataStore] Balance set for ${email}: $${balance}, profit: $${profit} (${transactionType})`);
}

export async function getUserBalance(email: string): Promise<{ balance: number; profit: number; updatedAt: string | null; history: unknown[] }> {
  const profile = await getProfile(email);
  const bal = profile["_balance"] as { balance: number; profit: number; updatedAt: string } | undefined;
  return {
    balance: bal?.balance ?? 0,
    profit: bal?.profit ?? 0,
    updatedAt: bal?.updatedAt ?? null,
    history: (profile["_balanceHistory"] as unknown[]) ?? [],
  };
}

export async function setUserRole(email: string, role: string, actor = "admin"): Promise<void> {
  const now = new Date().toISOString();

  let master = await getMasterEntry(email);
  if (!master) master = { email, createdAt: now };
  master["role"] = role;
  master["updatedAt"] = now;
  await setMasterEntry(email, master);

  const profile = await getProfile(email);
  profile["role"] = role;
  profile["updatedAt"] = now;
  const auditLog = (profile["_auditLog"] as unknown[]) ?? [];
  auditLog.push({ actionType: "ADMIN_ASSIGN_ROLE", actor, note: `Role set to: ${role}`, timestamp: now });
  profile["_auditLog"] = auditLog;
  await setProfile(email, profile);
  console.log(`[UserDataStore] Role set to "${role}" for ${email}`);
}

export async function getGlobalAuditLog(): Promise<Array<{ email: string; entry: unknown }>> {
  const pool = getPool();
  const result = await pool.query(`SELECT email, data FROM user_profiles`);
  const all: Array<{ email: string; entry: unknown }> = [];
  for (const row of result.rows) {
    const profile = row.data as Record<string, unknown>;
    const log = (profile["_auditLog"] as unknown[]) ?? [];
    for (const entry of log) {
      all.push({ email: row.email, entry });
    }
  }
  all.sort((a, b) => {
    const ta = ((a.entry as Record<string, unknown>)["timestamp"] as string) ?? "";
    const tb = ((b.entry as Record<string, unknown>)["timestamp"] as string) ?? "";
    return tb.localeCompare(ta);
  });
  return all;
}

export async function addNotification(
  email: string,
  notification: { type: string; title: string; message: string; actionUrl?: string }
): Promise<void> {
  const profile = await getProfile(email);
  const notifications = (profile["_notifications"] as unknown[]) ?? [];
  notifications.unshift({
    id: crypto.randomUUID(),
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  });
  if (notifications.length > 100) notifications.length = 100;
  profile["_notifications"] = notifications;
  await setProfile(email, profile);
}

export async function getNotifications(email: string): Promise<unknown[]> {
  const profile = await getProfile(email);
  return (profile["_notifications"] as unknown[]) ?? [];
}

export async function markNotificationsRead(email: string, ids: string[]): Promise<void> {
  const profile = await getProfile(email);
  const notifications = (profile["_notifications"] as Array<Record<string, unknown>>) ?? [];
  const idSet = new Set(ids);
  for (const n of notifications) {
    if (idSet.has(n["id"] as string)) n["read"] = true;
  }
  profile["_notifications"] = notifications;
  await setProfile(email, profile);
}

export async function markAllNotificationsRead(email: string): Promise<void> {
  const profile = await getProfile(email);
  const notifications = (profile["_notifications"] as Array<Record<string, unknown>>) ?? [];
  for (const n of notifications) n["read"] = true;
  profile["_notifications"] = notifications;
  await setProfile(email, profile);
}

export async function setProfilePicture(email: string, filename: string): Promise<void> {
  const master = await getMasterEntry(email);
  if (master) {
    master["profilePicture"] = filename;
    await setMasterEntry(email, master);
  }
  const profile = await getProfile(email);
  profile["profilePicture"] = filename;
  await setProfile(email, profile);
}

export async function getProfilePicture(email: string): Promise<string | null> {
  const profile = await getProfile(email);
  return (profile["profilePicture"] as string) ?? null;
}

export async function getCompletedStepNumbers(email: string): Promise<number[]> {
  const profile = await getProfile(email);
  return (profile["_completedStepNumbers"] as number[]) ?? [];
}

export async function createAdminUser(
  email: string,
  displayName: string,
  role: string,
  actor = "admin"
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getMasterEntry(email);
  if (existing) throw new Error(`User ${email} already exists`);

  const master: Record<string, unknown> = { email, createdAt: now, updatedAt: now, status: "pending", role, createdBy: actor };
  await setMasterEntry(email, master);

  const profile: Record<string, unknown> = {
    email, role, createdAt: now, updatedAt: now, status: "pending", createdBy: actor,
    personal: { firstName: displayName.split(" ")[0] ?? "", lastName: displayName.split(" ").slice(1).join(" ") ?? "" },
    _auditLog: [{ actionType: "ADMIN_CREATE_USER", actor, note: `Account created by admin. Name: ${displayName}`, timestamp: now }],
  };
  await setProfile(email, profile);
  console.log(`[UserDataStore] Admin created user: ${email}`);
}


// ─── Admin Notifications ────────────────────────────────────────────────────

export interface AdminNotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  userEmail: string | null;
  meta: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export async function addAdminNotification(notification: {
  type: string;
  title: string;
  message: string;
  userEmail?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const id = crypto.randomUUID();
  const pool = getPool();
  await pool.query(
    `INSERT INTO admin_notifications (id, type, title, message, user_email, meta, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())`,
    [
      id,
      notification.type,
      notification.title,
      notification.message,
      notification.userEmail ?? null,
      JSON.stringify(notification.meta ?? {}),
    ]
  );
}

export async function getAdminNotifications(limit = 50): Promise<AdminNotificationRecord[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT id, type, title, message, user_email, meta, is_read, created_at
     FROM admin_notifications
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((r: Record<string, unknown>) => ({
    id: r["id"] as string,
    type: r["type"] as string,
    title: r["title"] as string,
    message: r["message"] as string,
    userEmail: r["user_email"] as string | null,
    meta: (r["meta"] as Record<string, unknown>) ?? {},
    isRead: r["is_read"] as boolean,
    createdAt: (r["created_at"] as Date).toISOString(),
  }));
}

export async function getAdminUnreadCount(): Promise<number> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM admin_notifications WHERE is_read = FALSE`
  );
  return parseInt((result.rows[0] as { cnt: string })["cnt"], 10);
}

export async function markAdminNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const pool = getPool();
  const placeholders = ids.map((_: unknown, i: number) => `$${i + 1}`).join(",");
  await pool.query(
    `UPDATE admin_notifications SET is_read = TRUE WHERE id IN (${placeholders})`,
    ids
  );
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  const pool = getPool();
  await pool.query(`UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE`);
}
