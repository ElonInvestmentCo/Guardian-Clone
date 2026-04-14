import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { setUserStatus, getUserData, getUserProfileData } from "../lib/userDataStore.js";
import { sendAccountVerifiedEmail } from "../lib/mailer.js";
import { validate, AuthCheckEmailSchema } from "../lib/validation.js";

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

verifyRouter.post("/signup/verify", requireAdminOrInternal, validate(AuthCheckEmailSchema), async (req, res) => {
  const { email } = req.body as { email: string };

  const user = await getUserData(email);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    await setUserStatus(email, "verified");

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

verifyRouter.get("/signup/status", validate(AuthCheckEmailSchema), async (req, res) => {
  const { email } = (req as unknown as { validatedQuery: { email: string } }).validatedQuery;

  const user = await getUserData(email);
  if (!user) {
    res.json({ status: "not_found" });
    return;
  }

  const userStatus = (user["status"] as string) ?? "pending";
  const response: Record<string, unknown> = {
    status: userStatus,
    verifiedAt: user["verifiedAt"] ?? null,
  };

  if (userStatus === "rejected" || userStatus === "resubmit" || userStatus === "resubmit_required" || userStatus === "reviewing") {
    const profile = await getUserProfileData(email);
    const auditLog = (profile._auditLog as Array<Record<string, unknown>>) ?? [];

    if (userStatus === "rejected") {
      const rejectEntry = [...auditLog].reverse().find((e) => e.actionType === "ADMIN_REJECT");
      if (rejectEntry) {
        response.rejectionReason = rejectEntry.reason ?? null;
      }
    }

    if (userStatus === "resubmit" || userStatus === "resubmit_required") {
      const resubmitEntry = [...auditLog].reverse().find((e) => e.actionType === "ADMIN_REQUEST_RESUBMIT");
      const metaFields = (profile._resubmitFields as string[]) ?? [];
      const auditFields = (resubmitEntry?.fields as string[]) ?? [];
      response.resubmitFields = metaFields.length > 0 ? metaFields : auditFields;
      response.resubmitReason = (profile._resubmitReason as string) ?? null;
      if (resubmitEntry) {
        response.resubmitNote = resubmitEntry.note ?? null;
      }
    }
  }

  res.json(response);
});

export default verifyRouter;
