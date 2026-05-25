import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/mailer.js";
import { saveUserCredentials, getStoredPasswordHash, getUserData, addAdminNotification, getCompletedStepNumbers, getProfilePicture, getUserProfileData } from "../lib/userDataStore.js";
import { sensitiveEndpointLimit, checkEmailLimit } from "../middleware/security.js";
import { validate, AuthLoginSchema, AuthRegisterSchema, AuthCheckEmailSchema, AuthSendVerificationSchema, AuthVerifyCodeSchema, AuthResetPasswordSchema } from "../lib/validation.js";
import { logSecurity } from "../lib/securityLogger.js";
import { query } from "../lib/db.js";
import { broadcastAdmin } from "../lib/realtime.js";
import { notifyNewUser } from "../lib/adminNotifier.js";

const JWT_EXPIRY = "7d";
const COOKIE_NAME = "guardian_session";

function getUserJwtSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.ADMIN_JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("[Auth] SESSION_SECRET is required in production");
  }
  return secret ?? "guardian-user-dev-secret-fallback-v1";
}

function setSessionCookie(res: import("express").Response, token: string): void {
  const IS_PROD = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

async function buildUserMePayload(email: string): Promise<Record<string, unknown> | null> {
  const userData = await getUserData(email);
  if (!userData) return null;

  const [completedSteps, profilePic, profile] = await Promise.all([
    getCompletedStepNumbers(email),
    getProfilePicture(email),
    getUserProfileData(email),
  ]);

  const status = (userData["status"] as string) ?? "pending";
  const totalSteps = 12;
  const kycComplete = completedSteps.length >= totalSteps;

  const settings = (profile["_settings"] as Record<string, unknown>) ?? {};
  const personalStep = (profile["personal"] as Record<string, unknown>) ?? {};
  const notifPrefs = (profile["_notificationPreferences"] as Record<string, unknown>) ?? {};
  const twoFAData = (profile["_2fa"] as Record<string, unknown>) ?? {};

  const str = (key: string, fallbackKey?: string): string =>
    (settings[key] as string) || (fallbackKey ? (personalStep[fallbackKey] as string) : "") || "";

  return {
    email,
    status,
    kycComplete,
    completedSteps,
    totalSteps,
    profilePicture: profilePic,
    role: (userData["role"] as string) ?? "user",
    settings: {
      firstName: str("firstName", "firstName"),
      lastName: str("lastName", "lastName"),
      phone: str("phone", "phoneNumber"),
      country: str("country", "country"),
      state: str("state", "state"),
      city: str("city", "city"),
    },
    notificationPreferences: {
      tradeConfirmations: (notifPrefs["tradeConfirmations"] as boolean) ?? true,
      priceAlerts: (notifPrefs["priceAlerts"] as boolean) ?? true,
      orderFills: (notifPrefs["orderFills"] as boolean) ?? true,
      marketOpen: (notifPrefs["marketOpen"] as boolean) ?? false,
      marketClose: (notifPrefs["marketClose"] as boolean) ?? false,
      weeklyReport: (notifPrefs["weeklyReport"] as boolean) ?? true,
      promotions: (notifPrefs["promotions"] as boolean) ?? false,
      securityAlerts: (notifPrefs["securityAlerts"] as boolean) ?? true,
    },
    twoFAEnabled: (twoFAData["enabled"] as boolean) ?? false,
  };
}

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

authRouter.post("/auth/check-email", checkEmailLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    console.log(`[Auth][CHECK_EMAIL] Lookup — email=${email}`);
    const existing = await getUserData(email);
    const available = !existing;
    console.log(`[Auth][CHECK_EMAIL] Result — email=${email} available=${available}`);
    res.json({ success: true, available, error: null });
  } catch (err) {
    console.error("[Auth][CHECK_EMAIL] DB error:", err);
    res.status(500).json({ success: false, available: null, error: "Email check failed. Please try again." });
  }
});

