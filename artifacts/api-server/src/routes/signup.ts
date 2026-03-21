import { Router } from "express";
import { upsertUserStep, getUserData } from "../lib/userDataStore.js";

const signupRouter = Router();

function auditLog(
  email: string,
  step: string,
  action: string,
  meta?: Record<string, unknown>
): void {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`[Audit][${ts}] action=${action} step=${step} email=${email}${metaStr}`);
}

const ONBOARDING_STEPS = [
  "general",
  "personal",
  "professional",
  "idInformation",
  "income",
  "riskTolerance",
  "financial",
  "investmentExperience",
  "idProofUpload",
  "funding",
  "disclosures",
  "signatures",
];

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
    auditLog(email, step, "SAVE_STEP", { fields: Object.keys(data) });
    res.json({ success: true });
  } catch (err) {
    console.error("[signup/save-step] Error saving user data:", err);
    auditLog(email, step, "SAVE_STEP_ERROR", { error: String(err) });
    res.status(500).json({ error: "Failed to save data" });
  }
});

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
    const data = getUserData(email);
    if (!data) {
      res.json({ steps: {}, completedSteps: [] });
      return;
    }

    const steps: Record<string, unknown> = {};
    const completedSteps: string[] = [];

    for (const key of ONBOARDING_STEPS) {
      if (data[key] !== undefined) {
        steps[key] = data[key];
        completedSteps.push(key);
      }
    }

    auditLog(email, "all", "GET_PROGRESS", { completedSteps });
    res.json({ steps, completedSteps });
  } catch (err) {
    console.error("[signup/get-progress] Error:", err);
    res.status(500).json({ error: "Failed to retrieve progress" });
  }
});

export default signupRouter;
