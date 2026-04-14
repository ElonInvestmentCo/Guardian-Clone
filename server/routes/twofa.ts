import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import qrcode from "qrcode";
import { generateSecret, generateURI, verifySync } from "otplib";
import {
  getUserProfileData,
  setUserProfileMeta,
  getStoredPasswordHash,
} from "../lib/userDataStore.js";
import { sensitiveEndpointLimit } from "../middleware/security.js";
import { validate, AuthCheckEmailSchema, TwoFATokenSchema, TwoFADisableSchema } from "../lib/validation.js";

const twoFARouter = Router();

function legacySimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }
  return legacySimpleHash(password) === storedHash;
}

async function get2FAData(email: string): Promise<{ enabled: boolean; secret?: string; backupCodes?: string[] }> {
  try {
    const profile = await getUserProfileData(email);
    const data = profile["_2fa"] as { enabled?: boolean; secret?: string; backupCodes?: string[] } | undefined;
    return {
      enabled: data?.enabled ?? false,
      secret: data?.secret,
      backupCodes: data?.backupCodes ?? [],
    };
  } catch {
    return { enabled: false };
  }
}

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(4);
    const code = bytes.readUInt32BE(0).toString(36).toUpperCase().padStart(7, "0");
    codes.push(code.slice(0, 4) + "-" + code.slice(4, 7));
  }
  return codes;
}

twoFARouter.get("/user/2fa/status", sensitiveEndpointLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  try {
    const { email } = (req as unknown as { validatedQuery: { email: string } }).validatedQuery;
    const data = await get2FAData(email);
    res.json({ enabled: data.enabled });
  } catch (err) {
    console.error("[2FA] status error:", err);
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
});

twoFARouter.post("/user/2fa/setup", sensitiveEndpointLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  try {
    const { email } = req.body as { email: string };

    const existing = await get2FAData(email);
    if (existing.enabled) {
      res.status(400).json({ error: "2FA is already enabled. Disable it first to set up again." });
      return;
    }

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: "Guardian Trading", label: email, secret });
    const qrDataUrl = await qrcode.toDataURL(otpauth);

    await setUserProfileMeta(email, "_2faPending", { secret, createdAt: new Date().toISOString() });

    res.json({ secret, qrDataUrl, otpauth });
  } catch (err) {
    console.error("[2FA] setup error:", err);
    res.status(500).json({ error: "Failed to set up 2FA" });
  }
});

twoFARouter.post("/user/2fa/enable", sensitiveEndpointLimit, validate(TwoFATokenSchema), async (req, res) => {
  try {
    const { email, token } = req.body as { email: string; token: string };

    const profile = await getUserProfileData(email);
    const pending = profile["_2faPending"] as { secret?: string } | undefined;

    if (!pending?.secret) {
      res.status(400).json({ error: "No 2FA setup in progress. Please start setup first." });
      return;
    }

    const result = verifySync({ token, secret: pending.secret });
    if (!result.valid) {
      res.status(401).json({ error: "Invalid OTP code. Please check your authenticator app and try again." });
      return;
    }

    const backupCodes = generateBackupCodes(8);
    const hashedCodes = backupCodes.map((c) => crypto.createHash("sha256").update(c).digest("hex"));

    await setUserProfileMeta(email, "_2fa", {
      enabled: true,
      secret: pending.secret,
      backupCodes: hashedCodes,
      enabledAt: new Date().toISOString(),
    });
    await setUserProfileMeta(email, "_2faPending", null);

    res.json({ success: true, backupCodes });
  } catch (err) {
    console.error("[2FA] enable error:", err);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});

twoFARouter.post("/user/2fa/disable", sensitiveEndpointLimit, validate(TwoFADisableSchema), async (req, res) => {
  try {
    const { email, password, token } = req.body as { email: string; password: string; token: string };

    const storedHash = await getStoredPasswordHash(email);
    if (!storedHash) {
      res.status(404).json({ error: "User credentials not found" });
      return;
    }

    const passwordValid = await verifyPassword(password, storedHash);
    if (!passwordValid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    const data = await get2FAData(email);
    if (!data.enabled || !data.secret) {
      res.status(400).json({ error: "2FA is not currently enabled" });
      return;
    }

    const tokenResult = verifySync({ token, secret: data.secret });
    if (!tokenResult.valid) {
      res.status(401).json({ error: "Invalid OTP code" });
      return;
    }

    await setUserProfileMeta(email, "_2fa", { enabled: false, disabledAt: new Date().toISOString() });

    res.json({ success: true });
  } catch (err) {
    console.error("[2FA] disable error:", err);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

twoFARouter.post("/user/2fa/verify", sensitiveEndpointLimit, validate(TwoFATokenSchema), async (req, res) => {
  try {
    const { email, token } = req.body as { email: string; token: string };

    const data = await get2FAData(email);
    if (!data.enabled || !data.secret) {
      res.status(400).json({ error: "2FA is not enabled for this account" });
      return;
    }

    if (token.includes("-")) {
      const hashed = crypto.createHash("sha256").update(token.toUpperCase()).digest("hex");
      const backupCodes = data.backupCodes ?? [];
      const idx = backupCodes.indexOf(hashed);
      if (idx === -1) {
        res.status(401).json({ error: "Invalid backup code" });
        return;
      }
      const remaining = [...backupCodes];
      remaining.splice(idx, 1);
      const profile = await getUserProfileData(email);
      const twoFAData = (profile["_2fa"] as Record<string, unknown>) ?? {};
      await setUserProfileMeta(email, "_2fa", { ...twoFAData, backupCodes: remaining });
      res.json({ success: true, backupCodesRemaining: remaining.length });
      return;
    }

    const verifyResult = verifySync({ token, secret: data.secret });
    if (!verifyResult.valid) {
      res.status(401).json({ error: "Invalid or expired OTP code" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[2FA] verify error:", err);
    res.status(500).json({ error: "Failed to verify 2FA token" });
  }
});

export default twoFARouter;
