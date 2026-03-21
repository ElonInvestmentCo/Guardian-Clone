/**
 * Fraud / Risk Engine
 *
 * Assigns a 0–100 risk score to a user based on their onboarding data,
 * document submission patterns, and identity signals.
 *
 * riskLevel thresholds:
 *   0–24   → low
 *   25–49  → medium
 *   50–74  → high
 *   75–100 → critical
 */

import { getUserProfileData } from "../userDataStore.js";

export type RiskLevel = "low" | "medium" | "high" | "critical";

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

/** In-memory store of previously seen emails / phones / IPs */
const seenEmails  = new Map<string, string[]>();   // email → [email, email, ...]
const seenPhones  = new Map<string, string[]>();   // phone → [email, ...]
const recentAttempts = new Map<string, number[]>(); // email → [timestamps]

function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

/**
 * Evaluate risk score for a user.
 * @param email     The user's email.
 * @param ipAddress The IP address of the request (optional).
 */
export function evaluateRisk(email: string, ipAddress?: string): RiskScore {
  const profile = getUserProfileData(email);
  const flags: RiskFlag[] = [];
  let score = 0;

  // ── 1. Identity mismatch ──────────────────────────────────────────────
  const personal   = profile.personal       as Record<string, unknown> | undefined;
  const idInfo     = profile.idInformation  as Record<string, unknown> | undefined;
  const idUpload   = profile.idProofUpload  as Record<string, unknown> | undefined;

  if (personal && idInfo) {
    const personalDOB = personal.dateOfBirth;
    const idDOB       = idInfo.dateOfBirth;
    if (personalDOB && idDOB && personalDOB !== idDOB) {
      score += 30;
      flags.push({ code: "DOB_MISMATCH", description: "Date of birth on ID does not match onboarding entry", severity: "critical" });
    }
  }

  // ── 2. Incomplete critical steps ──────────────────────────────────────
  const completedSteps = (profile._completedStepNumbers as number[] | undefined) ?? [];
  if (!completedSteps.includes(3)) {
    score += 10;
    flags.push({ code: "NO_ID_INFO", description: "ID information step not completed", severity: "warning" });
  }
  if (!completedSteps.includes(8)) {
    score += 10;
    flags.push({ code: "NO_ID_UPLOAD", description: "Document upload step not completed", severity: "warning" });
  }

  // ── 3. Document upload without ID info ───────────────────────────────
  if (idUpload && !idInfo) {
    score += 15;
    flags.push({ code: "UPLOAD_WITHOUT_PROFILE", description: "Document uploaded but no ID information on file", severity: "warning" });
  }

  // ── 4. Multiple account detection (phone reuse) ───────────────────────
  const phone = personal?.phoneNumber as string | undefined;
  if (phone) {
    const existing = seenPhones.get(phone) ?? [];
    if (!existing.includes(email)) existing.push(email);
    seenPhones.set(phone, existing);
    if (existing.length > 1) {
      score += 25;
      flags.push({ code: "PHONE_REUSE", description: `Phone number shared across ${existing.length} accounts`, severity: "critical" });
    }
  }

  // ── 5. Rapid onboarding attempt (>3 completions in 10 min) ───────────
  const now = Date.now();
  const attempts = recentAttempts.get(email) ?? [];
  const recent   = attempts.filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  recentAttempts.set(email, recent);
  if (recent.length > 3) {
    score += 20;
    flags.push({ code: "RAPID_SUBMISSION", description: `${recent.length} step completions in under 10 minutes`, severity: "warning" });
  }

  // ── 6. High-risk investment objectives ───────────────────────────────
  const risk = profile.riskTolerance as Record<string, unknown> | undefined;
  if (risk?.riskTolerance === "significant") {
    score += 5;
    flags.push({ code: "MAX_RISK_TOLERANCE", description: "User selected maximum risk tolerance", severity: "info" });
  }

  // ── 7. Missing address / geographic anomaly ───────────────────────────
  if (personal && !personal.address) {
    score += 10;
    flags.push({ code: "NO_ADDRESS", description: "No address on file", severity: "warning" });
  }

  // ── 8. Suspicious margin + max-risk combo ────────────────────────────
  const disclosures = profile.disclosures as Record<string, unknown> | undefined;
  if (disclosures?.wantsMargin === "yes" && risk?.riskTolerance === "significant") {
    score += 15;
    flags.push({ code: "MARGIN_MAX_RISK", description: "Margin account requested with maximum risk tolerance", severity: "warning" });
  }

  // ── 9. IP-based anomaly (placeholder — flag if provided but unsupported) ──
  if (ipAddress && ipAddress.startsWith("10.")) {
    flags.push({ code: "INTERNAL_IP", description: "Request originated from internal IP range", severity: "info" });
  }

  // Clamp 0–100
  const finalScore = Math.min(100, Math.max(0, score));

  return {
    email,
    score: finalScore,
    level: scoreToLevel(finalScore),
    flags,
    evaluatedAt: new Date().toISOString(),
  };
}