authRouter.post("/auth/register", sensitiveEndpointLimit, validate(AuthRegisterSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const existing = await getUserData(email);
    if (existing) {
      logAttempt("REGISTER", email, "rejected — email already registered");
      res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
      return;
    }
    const hash = await hashPassword(password);
    await saveUserCredentials(email, hash);

    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
    const registeredAt = new Date();
    const formattedAt = new Intl.DateTimeFormat("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(registeredAt);

    try {
      await query(
        `INSERT INTO registration_log (email, ip_address, registered_at) VALUES ($1, $2, $3)`,
        [email, ipAddress, registeredAt.toISOString()]
      );
    } catch (dbErr) {
      console.error("[Auth] registration_log insert failed:", dbErr);
    }

    broadcastAdmin({
      type: "NEW_USER_REGISTRATION",
      data: {
        email,
        registeredAt: registeredAt.toISOString(),
        formattedAt,
        ipAddress,
      },
    });

    notifyNewUser({ email, ipAddress, registeredAt: registeredAt.toISOString() }).catch(() => {});

    addAdminNotification({
      type: "registration",
      title: "New User Registered",
      message: `${email} created an account at ${formattedAt}.`,
      userEmail: email,
      meta: { ipAddress, registeredAt: registeredAt.toISOString() },
    }).catch(() => {});

    logAttempt("REGISTER", email, "success — credentials persisted to database");
    res.json({ success: true });
  } catch (err) {
    console.error(`[Auth] REGISTER error:`, err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

authRouter.post("/auth/login", sensitiveEndpointLimit, validate(AuthLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const storedHash = await getStoredPasswordHash(email);
    if (!storedHash) {
      await bcrypt.hash("dummy", BCRYPT_ROUNDS);
      logAttempt("LOGIN", email, "failed — no credentials found");
      logSecurity("AUTH_FAIL", req, "no credentials found", email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, storedHash);
    if (!valid) {
      logAttempt("LOGIN", email, "failed — invalid credentials");
      logSecurity("AUTH_FAIL", req, "invalid credentials", email);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!storedHash.startsWith("$2")) {
      const newHash = await hashPassword(password);
      await saveUserCredentials(email, newHash);
      logAttempt("LOGIN", email, "migrated legacy hash to bcrypt");
    }

    logAttempt("LOGIN", email, "success");

    const secret = getUserJwtSecret();
    const token = jwt.sign(
      { email, iss: "guardian-user", iat: Math.floor(Date.now() / 1000) },
      secret,
      { expiresIn: JWT_EXPIRY },
    );
    setSessionCookie(res, token);

    res.json({ success: true, email });
  } catch (err) {
    console.error("[Auth] LOGIN error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

authRouter.get("/auth/me", async (req, res) => {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[COOKIE_NAME];

    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const secret = getUserJwtSecret();
    let payload: { email?: string; iss?: string };
    try {
      payload = jwt.verify(token, secret) as { email?: string; iss?: string };
    } catch {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.status(401).json({ error: "Session expired. Please log in again." });
      return;
    }

    if (payload.iss === "guardian-admin" || !payload.email) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userPayload = await buildUserMePayload(payload.email);
    if (!userPayload) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json(userPayload);
  } catch (err) {
    console.error("[Auth] ME error:", err);
    res.status(500).json({ error: "Failed to load user session" });
  }
});

authRouter.post("/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  logAttempt("LOGOUT", "unknown", "session cookie cleared");
  res.json({ success: true });
});

authRouter.post("/auth/send-verification", sensitiveEndpointLimit, validate(AuthSendVerificationSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password?: string };

    const existingUser = await getUserData(email);
    if (existingUser) {
      logAttempt("SEND_VERIFICATION", email, "rejected — email already registered");
      res.status(409).json({ error: "An account with this email already exists. Please log in instead." });
      return;
    }

    if (password) {
      const hash = await hashPassword(password);
      await query(
        `INSERT INTO pending_registrations (email, password_hash, created_at, expires_at)
         VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour')
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               created_at    = NOW(),
               expires_at    = NOW() + INTERVAL '1 hour'`,
        [email.toLowerCase(), hash]
      );
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

      // In development without email configured: auto-register and skip verification
      if (process.env.NODE_ENV !== "production" && reason.includes("RESEND_API_KEY")) {
        console.warn(`[Auth] Email not configured — auto-registering ${email} without verification (dev mode)`);
        const pending = await query(
          `SELECT password_hash FROM pending_registrations WHERE email = $1 AND expires_at > NOW()`,
          [email.toLowerCase()]
        );
        if (pending.rows.length > 0) {
          const existingUser = await getUserData(email);
          if (!existingUser) {
            const hash = pending.rows[0].password_hash as string;
            await saveUserCredentials(email, hash);
            logAttempt("SEND_VERIFICATION", email, "auto-registered (email service not configured)");
          }
          await query(`DELETE FROM pending_registrations WHERE email = $1`, [email.toLowerCase()]);
        }
        res.json({ success: true, emailSkipped: true });
        return;
      }

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

authRouter.post("/auth/verify-code", sensitiveEndpointLimit, validate(AuthVerifyCodeSchema), async (req, res) => {
  try {
    const { email, code } = req.body as { email: string; code: string };

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

    const pending = await query(
      `SELECT password_hash FROM pending_registrations WHERE email = $1 AND expires_at > NOW()`,
      [key]
    );
    if (pending.rows.length > 0) {
      const existingUser = await getUserData(email);
      if (!existingUser) {
        const hash = pending.rows[0].password_hash as string;
        await saveUserCredentials(email, hash);
        logAttempt("VERIFY_CODE", email, "auto-registered from pending_registrations");
      }
      await query(`DELETE FROM pending_registrations WHERE email = $1`, [key]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] VERIFY_CODE error:", err);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

authRouter.post("/auth/send-reset-code", sensitiveEndpointLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  try {
    const { email } = req.body as { email: string };

    const user = await getUserData(email);
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

authRouter.post("/auth/reset-password", sensitiveEndpointLimit, validate(AuthResetPasswordSchema), async (req, res) => {
  try {
    const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };

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
    await saveUserCredentials(email, hash);

    logAttempt("RESET_PASSWORD", email, "success — new password saved");
    res.json({ success: true });
  } catch (err) {
    console.error("[Auth] RESET_PASSWORD error:", err);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

export default authRouter;
