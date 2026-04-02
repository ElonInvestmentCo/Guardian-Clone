/**
 * API client for the Guardian Admin KYC Dashboard.
 * Uses JWT Bearer token authentication — no plain-text keys.
 */

function getApiRoot(): string {
  const explicit = (import.meta as any).env?.["VITE_API_URL"] as string | undefined;
  if (explicit) return explicit.replace(/\/$/, "") + "/api";
  return "/api";
}

const API_ROOT = getApiRoot();

const TOKEN_KEY   = "guardianAdminToken";
const EXPIRY_KEY  = "guardianAdminExpiry";

// ── Session management ────────────────────────────────────────────────────────

export function getSession(): { token: string; expiresAt: number } | null {
  const token    = localStorage.getItem(TOKEN_KEY);
  const expiryRaw = localStorage.getItem(EXPIRY_KEY);
  if (!token || !expiryRaw) return null;
  const expiresAt = Number(expiryRaw);
  if (Date.now() >= expiresAt) {
    clearSession();
    return null;
  }
  return { token, expiresAt };
}

function saveSession(token: string, expiresAt: number): void {
  localStorage.setItem(TOKEN_KEY,  token);
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem("guardianAdminKey");
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_ROOT}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try { message = JSON.parse(text).error ?? message; } catch { /**/ }
    throw new Error(message);
  }

  const data = await res.json() as { token: string; expiresAt: number };
  saveSession(data.token, data.expiresAt);
}

// ── Authenticated request ─────────────────────────────────────────────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const session = getSession();
  if (!session) {
    window.dispatchEvent(new CustomEvent("admin:session-expired"));
    throw new Error("Session expired. Please log in again.");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.token}`,
  };

  const res = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("admin:session-expired"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try { message = JSON.parse(text).error ?? message; } catch { /**/ }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel  = "low" | "medium" | "high" | "critical";
export type UserStatus = "pending" | "approved" | "rejected" | "resubmit" | "suspended" | "banned" | "verified";

export interface KycUser {
  email: string;
  name: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  completedSteps: number;
  totalSteps: number;
  riskScore: number;
  riskLevel: RiskLevel;
  flagCount: number;
}

export interface AdminUser extends KycUser {
  role: string;
  balance: number;
  profit: number;
  lastActionType: string | null;
  lastActionAt: string | null;
  auditCount: number;
}

export interface RiskFlag {
  code: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface RiskScore {
  email: string;
  score: number;
  level: RiskLevel;
  flags: RiskFlag[];
  evaluatedAt: string;
}

export interface AuditEntry {
  actionType: string;
  actor: string;
  email?: string;
  note?: string;
  reason?: string;
  fields?: string[];
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface UserDetails {
  email: string;
  master: Record<string, unknown>;
  profile: Record<string, unknown>;
  risk: RiskScore;
  auditLog: AuditEntry[];
}

export interface KycQueueResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  users: KycUser[];
}

export interface AllUsersResponse {
  total: number;
  users: AdminUser[];
}

export interface GlobalAuditResponse {
  total: number;
  entries: Array<{ email: string; entry: AuditEntry }>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getKycQueue(params?: {
  page?: number;
  limit?: number;
  status?: string;
  minRisk?: number;
}): Promise<KycQueueResponse> {
  const q = new URLSearchParams();
  if (params?.page)    q.set("page",    String(params.page));
  if (params?.limit)   q.set("limit",   String(params.limit));
  if (params?.status)  q.set("status",  params.status);
  if (params?.minRisk) q.set("minRisk", String(params.minRisk));
  const qs = q.toString() ? `?${q.toString()}` : "";
  return request<KycQueueResponse>("GET", `/admin/kyc-queue${qs}`);
}

export async function getAllUsers(params?: {
  search?: string;
  status?: string;
  role?: string;
}): Promise<AllUsersResponse> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.status) q.set("status", params.status);
  if (params?.role)   q.set("role",   params.role);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return request<AllUsersResponse>("GET", `/admin/all-users${qs}`);
}

export async function getUserDetails(email: string): Promise<UserDetails> {
  return request<UserDetails>("GET", `/admin/user-details/${encodeURIComponent(email)}`);
}

export async function approveUser(email: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/approve-user", { email, adminNote });
}

export async function rejectUser(email: string, reason?: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/reject-user", { email, reason, adminNote });
}

export async function requestResubmission(email: string, fields?: string[], adminNote?: string): Promise<void> {
  await request("POST", "/admin/request-resubmission", { email, fields, adminNote });
}

export async function suspendUser(email: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/suspend-user", { email, adminNote });
}

export async function banUser(email: string, reason?: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/ban-user", { email, reason, adminNote });
}

export async function reactivateUser(email: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/reactivate-user", { email, adminNote });
}

export async function assignRole(email: string, role: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/assign-role", { email, role, adminNote });
}

export const TRANSACTION_TYPES = [
  "deposit", "withdrawal", "adjustment", "bonus", "correction", "fee", "refund",
] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export async function setBalance(
  email: string, balance: number, profit: number,
  adminNote: string, transactionType: TransactionType = "adjustment"
): Promise<void> {
  await request("POST", "/admin/set-balance", { email, balance, profit, adminNote, transactionType });
}

export async function getUserBalance(email: string): Promise<{ balance: number; profit: number; updatedAt: string | null; history: unknown[] }> {
  return request("GET", `/admin/user-balance/${encodeURIComponent(email)}`);
}

export async function flagUser(email: string, reason?: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/flag-user", { email, reason, adminNote });
}

export async function resetPassword(email: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/reset-password", { email, adminNote });
}

export async function createUser(email: string, displayName: string, role?: string): Promise<void> {
  await request("POST", "/admin/create-user", { email, displayName, role });
}

export async function deleteUser(email: string, adminNote?: string): Promise<void> {
  await request("DELETE", "/admin/delete-user", { email, adminNote });
}

export async function updateUser(email: string, firstName?: string, lastName?: string, adminNote?: string): Promise<void> {
  await request("POST", "/admin/update-user", { email, firstName, lastName, adminNote });
}

export async function getGlobalAudit(limit = 500): Promise<GlobalAuditResponse> {
  return request<GlobalAuditResponse>("GET", `/admin/global-audit?limit=${limit}`);
}

export interface DocumentInfo {
  role: string;
  path: string;
  exists: boolean;
  fileName: string;
}

export interface UserDocumentsResponse {
  email: string;
  documents: Record<string, DocumentInfo>;
}

export async function getUserDocuments(email: string): Promise<UserDocumentsResponse> {
  return request<UserDocumentsResponse>("GET", `/admin/user-documents/${encodeURIComponent(email)}`);
}

export async function fetchDocumentBlobUrl(email: string, role: string): Promise<string> {
  const session = getSession();
  if (!session) throw new Error("Not authenticated");
  const url = `${API_ROOT}/admin/user-document-file/${encodeURIComponent(email)}/${encodeURIComponent(role)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!resp.ok) throw new Error("Failed to fetch document");
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}
