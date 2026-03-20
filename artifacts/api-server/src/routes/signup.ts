import { Router } from "express";
import { upsertUserStep } from "../lib/userDataStore.js";

const signupRouter = Router();

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
    res.json({ success: true });
  } catch (err) {
    console.error("[signup/save-step] Error saving user data:", err);
    res.status(500).json({ error: "Failed to save data" });
  }
});

export default signupRouter;
