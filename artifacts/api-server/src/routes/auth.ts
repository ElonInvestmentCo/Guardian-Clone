import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mailer.js";
import { saveUserCredentials, getStoredPasswordHash, getUserData } from "../lib/userDataStore.js";
import { sensitiveEndpointLimit } from "../middleware/security.js";

const authRouter = Router();

interface VerificationRecord {
  code: string;
  expires: number;
  attempts: number;
  createdAt: number;
}

const verificationCodes = new Map<string, VerificationRecord>();
const resetCodes = new Map<string, VerificationRecord>();

const BCRYPT_ROUNDS = 12;
const MAX_VERIFY_ATTEMPTS = 5;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }
  const legacyHash = legacySimpleHash(password);
  return legacyHash === storedHash;
}

function legacySimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function generateCode(): string {
  const bytes = crypto.randomBytes(3);
  const num = (bytes.readUIntBE(0, 3) % 900000) + 100000;
  return String(num);
}

function logAttempt(action: string, email: string, detail?: string) {
  const ts = new Date().toISOString();
  console.log(`[Auth][${ts}] ${action} — email=${email}${detail ? ` ${detail}` : ""}`);
}

authRouter.post("/auth/register", sensitiveEndpointLimit, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    const hash = await hashPassword(password);
    saveUserCredentials(email, hash);
    logAttempt("REGISTER", email, "success — credentials persisted to disk");
    res.json({ success: true });
  } catch (err) {
    console.error(`[Auth] REGISTER error:`, err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

authRouter.post("/auth/login", sensitiveEndpointLimit, async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const storedHash = getStoredPasswordHash(email);
    if (!storedHash) {
      await bcrypt.hash("dummy", BCRYPT_ROUNDS);
      logAttempt("LOGIN", email, "failed — no credentials found");
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      logAttempt("LOGIN", email, "failed — invalid credentials");
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!storedHash.startsWith("$2")) {
      const newHash = await hashPassword(password);
      saveUserCredentials(email, newHash);
      logAttempt("LOGIN", email, "migrated legacy hash to bcrypt");
    }

    logAttempt("LOGIN", email, "success");
    res.json({ success: true, email });
  } catch (err) {
    console.error("[Auth] LOGIN error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

authRouter.post("/auth/send-verification", sensitiveEndpointLimit, async (req, res) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const key = email.toLowerCase();
    const code = generateCode();
    const now = Date.now();

    verificationCodes.set(key, {
      code,
      expires: now + 10 * 60 * 1000,
      attempts: 0,
      createdAt: now,
    });

    logAttempt("SEND_VERIFICATION", email, "code generated, expires_in=10min");

    const mailResult = await sendVerificationEmail(email, code);

    if (!mailResult.success) {
      const reason = mailResult.error ?? "unknown error";
      logAttempt("SEND_VERIFICATION", email, `email delivery failed: ${reason}`);
      console.error(`[Auth] Resend failure for ${email}: ${reason}`);
      res.status(500).json({
        error: "Failed to send verification email. Please try again or contact support.",
        detail: process.env.NODE_ENV === "development" ? reason : undefined,
      });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] SEND_VERIFICATION error:", err);
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
  }
});

authRouter.post("/auth/verify-code", sensitiveEndpointLimit, (req, res) => {
  try {
    const { email, code } = req.body as { email?: string; code?: string };

    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    const key = email.toLowerCase();
    const record = verificationCodes.get(key);

    if (!record) {
      logAttempt("VERIFY_CODE", email, "failed — no code on record");
      res.status(400).json({ error: "No verification code found for this email. Please request a new one." });
      return;
    }

    if (Date.now() > record.expires) {
      verificationCodes.delete(key);
      logAttempt("VERIFY_CODE", email, "failed — code expired");
      res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      return;
    }

    record.attempts += 1;

    if (record.attempts > MAX_VERIFY_ATTEMPTS) {
      verificationCodes.delete(key);
      logAttempt("VERIFY_CODE", email, `failed — too many attempts (${record.attempts})`);
      res.status(400).json({ error: "Too many failed attempts. Please request a new verification code." });
      return;
    }

    if (record.code !== code.trim()) {
      logAttempt("VERIFY_CODE", email, `failed — wrong code (attempt ${record.attempts}/${MAX_VERIFY_ATTEMPTS})`);
      res.status(400).json({ error: "Invalid verification code. Please try again." });
      return;
    }

    verificationCodes.delete(key);
    logAttempt("VERIFY_CODE", email, "success");
    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] VERIFY_CODE error:", err);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

authRouter.post("/auth/send-reset-code", sensitiveEndpointLimit, async (req, res) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const user = getUserData(email);
    if (!user) {
      res.json({ success: true });
      return;
    }

    const code = generateCode();
    const now = Date.now();

    resetCodes.set(email.toLowerCase(), {
      code,
      expires: now + 10 * 60 * 1000,
      attempts: 0,
      createdAt: now,
    });

    logAttempt("SEND_RESET_CODE", email, "code generated, expires_in=10min");

    const mailResult = await sendPasswordResetEmail(email, code);

    if (!mailResult.success) {
      const reason = mailResult.error ?? "unknown error";
      logAttempt("SEND_RESET_CODE", email, `email delivery failed: ${reason}`);
      console.error(`[Auth] Resend failure for reset email to ${email}: ${reason}`);
      res.status(500).json({ error: "Failed to send reset email. Please try again." });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] SEND_RESET_CODE error:", err);
    res.status(500).json({ error: "Failed to send reset email. Please try again." });
  }
});

authRouter.post("/auth/reset-password", sensitiveEndpointLimit, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body as { email?: string; code?: string; newPassword?: string };

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: "Email, code and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const key = email.toLowerCase();
    const record = resetCodes.get(key);

    if (!record) {
      logAttempt("RESET_PASSWORD", email, "failed — no code on record");
      res.status(400).json({ error: "No reset code found. Please request a new one." });
      return;
    }

    if (Date.now() > record.expires) {
      resetCodes.delete(key);
      logAttempt("RESET_PASSWORD", email, "failed — code expired");
      res.status(400).json({ error: "Reset code has expired. Please request a new one." });
      return;
    }

    record.attempts += 1;

    if (record.attempts > MAX_VERIFY_ATTEMPTS) {
      resetCodes.delete(key);
      logAttempt("RESET_PASSWORD", email, `failed — too many attempts (${record.attempts})`);
      res.status(400).json({ error: "Too many failed attempts. Please request a new reset code." });
      return;
    }

    if (record.code !== code.trim()) {
      logAttempt("RESET_PASSWORD", email, `failed — wrong code (attempt ${record.attempts}/${MAX_VERIFY_ATTEMPTS})`);
      res.status(400).json({ error: "Invalid reset code. Please try again." });
      return;
    }

    resetCodes.delete(key);

    const hash = await hashPassword(newPassword);
    saveUserCredentials(email, hash);

    logAttempt("RESET_PASSWORD", email, "success — new password saved");
    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] RESET_PASSWORD error:", err);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

export default authRouter;
