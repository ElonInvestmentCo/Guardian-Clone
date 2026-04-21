import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import {
  getUserData,
  getCompletedStepNumbers,
  setProfilePicture,
  getProfilePicture,
  getUserProfileData,
  setUserProfileMeta,
  getStoredPasswordHash,
  saveUserCredentials,
  getUserBalance,
  addAdminNotification,
  addNotification,
} from "../lib/userDataStore.js";
import { getPool } from "../lib/db.js";
import { userDataLimit, sensitiveEndpointLimit } from "../middleware/security.js";
import { validate, ProfileUpdateSchema, ChangePasswordSchema, NotificationPrefsSchema, AuthCheckEmailSchema, KycResubmitSchema, FundRequestSchema } from "../lib/validation.js";

const BCRYPT_ROUNDS = 12;

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

const profileRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp files are allowed"));
    }
  },
});

profileRouter.get("/user/me", userDataLimit, validate(AuthCheckEmailSchema), async (req, res) => {
  try {
    const { email } = (req as unknown as { validatedQuery: { email: string } }).validatedQuery;

    const userData = await getUserData(email);
    if (!userData) {
      res.json({
        status: "not_found",
        kycComplete: false,
        completedSteps: [],
      });
      return;
    }

    const completedSteps = await getCompletedStepNumbers(email);
    const status = (userData["status"] as string) ?? "pending";
    const totalSteps = 12;
    const kycComplete = completedSteps.length >= totalSteps;
    const profilePic = await getProfilePicture(email);

    const profile = await getUserProfileData(email);
    const settings = (profile["_settings"] as Record<string, unknown>) ?? {};
    const personalStep = (profile["personal"] as Record<string, unknown>) ?? {};
    const notifPrefs = (profile["_notificationPreferences"] as Record<string, unknown>) ?? {};
    const twoFAData = (profile["_2fa"] as Record<string, unknown>) ?? {};

    const str = (key: string, fallbackKey?: string): string =>
      (settings[key] as string) || (fallbackKey ? (personalStep[fallbackKey] as string) : "") || "";

    res.json({
      status,
      kycComplete,
      completedSteps,
      totalSteps,
      profilePicture: profilePic,
      role: (userData["role"] as string) ?? "user",
      settings: {
        firstName: str("firstName", "firstName"),
        lastName:  str("lastName",  "lastName"),
        phone:     str("phone",     "phoneNumber"),
        country:   str("country",   "country"),
        state:     str("state",     "state"),
        city:      str("city",      "city"),
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
    });
  } catch (err) {
    console.error("[Profile] /user/me error:", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

profileRouter.post(
  "/user/profile-picture",
  upload.single("picture"),
  async (req, res) => {
    try {
      const email = (req.body as Record<string, string>)["email"];
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !req.file) {
        res.status(400).json({ error: "Valid email and picture are required" });
        return;
      }
      const ext = path.extname(req.file.originalname) || ".jpg";
      const sanitized = email.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${sanitized}_${Date.now()}${ext}`;

      const pool = getPool();
      await pool.query(
        `INSERT INTO user_documents (email, role, filename, mimetype, file_data, created_at)
         VALUES ($1, 'profile_picture', $2, $3, $4, NOW())
         ON CONFLICT (email, role) DO UPDATE SET filename = $2, mimetype = $3, file_data = $4, created_at = NOW()`,
        [email, filename, req.file.mimetype, req.file.buffer]
      );

      await setProfilePicture(email, filename);
      res.json({ success: true, filename });
    } catch (err) {
      console.error("[Profile] profile-picture upload error:", err);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

profileRouter.get("/user/profile-picture/:filename", async (req, res) => {
  try {
    const safeName = path.basename(req.params["filename"]!);
    const pool = getPool();
    const result = await pool.query(
      `SELECT file_data, mimetype FROM user_documents WHERE filename = $1 AND role = 'profile_picture'`,
      [safeName]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.setHeader("Content-Type", result.rows[0].mimetype || "image/jpeg");
    res.send(result.rows[0].file_data);
  } catch (err) {
    console.error("[Profile] profile-picture serve error:", err);
    res.status(500).json({ error: "Failed to load profile picture" });
  }
});

profileRouter.delete("/user/profile-picture", userDataLimit, async (req, res) => {
  try {
    const email = req.query["email"] as string | undefined;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    const pool = getPool();
    await pool.query(`DELETE FROM user_documents WHERE email = $1 AND role = 'profile_picture'`, [email]);
    await setProfilePicture(email, "");
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] profile-picture delete error:", err);
    res.status(500).json({ error: "Failed to delete profile picture" });
  }
});

profileRouter.post("/user/update-profile", userDataLimit, validate(ProfileUpdateSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, phone, country, state, city } = req.body as Record<string, string>;

    const profile = await getUserProfileData(email);
    if (!profile["email"]) { res.status(404).json({ error: "User not found" }); return; }

    const settings = (profile["_settings"] as Record<string, unknown>) ?? {};
    if (firstName !== undefined) settings["firstName"] = firstName.trim();
    if (lastName !== undefined) settings["lastName"] = lastName.trim();
    if (phone !== undefined) settings["phone"] = phone.trim();
    if (country !== undefined) settings["country"] = country.trim();
    if (state !== undefined) settings["state"] = state.trim();
    if (city !== undefined) settings["city"] = city.trim();
    settings["updatedAt"] = new Date().toISOString();
    await setUserProfileMeta(email, "_settings", settings);

    const personalStep = (profile["personal"] as Record<string, unknown>) ?? {};
    const updatedPersonal = {
      ...personalStep,
      ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
      ...(lastName  !== undefined ? { lastName:  lastName.trim()  } : {}),
      ...(phone     !== undefined ? { phoneNumber: phone.trim()   } : {}),
      ...(country   !== undefined ? { country:   country.trim()   } : {}),
      ...(state     !== undefined ? { state:     state.trim()     } : {}),
      ...(city      !== undefined ? { city:      city.trim()      } : {}),
    };
    await setUserProfileMeta(email, "personal", updatedPersonal);

    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] update-profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

profileRouter.post("/user/change-password", sensitiveEndpointLimit, validate(ChangePasswordSchema), async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body as Record<string, string>;
    const storedHash = await getStoredPasswordHash(email);
    if (!storedHash) {
      res.status(404).json({ error: "No credentials found for this user" });
      return;
    }
    const valid = await verifyPassword(currentPassword, storedHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await saveUserCredentials(email, newHash);
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] change-password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

profileRouter.post("/user/update-notifications", userDataLimit, validate(NotificationPrefsSchema), async (req, res) => {
  try {
    const { email, preferences } = req.body as { email: string; preferences: Record<string, boolean> };
    await setUserProfileMeta(email, "_notificationPreferences", {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] update-notifications error:", err);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

profileRouter.get("/user/balance/:email", userDataLimit, async (req, res) => {
  try {
    const email = decodeURIComponent(String(req.params["email"]));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    const userData = await getUserData(email);
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const bal = await getUserBalance(email);
    res.json({ email, balance: bal.balance, profit: bal.profit, updatedAt: bal.updatedAt, history: bal.history });
  } catch (err) {
    console.error("[Profile] user balance error:", err);
    res.status(500).json({ error: "Failed to get balance" });
  }
});

profileRouter.get("/user/kyc-status/:email", userDataLimit, async (req, res) => {
  try {
    const email = decodeURIComponent(String(req.params["email"]));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    const userData = await getUserData(email);
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const status = (userData["status"] as string) ?? "pending";
    const profile = await getUserProfileData(email);
    const response: Record<string, unknown> = { status };

    if (status === "resubmit_required" || status === "resubmit") {
      response.resubmitFields = (profile._resubmitFields as string[]) ?? [];
      response.resubmitReason = (profile._resubmitReason as string) ?? null;
    }

    res.json(response);
  } catch (err) {
    console.error("[Profile] kyc-status error:", err);
    res.status(500).json({ error: "Failed to get KYC status" });
  }
});

profileRouter.post("/user/kyc-resubmit", userDataLimit, validate(KycResubmitSchema), async (req, res) => {
  try {
    const { email, data: stepData } = req.body as { email: string; data?: Record<string, Record<string, unknown>> };
    const userData = await getUserData(email);
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const currentStatus = (userData["status"] as string) ?? "pending";
    if (currentStatus !== "resubmit_required" && currentStatus !== "resubmit") {
      res.status(400).json({ error: "User is not in resubmit_required status" });
      return;
    }

    const profile = await getUserProfileData(email);
    const allowedFields = (profile._resubmitFields as string[]) ?? [];

    const FIELD_TO_STEP: Record<string, string> = {
      "Personal Details": "personal",
      "Professional Details": "professional",
      "ID Information": "idInformation",
      "Income Details": "income",
      "Risk Tolerance": "riskTolerance",
      "Financial Situation": "financialSituation",
      "Investment Experience": "investmentExperience",
      "ID Proof Upload": "idProofUpload",
      "Funding Details": "fundingDetails",
      "Disclosures": "disclosures",
      "Signatures": "signatures",
    };
    const allowedSteps = new Set(allowedFields.map((f) => FIELD_TO_STEP[f]).filter(Boolean));

    if (stepData && typeof stepData === "object") {
      const { upsertUserStep } = await import("../lib/userDataStore.js");
      for (const [stepName, fields] of Object.entries(stepData)) {
        if (!allowedSteps.has(stepName)) continue;
        if (fields && typeof fields === "object") {
          await upsertUserStep(email, stepName, fields as Record<string, unknown>);
        }
      }
    }

    const { setUserStatus } = await import("../lib/userDataStore.js");
    await setUserStatus(email, "reviewing");

    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({
      actionType: "USER_RESUBMIT",
      actor: email,
      fieldsUpdated: allowedFields,
      timestamp: new Date().toISOString(),
    });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    await setUserProfileMeta(email, "_resubmitFields", []);
    await setUserProfileMeta(email, "_resubmitReason", null);

    res.json({ success: true, status: "reviewing" });
  } catch (err) {
    console.error("[Profile] kyc-resubmit error:", err);
    res.status(500).json({ error: "Failed to process resubmission" });
  }
});

profileRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File too large. Maximum size is 5MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message?.includes("Only .jpg")) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error("[Profile] Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
});

profileRouter.post("/user/fund-request", sensitiveEndpointLimit, validate(FundRequestSchema), async (req, res) => {
  try {
    const { email, type, amount, note } = req.body as { email: string; type: "deposit" | "withdrawal"; amount: number; note?: string };

    const userData = await getUserData(email);
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const label = type === "deposit" ? "Deposit" : "Withdrawal";
    const formattedAmt = `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    await addNotification(email, {
      type: "account",
      title: `${label} Request Received`,
      message: `Your ${type} request for ${formattedAmt} has been received and is under review. We will process it within 1-3 business days.`,
    });

    await addAdminNotification({
      type,
      title: `${label} Request — ${email}`,
      message: `User requested a ${type} of ${formattedAmt}.${note ? ` Note: ${note}` : ""}`,
      userEmail: email,
      meta: { amount, type, note: note ?? null },
    });

    console.log(`[Profile] Fund request: ${email} ${type} $${amount}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[Profile] fund-request error:", err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

export default profileRouter;
