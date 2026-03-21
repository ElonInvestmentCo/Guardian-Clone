/**
 * Fraud / Risk API routes.
 *
 * POST /api/fraud/risk-score   — evaluate and cache risk score for a user
 * GET  /api/fraud/risk-events  — list all risk evaluations (admin only)
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Router, type Request, type Response } from "express";
import { evaluateRisk, type RiskScore } from "../lib/fraud/riskEngine.js";
import { getUserProfileData, setUserProfileMeta } from "../lib/userDataStore.js";

const router = Router();

function masterPath(): string {
  return process.env.USER_DATA_DIR
    ? join(process.env.USER_DATA_DIR, "master.json")
    : join(process.cwd(), "data", "users", "master.json");
}

function readMasterEmails(): string[] {
  try {
    return Object.keys(JSON.parse(readFileSync(masterPath(), "utf-8")));
  } catch {
    return [];
  }
}

// ── POST /api/fraud/risk-score ───────────────────────────────────────────────
router.post("/api/fraud/risk-score", (req: Request, res: Response): void => {
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

// ── GET /api/fraud/risk-events ───────────────────────────────────────────────
router.get("/api/fraud/risk-events", (req: Request, res: Response): void => {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (secret && req.headers["x-admin-key"] !== secret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

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
