import type { Request } from "express";

type SecurityEvent =
  | "AUTH_FAIL"
  | "AUTH_SUCCESS"
  | "RATE_LIMIT"
  | "INVALID_INPUT"
  | "BOT_BLOCKED"
  | "SUSPICIOUS_ACTIVITY"
  | "ADMIN_LOGIN_FAIL"
  | "ADMIN_LOGIN_SUCCESS"
  | "UPLOAD_REJECTED"
  | "CORS_REJECTED"
  | "HONEYTRAP";

interface SecurityLogEntry {
  event: SecurityEvent;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  detail?: string;
  email?: string;
  timestamp: string;
}

export function logSecurity(
  event: SecurityEvent,
  req: Request,
  detail?: string,
  email?: string,
): void {
  const entry: SecurityLogEntry = {
    event,
    ip: req.ip ?? "unknown",
    path: req.path,
    method: req.method,
    userAgent: (req.headers["user-agent"] ?? "").slice(0, 200),
    detail,
    email,
    timestamp: new Date().toISOString(),
  };
  console.warn(`[Security] ${JSON.stringify(entry)}`);
}
