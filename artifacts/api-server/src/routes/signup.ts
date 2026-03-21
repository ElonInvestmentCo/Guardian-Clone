import { Router } from "express";
import {
  upsertUserStep,
  getUserData,
  getUserProfileData,
  setUserProfileMeta,
} from "../lib/userDataStore.js";

const signupRouter = Router();

// ── Audit helpers ──────────────────────────────────────────────────────────────

function auditLog(
  email: string,
  step: string,
  action: string,
  meta?: Record<string, unknown>
): void {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(
    `[Audit][${ts}] action=${action} step=${step} email=${email}${metaStr}`
  );
}

interface AuditEntry {
  stepKey: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

function computeAuditDiff(
  stepKey: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const ts = new Date().toISOString();
  const allFields = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData),
  ]);
  for (const field of allFields) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      entries.push({ stepKey, field, oldValue: oldVal, newValue: newVal, timestamp: ts });
    }
  }
  return entries;
}

function appendAuditLog(email: string, entries: AuditEntry[]): void {
  if (entries.length === 0) return;
  const profile = getUserProfileData(email);
  const existing = (profile["_auditLog"] as AuditEntry[]) ?? [];
  setUserProfileMeta(email, "_auditLog", [...existing, ...entries]);
}

// ── Step configuration ─────────────────────────────────────────────────────────

const ONBOARDING_STEPS = [
  "general",
  "personal",
  "professional",
  "idInformation",
  "income",
  "riskTolerance",
  "financialSituation",
  "investmentExperience",
  "idProofUpload",
  "fundingDetails",
  "disclosures",
  "signatures",
] as const;

// ── Per-step server-side validators ───────────────────────────────────────────

type ValidationErrors = Record<string, string>;

function validateStep(
  stepKey: string,
  data: Record<string, unknown>
): ValidationErrors {
  const errors: ValidationErrors = {};

  const req = (field: string, label: string) => {
    const v = data[field];
    if (v === undefined || v === null || v?.toString().trim() === "") {
      errors[field] = `${label} is required`;
    }
  };

  switch (stepKey) {
    case "general":
      req("registrationType", "Registration type");
      req("product", "Product");
      break;

    case "personal":
      req("firstName", "First name");
      req("lastName", "Last name");
      req("address", "Address");
      req("state", "State");
      req("city", "City");
      req("zipCode", "ZIP code");
      req("phoneNumber", "Phone number");
      break;

    case "professional":
      req("employmentStatus", "Employment status");
      break;

    case "idInformation":
      req("taxIdType", "Tax ID type");
      req("taxId", "Tax ID");
      req("idType", "Government-issued ID type");
      req("idNumber", "ID number");
      break;

    case "income":
      req("annualIncome", "Annual income");
      req("netWorth", "Net worth");
      req("liquidNetWorth", "Liquid net worth");
      req("taxRate", "Tax rate bracket");
      break;

    case "riskTolerance": {
      req("riskTolerance", "Risk tolerance");
      const priorities = data["strategyPriorities"] as
        | Record<string, string>
        | undefined;
      if (priorities) {
        const vals = Object.values(priorities).filter(Boolean);
        const unique = new Set(vals);
        if (vals.length < 5 || unique.size < 5) {
          errors["strategyPriorities"] =
            "Assign a unique priority (1–5) to every strategy";
        }
      } else {
        errors["strategyPriorities"] = "Strategy priorities are required";
      }
      break;
    }

    case "financialSituation":
      req("annualExpense", "Annual expenses");
      req("specialExpense", "Special expenses");
      req("liquidityNeeds", "Liquidity needs");
      req("investmentTimeHorizon", "Investment time horizon");
      break;

    case "investmentExperience":
      // Flexible — any submission is accepted
      break;

    case "idProofUpload":
      req("idType", "ID document type");
      break;

    case "fundingDetails": {
      const sources = data["fundingSources"];
      if (
        !sources ||
        !Array.isArray(sources) ||
        (sources as unknown[]).length === 0
      ) {
        errors["fundingSources"] = "Select at least one funding source";
      }
      req("bankName", "Bank name");
      req("abaSwift", "ABA / SWIFT code");
      req("accountName", "Account name");
      break;
    }

    case "disclosures":
      req("taxWithholding", "Tax withholding selection");
      break;

    case "signatures":
      if (
        !data["hasSigned"] &&
        !data["signatureName"]?.toString().trim()
      ) {
        errors["signatures"] = "Signature is required to complete your application";
      }
      break;

    default:
      // Unknown step — pass through
      break;
  }

  return errors;
}

