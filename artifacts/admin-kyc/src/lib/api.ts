/**
 * API client for the Guardian Admin KYC Dashboard.
 * All requests go to /api/admin/* and /api/fraud/* on the shared API server.
 */

const API_ROOT = "/api";

function getAdminKey(): string {
  return localStorage.getItem("guardianAdminKey") ?? "";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Admin-Key": getAdminKey(),
  };

  const res = await fetch(`${API_ROOT}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `HTTP ${res.status}`;
    try { message = JSON.parse(text).error ?? message; } catch { /* */ }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type UserStatus = "pending" | "approved" | "rejected" | "resubmit";

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
  note?: string;
  reason?: string;
  fields?: string[];
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

export async function getRiskEvents(params?: { minScore?: number; level?: string }): Promise<{ total: number; events: RiskScore[] }> {
  const q = new URLSearchParams();
  if (params?.minScore) q.set("minScore", String(params.minScore));
  if (params?.level)    q.set("level",    params.level);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return request<{ total: number; events: RiskScore[] }>("GET", `/fraud/risk-events${qs}`);
}

export function saveAdminKey(key: string): void {
  localStorage.setItem("guardianAdminKey", key);
}

export function hasAdminKey(): boolean {
  return !!localStorage.getItem("guardianAdminKey");
}
