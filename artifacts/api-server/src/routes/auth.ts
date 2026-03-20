import { Router } from "express";
import { sendVerificationEmail } from "../lib/mailer.js";
import { saveUserCredentials, getStoredPasswordHash } from "../lib/userDataStore.js";

const authRouter = Router();

interface VerificationRecord {
  code: string;
  expires: number;
  attempts: number;
  createdAt: number;
}

interface UserRecord {
  passwordHash: string;
  createdAt: number;
}

const verificationCodes = new Map<string, VerificationRecord>();
const registeredUsers = new Map<string, UserRecord>();

const MAX_VERIFY_ATTEMPTS = 5;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function logAttempt(action: string, email: string, detail?: string) {
  const ts = new Date().toISOString();
  console.log(`[Auth][${ts}] ${action} — email=${email}${detail ? ` ${detail}` : ""}`);
}

authRouter.post("/auth/register", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const key = email.toLowerCase();
  const hash = simpleHash(password);
  registeredUsers.set(key, {
    passwordHash: hash,
    createdAt: Date.now(),
  });
  // Also persist to disk so login survives server restarts
  saveUserCredentials(email, hash);
  logAttempt("REGISTER", email, "success");
  res.json({ success: true });
});

authRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const hash = simpleHash(password);
  const key = email.toLowerCase();

  // Check in-memory first (fast path for current session)
  const memUser = registeredUsers.get(key);
  if (memUser) {
    if (memUser.passwordHash !== hash) {
      logAttempt("LOGIN", email, "failed — invalid credentials");
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    logAttempt("LOGIN", email, "success (memory)");
    res.json({ success: true, email });
    return;
  }

  // Fall back to persistent store (survives server restarts)
  const storedHash = getStoredPasswordHash(email);
  if (!storedHash || storedHash !== hash) {
    logAttempt("LOGIN", email, "failed — invalid credentials");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Re-populate memory cache for this session
  registeredUsers.set(key, { passwordHash: storedHash, createdAt: Date.now() });

  logAttempt("LOGIN", email, "success (disk)");
  res.json({ success: true, email });
});

authRouter.post("/auth/send-verification", async (req, res) => {
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

  logAttempt("SEND_VERIFICATION", email, `code=${code} expires_in=10min`);

  const mailResult = await sendVerificationEmail(email, code);

  if (!mailResult.success) {
    logAttempt("SEND_VERIFICATION", email, `email delivery failed: ${mailResult.error ?? "unknown"}`);
    res.status(500).json({ error: "Failed to send verification email. Please try again." });
    return;
  }

  res.json({ success: true });
});

authRouter.post("/auth/verify-code", (req, res) => {
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
});

export default authRouter;
