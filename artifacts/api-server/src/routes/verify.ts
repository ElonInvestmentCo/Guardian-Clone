import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { setUserStatus, getUserData, getUserProfileData } from "../lib/userDataStore.js";
import { sendAccountVerifiedEmail } from "../lib/mailer.js";

const verifyRouter = Router();

function requireAdminOrInternal(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const adminSecret = process.env.ADMIN_JWT_SECRET;

  if (token && adminSecret) {
    try {
      jwt.verify(token, adminSecret, { issuer: "guardian-admin" });
      next();
      return;
    } catch { /* fall through */ }
  }

  const internalKey = process.env.INTERNAL_API_KEY;
  if (internalKey && req.headers["x-internal-key"] === internalKey) {
    next();
    return;
  }

  res.status(403).json({ error: "This endpoint requires admin or internal authentication" });
}

/**
 * POST /api/signup/verify
 * Mark a user's application as verified and send the confirmation email.
 * Protected: requires admin JWT or internal API key.
 */
verifyRouter.post("/signup/verify", requireAdminOrInternal, async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const user = getUserData(email);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    setUserStatus(email, "verified");

    sendAccountVerifiedEmail(email).catch((err) => {
      console.error("[verify] Failed to send verified email:", err);
    });

    console.log(`[verify] Account verified for ${email}`);
    res.json({ success: true, status: "verified" });
  } catch (err) {
    console.error("[verify] Error verifying account:", err);
    res.status(500).json({ error: "Failed to verify account" });
  }
});

/**
 * GET /api/signup/status?email=...
 * Return the current application status for a user.
 */
verifyRouter.get("/signup/status", (req, res) => {
  const email = req.query["email"] as string | undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const user = getUserData(email);
  if (!user) {
    res.json({ status: "not_found" });
    return;
  }

  const userStatus = (user["status"] as string) ?? "pending";
  const response: Record<string, unknown> = {
    status: userStatus,
    verifiedAt: user["verifiedAt"] ?? null,
  };

  if (userStatus === "rejected" || userStatus === "resubmit") {
    const profile = getUserProfileData(email);
    const auditLog = (profile._auditLog as Array<Record<string, unknown>>) ?? [];

    if (userStatus === "rejected") {
      const rejectEntry = [...auditLog].reverse().find((e) => e.actionType === "ADMIN_REJECT");
      if (rejectEntry) {
        response.rejectionReason = rejectEntry.reason ?? null;
      }
    }

    if (userStatus === "resubmit") {
      const resubmitEntry = [...auditLog].reverse().find((e) => e.actionType === "ADMIN_REQUEST_RESUBMIT");
      const metaFields = (profile._resubmitFields as string[]) ?? [];
      const auditFields = (resubmitEntry?.fields as string[]) ?? [];
      response.resubmitFields = metaFields.length > 0 ? metaFields : auditFields;
      if (resubmitEntry) {
        response.resubmitNote = resubmitEntry.note ?? null;
      }
    }
  }

  res.json(response);
});

export default verifyRouter;
