/**
 * API client for the Guardian Admin KYC Dashboard.
 * Uses JWT Bearer token authentication — no plain-text keys.
 */

const API_ROOT = "/api";

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
export type UserStatus = "pending" | "approved" | "rejected" | "resubmit" | "suspended" | "banned";

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

export interface GlobalAuditResponse {
  total: number;
  entries: AuditEntry[];
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

export async function getGlobalAudit(limit = 200): Promise<GlobalAuditResponse> {
  return request<GlobalAuditResponse>("GET", `/admin/global-audit?limit=${limit}`);
}
