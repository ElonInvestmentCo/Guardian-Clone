import { Router, type Request } from "express";
import { insertSignatureAuditLog } from "../lib/signatureAudit.js";
import {
  upsertUserStep,
  getUserData,
  getUserProfileData,
  setUserProfileMeta,
  setUserStatus,
  addAdminNotification,
  addCompletedStepNumber,
} from "../lib/userDataStore.js";
import { getPool } from "../lib/db.js";
import { userDataLimit, sensitiveEndpointLimit } from "../middleware/security.js";
import { validate, SignupSaveStepSchema, SignupCompleteStepSchema, SignupGetProgressSchema } from "../lib/validation.js";

const signupRouter = Router();

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

async function appendAuditLog(email: string, entries: AuditEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const profile = await getUserProfileData(email);
  const existing = (profile["_auditLog"] as AuditEntry[]) ?? [];
  await setUserProfileMeta(email, "_auditLog", [...existing, ...entries]);
}

const ONBOARDING_STEPS = [
  "general", "personal", "professional", "idInformation",
  "income", "riskTolerance", "financialSituation", "investmentExperience",
  "idProofUpload", "fundingDetails", "disclosures", "signatures",
] as const;

function isValidPhone(v: string): boolean {
  const cleaned = v.replace(/[\s\-().+]/g, "");
  return /^\d{7,15}$/.test(cleaned);
}

function isValidName(v: string): boolean {
  return v.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(v.trim());
}

function isValidDate(v: string): boolean {
  const dateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const isoRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  if (!dateRegex.test(v) && !isoRegex.test(v)) return false;
  return !isNaN(new Date(v).getTime());
}

function isValidSSN(v: string, taxIdType: string): boolean {
  const cleaned = v.replace(/[\s\-]/g, "");
  if (taxIdType === "SSN") {
    return /^\d{9}$/.test(cleaned) && !cleaned.startsWith("000") && !cleaned.startsWith("666") && !cleaned.startsWith("9");
  } else if (taxIdType === "EIN") {
    return /^\d{9}$/.test(cleaned);
  }
  return cleaned.length >= 4;
}

