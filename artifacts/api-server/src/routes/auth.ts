import { Router } from "express";

const authRouter = Router();

const verificationCodes = new Map<string, { code: string; expires: number }>();

authRouter.post("/auth/send-verification", (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  const code = String(Math.floor(100 + Math.random() * 900));
  const expires = Date.now() + 10 * 60 * 1000;

  verificationCodes.set(email.toLowerCase(), { code, expires });

  console.log(`[Auth] Verification code for ${email}: ${code}`);

  res.json({ success: true, code });
});

authRouter.post("/auth/verify-code", (req, res) => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email || !code) {
    res.status(400).json({ error: "Email and code are required" });
    return;
  }

  const record = verificationCodes.get(email.toLowerCase());

  if (!record) {
    res.status(400).json({ error: "No verification code found for this email" });
    return;
  }

  if (Date.now() > record.expires) {
    verificationCodes.delete(email.toLowerCase());
    res.status(400).json({ error: "Verification code has expired" });
    return;
  }

  if (record.code !== code.trim()) {
    res.status(400).json({ error: "Invalid verification code" });
    return;
  }

  verificationCodes.delete(email.toLowerCase());
  res.json({ success: true });
});

export default authRouter;
