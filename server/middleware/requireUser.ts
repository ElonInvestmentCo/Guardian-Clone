import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user: { email: string };
}

declare module "express-serve-static-core" {
  interface Request {
    user?: { email: string };
  }
}

function getJwtSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.ADMIN_JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("[requireUser] SESSION_SECRET is required in production");
  }
  return secret ?? "guardian-user-dev-secret-fallback-v1";
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const cookies = req.cookies as Record<string, string> | undefined;
  if (cookies?.guardian_session) {
    token = cookies.guardian_session;
  }

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret) as { email?: string; iss?: string };

    if (payload.iss === "guardian-admin" || !payload.email) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    req.user = { email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
