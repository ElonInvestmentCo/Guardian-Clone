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

const seenPhones  = new Map<string, string[]>();

function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export async function evaluateRisk(email: string, ipAddress?: string): Promise<RiskScore> {
  const profile = await getUserProfileData(email);
  const flags: RiskFlag[] = [];
  let score = 0;

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

  const completedSteps = (profile._completedStepNumbers as number[] | undefined) ?? [];
  if (!completedSteps.includes(3)) {
    score += 10;
    flags.push({ code: "NO_ID_INFO", description: "ID information step not completed", severity: "warning" });
  }
  if (!completedSteps.includes(8)) {
    score += 10;
    flags.push({ code: "NO_ID_UPLOAD", description: "Document upload step not completed", severity: "warning" });
  }

  if (idUpload && !idInfo) {
    score += 15;
    flags.push({ code: "UPLOAD_WITHOUT_PROFILE", description: "Document uploaded but no ID information on file", severity: "warning" });
  }

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

  const now = Date.now();
  const auditLog = (profile._auditLog as Array<Record<string, unknown>> | undefined) ?? [];
  const recentStepKeys = new Set<string>();
  for (const entry of auditLog) {
    const stepKey = entry.stepKey as string | undefined;
    if (!stepKey || entry.actionType) continue;
    const ts = entry.timestamp as string | undefined;
    if (!ts) continue;
    if (now - new Date(ts).getTime() < 10 * 60 * 1000) {
      recentStepKeys.add(stepKey);
    }
  }
  if (recentStepKeys.size > 3) {
    score += 20;
    flags.push({ code: "RAPID_SUBMISSION", description: `${recentStepKeys.size} distinct steps completed in under 10 minutes`, severity: "warning" });
  }

  const risk = profile.riskTolerance as Record<string, unknown> | undefined;
  if (risk?.riskTolerance === "significant") {
    score += 5;
    flags.push({ code: "MAX_RISK_TOLERANCE", description: "User selected maximum risk tolerance", severity: "info" });
  }

  if (personal && !personal.address) {
    score += 10;
    flags.push({ code: "NO_ADDRESS", description: "No address on file", severity: "warning" });
  }

  const disclosures = profile.disclosures as Record<string, unknown> | undefined;
  if (disclosures?.wantsMargin === "yes" && risk?.riskTolerance === "significant") {
    score += 15;
    flags.push({ code: "MARGIN_MAX_RISK", description: "Margin account requested with maximum risk tolerance", severity: "warning" });
  }

  if (ipAddress && ipAddress.startsWith("10.")) {
    flags.push({ code: "INTERNAL_IP", description: "Request originated from internal IP range", severity: "info" });
  }

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    email,
    score: finalScore,
    level: scoreToLevel(finalScore),
    flags,
    evaluatedAt: new Date().toISOString(),
  };
}
