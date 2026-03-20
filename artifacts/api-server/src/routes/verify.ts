import { Router } from "express";
import { setUserStatus, getUserData } from "../lib/userDataStore.js";
import { sendAccountVerifiedEmail } from "../lib/mailer.js";

const verifyRouter = Router();

/**
 * POST /api/signup/verify
 * Mark a user's application as verified and send the confirmation email.
 */
verifyRouter.post("/signup/verify", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  try {
    // Persist verified status
    setUserStatus(email, "verified");

    // Fire-and-forget email (don't block the response)
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

/**
 * GET /api/signup/status?email=...
 * Return the current application status for a user.
 */
verifyRouter.get("/signup/status", (req, res) => {
  const email = req.query["email"] as string | undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const user = getUserData(email);
  if (!user) {
    res.json({ status: "not_found" });
    return;
  }

  res.json({
    status: (user["status"] as string) ?? "pending",
    verifiedAt: user["verifiedAt"] ?? null,
  });
});

export default verifyRouter;