// ── completed-step numbers helpers ───────────────────────────────────────────

function getCompletedStepNumbers(email: string): number[] {
  const profile = getUserProfileData(email);
  return (profile["_completedStepNumbers"] as number[]) ?? [];
}

function addCompletedStepNumber(email: string, stepNum: number): number[] {
  const existing = getCompletedStepNumbers(email);
  if (existing.includes(stepNum)) return existing;
  const updated = [...existing, stepNum].sort((a, b) => a - b);
  setUserProfileMeta(email, "_completedStepNumbers", updated);
  return updated;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/signup/save-step
 * Legacy endpoint — kept for backward compatibility (draft saves, uploads, etc.)
 */
signupRouter.post("/signup/save-step", (req, res) => {
  const { email, step, data } = req.body as {
    email?: string;
    step?: string;
    data?: Record<string, unknown>;
  };

  if (!email || !step || !data) {
    res.status(400).json({ error: "email, step, and data are required" });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    upsertUserStep(email, step, data);
    auditLog(email, step, "SAVE_STEP_DRAFT", { fields: Object.keys(data) });
    res.json({ success: true });
  } catch (err) {
    console.error("[signup/save-step] Error:", err);
    res.status(500).json({ error: "Failed to save data" });
  }
});

/**
 * POST /api/signup/complete-step
 * Production endpoint — validates, saves, marks the step complete, and
 * appends a field-level audit diff to the user's profile.
 *
 * Returns 422 with field-level errors if validation fails.
 * Returns { success: true, completedSteps: number[] } on success.
 */
signupRouter.post("/signup/complete-step", (req, res) => {
  const { email, stepNumber, stepKey, data } = req.body as {
    email?: string;
    stepNumber?: number;
    stepKey?: string;
    data?: Record<string, unknown>;
  };

  if (
    !email ||
    stepNumber === undefined ||
    !stepKey ||
    !data
  ) {
    res.status(400).json({
      error: "email, stepNumber, stepKey, and data are required",
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  // 1. Server-side field validation
  const errors = validateStep(stepKey, data);
  if (Object.keys(errors).length > 0) {
    auditLog(email, stepKey, "VALIDATE_FAIL", {
      stepNumber,
      errorFields: Object.keys(errors),
    });
    res.status(422).json({ success: false, errors });
    return;
  }

  try {
    // 2. Load existing step data for audit diff
    const profile = getUserProfileData(email);
    const oldStepData =
      (profile[stepKey] as Record<string, unknown>) ?? {};

    // 3. Save step data
    upsertUserStep(email, stepKey, data);

    // 4. Mark step number complete
    const completedSteps = addCompletedStepNumber(email, stepNumber);

    // 5. Compute and store field-level audit diff
    const diff = computeAuditDiff(stepKey, oldStepData, data);
    appendAuditLog(email, diff);

    auditLog(email, stepKey, "COMPLETE_STEP", {
      stepNumber,
      changedFields: diff.length,
      completedSteps,
    });

    res.json({ success: true, completedSteps });
  } catch (err) {
    console.error("[signup/complete-step] Error:", err);
    auditLog(email, stepKey, "COMPLETE_STEP_ERROR", { error: String(err) });
    res.status(500).json({ error: "Failed to complete step" });
  }
});

/**
 * GET /api/signup/get-progress?email=
 * Returns saved step data, completed step keys, and completed step numbers.
 */
signupRouter.get("/signup/get-progress", (req, res) => {
  const { email } = req.query as { email?: string };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  try {
    const profile = getUserProfileData(email);
    if (!profile || Object.keys(profile).length === 0) {
      res.json({ stepData: {}, completedSteps: [], completedStepNumbers: [] });
      return;
    }

    const stepData: Record<string, unknown> = {};
    const completedSteps: string[] = [];

    for (const key of ONBOARDING_STEPS) {
      if (profile[key] !== undefined) {
        stepData[key] = profile[key];
        completedSteps.push(key);
      }
    }

    const completedStepNumbers =
      (profile["_completedStepNumbers"] as number[]) ?? [];

    auditLog(email, "all", "GET_PROGRESS", {
      completedSteps,
      completedStepNumbers,
    });

    res.json({ stepData, completedSteps, completedStepNumbers });
  } catch (err) {
    console.error("[signup/get-progress] Error:", err);
    res.status(500).json({ error: "Failed to retrieve progress" });
  }
});

export default signupRouter;