function isValidAbaSwift(v: string): boolean {
  const trimmed = v.trim();
  return /^\d{9}$/.test(trimmed) || /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i.test(trimmed);
}

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

  const str = (field: string): string => (data[field]?.toString() ?? "").trim();

  switch (stepKey) {
    case "general":
      req("registrationType", "Registration type");
      req("product", "Product");
      req("howHeard", "How you heard about us");
      break;

    case "personal":
      req("firstName", "First name");
      req("lastName", "Last name");
      if (str("firstName") && !isValidName(str("firstName"))) errors["firstName"] = "First name contains invalid characters";
      if (str("lastName") && !isValidName(str("lastName"))) errors["lastName"] = "Last name contains invalid characters";
      req("address", "Address");
      if (str("address") && str("address").length < 5) errors["address"] = "Address must be at least 5 characters";
      req("country", "Country");
      req("city", "City");
      req("zipCode", "ZIP code");
      req("phoneNumber", "Phone number");
      if (str("phoneNumber") && !isValidPhone(str("phoneNumber"))) {
        errors["phoneNumber"] = "Phone number must be 7-15 digits";
      }
      break;

    case "professional": {
      req("employmentStatus", "Employment status");
      const status = str("employmentStatus");
      if (status === "employed" || status === "self-employed") {
        req("employerName", "Employer name");
        if (str("employerName") && !isValidName(str("employerName"))) errors["employerName"] = "Employer name contains invalid characters";
        req("positionTitle", "Position/Title");
        req("employerAddress", "Employer address");
        if (str("employerAddress") && str("employerAddress").length < 5) errors["employerAddress"] = "Address must be at least 5 characters";
        req("country", "Country");
        req("city", "City");
        req("yearsWithEmployer", "Years with employer");
        if (str("yearsWithEmployer") && isNaN(Number(str("yearsWithEmployer")))) errors["yearsWithEmployer"] = "Enter a valid number";
        req("phoneNumber", "Phone number");
        if (str("phoneNumber") && !isValidPhone(str("phoneNumber"))) errors["phoneNumber"] = "Phone number must be 7-15 digits";
      }
      break;
    }

    case "idInformation":
      req("taxResidenceCountry", "Country of tax residence");
      req("taxIdType", "Tax ID type");
      req("taxId", "Tax ID");
      if (str("taxId") && str("taxIdType") && !isValidSSN(str("taxId"), str("taxIdType"))) {
        if (str("taxIdType") === "SSN") errors["taxId"] = "SSN must be exactly 9 digits";
        else if (str("taxIdType") === "EIN") errors["taxId"] = "EIN must be exactly 9 digits";
        else errors["taxId"] = "Foreign ID must be at least 4 characters";
      }
      req("dateOfBirth", "Date of birth");
      if (str("dateOfBirth") && !isValidDate(str("dateOfBirth"))) errors["dateOfBirth"] = "Enter a valid date (MM/DD/YYYY)";
      if (str("dateOfBirth") && isValidDate(str("dateOfBirth"))) {
        const dob = new Date(str("dateOfBirth"));
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const mDiff = now.getMonth() - dob.getMonth();
        if (mDiff < 0 || (mDiff === 0 && now.getDate() < dob.getDate())) age--;
        if (age < 18) errors["dateOfBirth"] = "Must be at least 18 years old";
        if (age > 120) errors["dateOfBirth"] = "Enter a valid date of birth";
      }
      req("idType", "Government-issued ID type");
      req("idNumber", "ID number");
      if (str("idNumber") && str("idNumber").length < 4) errors["idNumber"] = "ID number must be at least 4 characters";
      req("countryOfIssuance", "Country of issuance");
      req("issueDate", "Issue date");
      if (str("issueDate") && !isValidDate(str("issueDate"))) errors["issueDate"] = "Enter a valid date";
      req("expirationDate", "Expiration date");
      if (str("expirationDate") && isValidDate(str("expirationDate"))) {
        if (new Date(str("expirationDate")) <= new Date()) errors["expirationDate"] = "ID has expired";
      } else if (str("expirationDate")) {
        errors["expirationDate"] = "Enter a valid date";
      }
      break;

    case "income":
      req("annualIncome", "Annual income");
      req("netWorth", "Net worth");
      req("liquidNetWorth", "Liquid net worth");
      req("taxRate", "Tax rate bracket");
      break;

    case "riskTolerance": {
      req("riskTolerance", "Risk tolerance");
      const priorities = data["strategyPriorities"] as Record<string, string> | undefined;
      if (priorities) {
        const vals = Object.values(priorities).filter(Boolean);
        const unique = new Set(vals);
        if (vals.length < 5 || unique.size < 5) {
          errors["strategyPriorities"] = "Assign a unique priority (1–5) to every strategy";
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

    case "investmentExperience": {
      const investments = data["investments"] as Record<string, { enabled: boolean; years: string; transactions: string; knowledge: string }> | undefined;
      if (investments) {
        const enabledKeys = Object.entries(investments).filter(([, row]) => row.enabled);
        if (enabledKeys.length === 0) {
          errors["investments"] = "Select at least one investment type";
        } else {
          for (const [key, row] of enabledKeys) {
            if (!row.years || !row.transactions || !row.knowledge) {
              errors["investments"] = `Complete all fields for checked investment types`;
              break;
            }
          }
        }
      } else {
        errors["investments"] = "Investment experience data is required";
      }
      break;
    }

    case "idProofUpload":
      req("idType", "ID document type");
      if (!data["frontUploaded"]) errors["frontFile"] = "Front of ID is required";
      if (!data["backUploaded"]) errors["backFile"] = "Back of ID is required";
      break;

    case "fundingDetails": {
      const sources = data["fundingSources"];
      if (!sources || !Array.isArray(sources) || (sources as unknown[]).length === 0) {
        errors["fundingSources"] = "Select at least one funding source";
      }
      req("bankName", "Bank name");
      if (str("bankName") && !isValidName(str("bankName"))) errors["bankName"] = "Bank name contains invalid characters";
      req("abaSwift", "ABA / SWIFT code");
      if (str("abaSwift") && !isValidAbaSwift(str("abaSwift"))) errors["abaSwift"] = "Enter a valid ABA (9 digits) or SWIFT code (8-11 chars)";
      req("accountName", "Account name");
      break;
    }

    case "disclosures": {
      req("taxWithholding", "Tax withholding selection");
      req("initialDeposit", "Initial deposit amount");
      if (str("initialDeposit")) {
        const cleaned = str("initialDeposit").replace(/[$,\s]/g, "");
        const num = parseFloat(cleaned);
        if (isNaN(num) || num <= 0) errors["initialDeposit"] = "Enter a valid deposit amount";
      }
      const requiredQs = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];
      for (const q of requiredQs) {
        if (!str(q)) errors[q] = "This disclosure question is required";
      }
      break;
    }

    case "signatures": {
      const consents = data["consents"] as Record<string, boolean> | undefined;
      if (consents) {
        const unconsented = Object.entries(consents).filter(([, v]) => !v);
        if (unconsented.length > 0) errors["consents"] = "All disclosure documents must be consented to";
      } else {
        errors["consents"] = "Disclosure consents are required";
      }
      if (!str("tradingPlan")) errors["tradingPlan"] = "Trading plan selection is required";
      if (!data["hasSigned"] && !str("signatureName")) {
        errors["signature"] = "Signature is required to complete your application";
      }
      if (str("signatureName") && str("signatureName").length < 2) {
        errors["signatureName"] = "Signature name must be at least 2 characters";
      }
      break;
    }

    default:
      break;
  }

  return errors;
}

async function getCompletedStepNumbers(email: string): Promise<number[]> {
  const profile = await getUserProfileData(email);
  return (profile["_completedStepNumbers"] as number[]) ?? [];
}

async function addCompletedStepNumber(email: string, stepNum: number): Promise<number[]> {
  const existing = await getCompletedStepNumbers(email);
  if (existing.includes(stepNum)) return existing;
  const updated = [...existing, stepNum].sort((a, b) => a - b);
  await setUserProfileMeta(email, "_completedStepNumbers", updated);
  return updated;
}

signupRouter.post("/signup/save-step", sensitiveEndpointLimit, validate(SignupSaveStepSchema), async (req, res) => {
  const { email, step, data } = req.body as {
    email: string;
    step: string;
    data: Record<string, unknown>;
  };

  try {
    await upsertUserStep(email, step, data);
    auditLog(email, step, "SAVE_STEP_DRAFT", { fields: Object.keys(data) });
    console.log(`[Signup] Draft saved: step=${step} email=${email} fields=${Object.keys(data).length}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[Signup] FAILED to save draft step=${step} for ${email}:`, err);
    res.status(500).json({ error: "Failed to save data. Please try again." });
  }
});

signupRouter.post("/signup/complete-step", sensitiveEndpointLimit, validate(SignupCompleteStepSchema), async (req, res) => {
  const { email, stepNumber, stepKey, data } = req.body as {
    email: string;
    stepNumber: number;
    stepKey: string;
    data: Record<string, unknown>;
  };

  try {
    const errors = validateStep(stepKey, data);
    if (Object.keys(errors).length > 0) {
      auditLog(email, stepKey, "VALIDATE_FAIL", {
        stepNumber,
        errorFields: Object.keys(errors),
      });
      res.status(422).json({ success: false, errors });
      return;
    }

    const profile = await getUserProfileData(email);
    const oldStepData = (profile[stepKey] as Record<string, unknown>) ?? {};

    if (stepKey === "signatures" && data.hasSigned) {
      if (!data.signedAt) {
        data.signedAt = new Date().toISOString();
      }
      const fwd = (req as Request).headers["x-forwarded-for"];
      const ip  = fwd
        ? String(Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim()
        : (req as Request).ip ?? "unknown";
      try {
        await insertSignatureAuditLog({
          email,
          ipAddress:      ip,
          userAgent:      String((req as Request).headers["user-agent"] ?? ""),
          signatureImage: (data.signatureImage as string) || null,
        });
      } catch (auditErr) {
        console.error("[Signup] Failed to write signature audit log:", auditErr);
      }
    }

    await upsertUserStep(email, stepKey, data);

    if (stepKey === "personal") {
      try {
        const existingProfile = await getUserProfileData(email);
        const currentSettings = (existingProfile["_settings"] as Record<string, unknown>) ?? {};
        const merged = {
          ...currentSettings,
          ...(data.firstName  ? { firstName: data.firstName }   : {}),
          ...(data.lastName   ? { lastName:  data.lastName }    : {}),
          ...(data.phoneNumber? { phone:     data.phoneNumber } : {}),
          ...(data.country    ? { country:   data.country }     : {}),
          ...(data.state      ? { state:     data.state }       : {}),
          ...(data.city       ? { city:      data.city }        : {}),
        };
        await setUserProfileMeta(email, "_settings", merged);
      } catch (syncErr) {
        console.error("[Signup] Failed to sync personal data to profile settings:", syncErr);
      }
    }

    const completedSteps = await addCompletedStepNumber(email, stepNumber);

    if (stepKey === "general" && stepNumber === 1) {
      try {
        const fwd = (req as Request).headers["x-forwarded-for"];
        const ip  = fwd
          ? String(Array.isArray(fwd) ? fwd[0] : fwd).split(",")[0].trim()
          : (req as Request).ip ?? "unknown";
        await getPool().query(
          `INSERT INTO registration_log (email, product, registration_type, ip_address)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [
            email,
            (data.product as string) ?? null,
            (data.registrationType as string) ?? null,
            ip,
          ]
        );
        console.log(`[Signup] Registration logged for ${email}`);
      } catch (regErr) {
        console.error("[Signup] Failed to write registration log:", regErr);
      }
    }

    if (completedSteps.length >= 12) {
      try {
        await setUserStatus(email, "reviewing");
        console.log(`[Signup] Application complete – status set to reviewing for ${email}`);
      } catch (statusErr) {
        console.error("[Signup] Failed to set reviewing status:", statusErr);
      }
    }

    const diff = computeAuditDiff(stepKey, oldStepData, data);
    await appendAuditLog(email, diff);

    auditLog(email, stepKey, "COMPLETE_STEP", {
      stepNumber,
      changedFields: diff.length,
      completedSteps,
    });
    console.log(`[Signup] Step completed: step=${stepKey} (#${stepNumber}) email=${email} total=${completedSteps.length}/12`);

    res.json({ success: true, completedSteps });
  } catch (err) {
    console.error(`[Signup] FAILED to complete step=${stepKey} (#${stepNumber}) for ${email}:`, err);
    auditLog(email, stepKey, "COMPLETE_STEP_ERROR", { error: String(err) });
    res.status(500).json({ error: "Failed to complete step. Please try again." });
  }
});

signupRouter.get("/signup/get-progress", sensitiveEndpointLimit, validate(SignupGetProgressSchema), async (req, res) => {
  const { email } = (req as unknown as { validatedQuery: { email: string } }).validatedQuery;

  try {
    const profile = await getUserProfileData(email);
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

    const completedStepNumbers = (profile["_completedStepNumbers"] as number[]) ?? [];

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
