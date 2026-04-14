import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { evaluateRisk, type RiskScore } from "../lib/fraud/riskEngine.js";
import { getUserProfileData, setUserProfileMeta, readMaster } from "../lib/userDataStore.js";
import { validate, FraudRiskSchema } from "../lib/validation.js";

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

router.post("/fraud/risk-score", requireAuth, validate(FraudRiskSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };

    const result  = await evaluateRisk(email, req.ip);
    const profile = await getUserProfileData(email);

    const history: RiskScore[] = (profile._riskHistory as RiskScore[] | undefined) ?? [];
    history.push(result);
    if (history.length > 20) history.splice(0, history.length - 20);
    await setUserProfileMeta(email, "_riskHistory", history);
    await setUserProfileMeta(email, "_latestRisk",  result);

    res.json(result);
  } catch (err) {
    console.error("[Fraud] risk-score error:", err);
    res.status(500).json({ error: "Risk evaluation failed" });
  }
});

router.get("/fraud/risk-events", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const minScore = parseInt(String(req.query.minScore ?? "0"));
    const level    = req.query.level as string | undefined;

    const master = await readMaster();
    const emails = Object.keys(master);
    const events: RiskScore[] = [];

    for (const email of emails) {
      const profile = await getUserProfileData(email);
      const cached = profile._latestRisk as RiskScore | undefined;
      const risk = cached ?? await evaluateRisk(email);
      events.push(risk);
    }

    const filtered = events
      .filter((r) => r.score >= minScore)
      .filter((r) => !level || r.level === level)
      .sort((a, b) => b.score - a.score);

    res.json({ total: filtered.length, events: filtered });
  } catch (err) {
    console.error("[Fraud] risk-events error:", err);
    res.status(500).json({ error: "Failed to load risk events" });
  }
});

export default router;
