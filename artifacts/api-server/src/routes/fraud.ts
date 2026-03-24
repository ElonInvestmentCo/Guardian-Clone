import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { evaluateRisk, type RiskScore } from "../lib/fraud/riskEngine.js";
import { getUserProfileData, setUserProfileMeta, readMaster } from "../lib/userDataStore.js";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
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

  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers["x-admin-key"] === secret) {
    next();
    return;
  }

  res.status(401).json({ error: "Authentication required" });
}

function readMasterEmails(): string[] {
  try {
    return Object.keys(readMaster());
  } catch {
    return [];
  }
}

router.post("/api/fraud/risk-score", requireAuth, (req: Request, res: Response): void => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }

    const result  = evaluateRisk(email, req.ip);
    const profile = getUserProfileData(email);

    const history: RiskScore[] = (profile._riskHistory as RiskScore[] | undefined) ?? [];
    history.push(result);
    if (history.length > 20) history.splice(0, history.length - 20);
    setUserProfileMeta(email, "_riskHistory", history);
    setUserProfileMeta(email, "_latestRisk",  result);

    res.json(result);
  } catch (err) {
    console.error("[Fraud] risk-score error:", err);
    res.status(500).json({ error: "Risk evaluation failed" });
  }
});

router.get("/api/fraud/risk-events", requireAuth, (req: Request, res: Response): void => {
  try {
    const minScore = parseInt(String(req.query.minScore ?? "0"));
    const level    = req.query.level as string | undefined;

    const emails = readMasterEmails();
    const events = emails
      .map((email) => {
        const profile = getUserProfileData(email);
        return (profile._latestRisk as RiskScore | undefined) ?? evaluateRisk(email);
      })
      .filter((r) => r.score >= minScore)
      .filter((r) => !level || r.level === level)
      .sort((a, b) => b.score - a.score);

    res.json({ total: events.length, events });
  } catch (err) {
    console.error("[Fraud] risk-events error:", err);
    res.status(500).json({ error: "Failed to load risk events" });
  }
});

export default router;
