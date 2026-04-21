import { Router, type Request, type Response, type NextFunction } from "express";
import { querySignatureAuditLog } from "../lib/signatureAudit.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getUserData,
  getUserProfileData,
  sanitizeEmail,
  setUserStatus,
  setUserProfileMeta,
  upsertUserStep,
  deleteUser,
  setUserBalance,
  getUserBalance,
  TRANSACTION_TYPES,
  type TransactionType,
  setUserRole,
  getGlobalAuditLog,
  createAdminUser,
  addNotification,
  readMaster,
  decryptSensitiveProfile,
} from "../lib/userDataStore.js";
import { getPool } from "../lib/db.js";
import { evaluateRisk } from "../lib/fraud/riskEngine.js";
import { getAdminCredentials } from "../lib/setupAdmin.js";
import { validate, AdminLoginSchema, AdminEmailSchema, AdminRejectSchema, AdminResubmitSchema, AdminCreateUserSchema, AdminUpdateUserSchema, AdminAssignRoleSchema, AdminBanSchema, AdminSetBalanceSchema } from "../lib/validation.js";
import { logSecurity } from "../lib/securityLogger.js";

const router = Router();

const SESSION_TTL_HOURS = 8;
const SESSION_TTL_MS    = SESSION_TTL_HOURS * 60 * 60 * 1000;

function jwtSecret(): string {
  return getAdminCredentials().jwtSecret;
}

function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip  = req.ip ?? "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    if (entry.count >= 5) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.status(429).json({ error: `Too many login attempts. Try again in ${retryAfter}s.` });
      return;
    }
    entry.count++;
  } else {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
  next();
}

const rateMap = new Map<string, number[]>();
function adminRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip  = req.ip ?? "unknown";
  const now = Date.now();
  const hits = (rateMap.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  rateMap.set(ip, hits);
  if (hits.length > 120) { res.status(429).json({ error: "Too many requests" }); return; }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret(), { issuer: "guardian-admin" }) as {
      username: string;
    };
    if (!payload.username) throw new Error("Invalid payload");
    (req as Request & { adminUser: string }).adminUser = payload.username;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

router.use("/admin", securityHeaders);

router.post(
  "/admin/login",
  loginRateLimit,
  validate(AdminLoginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body as { username: string; password: string };

      const { username: expectedUsername, passwordHash: expectedHash } = getAdminCredentials();

      const usernameMatch = username === expectedUsername;
      const passwordMatch = await bcrypt.compare(
        password,
        usernameMatch ? expectedHash : "$2b$12$invalidhashtopreventtimingattack000000000000000000000000"
      );

      if (!usernameMatch || !passwordMatch) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        logSecurity("ADMIN_LOGIN_FAIL", req, `username: ${username}`);
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      loginAttempts.delete(req.ip ?? "unknown");

      const token = jwt.sign(
        { username },
        jwtSecret(),
        { expiresIn: `${SESSION_TTL_HOURS}h`, issuer: "guardian-admin" }
      );

      const expiresAt = Date.now() + SESSION_TTL_MS;
      logSecurity("ADMIN_LOGIN_SUCCESS", req, `username: ${username}`);
      console.log(`[Admin] LOGIN SUCCESS: ${username} from ${req.ip ?? "unknown"}`);
      res.json({ token, expiresAt });
    } catch (err) {
      console.error("[Admin] login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

router.use("/admin", adminRateLimit, requireAdmin);

router.get("/admin/kyc-queue", async (req: Request, res: Response): Promise<void> => {
  try {
    const master = await readMaster();

    const page         = Math.max(1, parseInt(String(req.query.page   ?? "1")));
    const limit        = Math.min(100, parseInt(String(req.query.limit ?? "25")));
    const statusFilter = req.query.status  as string | undefined;
    const minRisk      = parseInt(String(req.query.minRisk ?? "0"));

    const users = await Promise.all(Object.values(master).map(async (u) => {
      const email   = u.email as string;
      const risk    = await evaluateRisk(email);
      const profile = await getUserProfileData(email);
      const completed = (profile._completedStepNumbers as number[] | undefined) ?? [];
      const p         = profile.personal as Record<string, string> | undefined;
      return {
        email,
        status:         (u.status as string) ?? "pending",
        createdAt:      u.createdAt,
        updatedAt:      u.updatedAt,
        completedSteps: completed.length,
        totalSteps:     12,
        riskScore:      risk.score,
        riskLevel:      risk.level,
        flagCount:      risk.flags.length,
        name:           [p?.firstName ?? "", p?.lastName ?? ""].join(" ").trim() || email,
      };
    }));

    const filtered = users
      .filter((u) => !statusFilter || u.status === statusFilter)
      .filter((u) => u.riskScore >= minRisk)
      .sort((a, b) => b.riskScore - a.riskScore);

    const total   = filtered.length;
    const start   = (page - 1) * limit;
    const results = filtered.slice(start, start + limit);

    res.json({ total, page, limit, pages: Math.ceil(total / limit), users: results });
  } catch (err) {
    console.error("[Admin] kyc-queue error:", err);
    res.status(500).json({ error: "Failed to load KYC queue" });
  }
});

router.get("/admin/user-details/:email", async (req: Request, res: Response): Promise<void> => {
  try {
    const email  = decodeURIComponent(String(req.params.email));
    const master = await getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }

    const profile   = await getUserProfileData(email);
    const risk      = await evaluateRisk(email);

    const STEP_KEYS = [
      "general", "personal", "professional", "idInformation",
      "income", "riskTolerance", "financialSituation", "investmentExperience",
      "idProofUpload", "fundingDetails", "disclosures", "signatures",
    ];
    for (const key of STEP_KEYS) {
      if (!profile[key] && master[key]) {
        profile[key] = master[key];
      }
    }
    if (!profile["documents"] && master["documents"]) {
      profile["documents"] = master["documents"];
    }

    const ID_FIELDS = ["taxId", "dateOfBirth", "idNumber", "idType", "taxIdType", "foreignIdType", "taxResidenceCountry", "countryOfIssuance", "issuingState", "issueDate", "expirationDate"];
    const FUNDING_FIELDS = ["accountNumber", "abaSwift", "bankAccountNumber", "routingNumber", "bankName", "accountName", "accountType", "fundingSources"];

    function consolidateFields(prof: Record<string, unknown>, fields: string[], targetKey: string): void {
      const target = (prof[targetKey] as Record<string, unknown>) ?? {};
      for (const field of fields) {
        if (target[field] != null && String(target[field]) !== "" && String(target[field]) !== "—") continue;
        for (const [stepKey, stepVal] of Object.entries(prof)) {
          if (stepKey === targetKey || stepKey.startsWith("_") || stepVal == null || typeof stepVal !== "object" || Array.isArray(stepVal)) continue;
          const stepData = stepVal as Record<string, unknown>;
          if (stepData[field] != null && String(stepData[field]) !== "") {
            target[field] = stepData[field];
            break;
          }
        }
      }
      prof[targetKey] = target;
    }

    consolidateFields(profile, ID_FIELDS, "idInformation");
    consolidateFields(profile, FUNDING_FIELDS, "fundingDetails");

    const safeProfile = { ...profile };
    delete safeProfile.credentials;

    const decryptedProfile = decryptSensitiveProfile(safeProfile);
    const decryptedMaster  = decryptSensitiveProfile(master);
    delete decryptedMaster["credentials"];

    const auditLog = (decryptedProfile._auditLog as unknown[]) ?? [];
    const role = (master.role as string) ?? (profile.role as string) ?? "user";

    res.json({ email, master: decryptedMaster, profile: decryptedProfile, risk, auditLog, role });
  } catch (err) {
    console.error("[Admin] user-details error:", err);
    res.status(500).json({ error: "Failed to load user details" });
  }
});

router.post("/admin/approve-user", validate(AdminEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    await setUserStatus(email, "approved");
    const profile  = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_APPROVE", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    await setUserProfileMeta(email, "_resubmitFields", []);
    await setUserProfileMeta(email, "_resubmitReason", null);

    await addNotification(email, {
      type: "kyc",
      title: "KYC Approved",
      message: "Your identity verification has been approved. You now have full access to Guardian Trading.",
      actionUrl: "/dashboard",
    });
    console.log(`[Admin] APPROVED: ${email}`);
    res.json({ success: true, email, status: "approved" });
  } catch (err) {
    console.error("[Admin] approve-user error:", err);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

router.post("/admin/reject-user", validate(AdminRejectSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    await setUserStatus(email, "rejected");
    const profile  = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REJECT", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);

    await addNotification(email, {
      type: "kyc",
      title: "KYC Review Update",
      message: `Your identity verification was not approved. Reason: ${reason}. Please contact support for more information.`,
    });
    console.log(`[Admin] REJECTED: ${email}`);
    res.json({ success: true, email, status: "rejected" });
  } catch (err) {
    console.error("[Admin] reject-user error:", err);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

router.post("/admin/request-resubmission", validate(AdminResubmitSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, fields, adminNote } = req.body as { email: string; fields?: string[]; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    await setUserStatus(email, "resubmit_required");
    const profile  = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REQUEST_RESUBMIT", actor: "admin", fields: fields ?? [], note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    await setUserProfileMeta(email, "_resubmitFields", fields ?? []);
    await setUserProfileMeta(email, "_resubmitReason", adminNote ?? "Please update the requested information.");

    await addNotification(email, {
      type: "kyc",
      title: "Documents Resubmission Required",
      message: "Some of your submitted information needs to be updated. Please log in to review and correct the requested fields.",
      actionUrl: "/kyc/resubmit",
    });
    console.log(`[Admin] RESUBMIT requested for: ${email}`);
    res.json({ success: true, email, status: "resubmit_required", fields: fields ?? [] });
  } catch (err) {
    console.error("[Admin] request-resubmission error:", err);
    res.status(500).json({ error: "Failed to request resubmission" });
  }
});

router.post("/admin/create-user", validate(AdminCreateUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, role = "user" } = req.body as { email: string; displayName: string; role?: string };
    if (await getUserData(email)) { res.status(409).json({ error: "User already exists" }); return; }
    await createAdminUser(email, displayName, role);
    console.log(`[Admin] CREATED user: ${email} (role: ${role})`);
    res.json({ success: true, email, role });
  } catch (err) {
    console.error("[Admin] create-user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.delete("/admin/delete-user", validate(AdminEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    console.log(`[Admin] DELETE user: ${email} — note: ${adminNote ?? "none"}`);
    await deleteUser(email);
    res.json({ success: true, email });
  } catch (err) {
    console.error("[Admin] delete-user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/admin/update-user", validate(AdminUpdateUserSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, adminNote } = req.body as { email: string; firstName?: string; lastName?: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    const profile = await getUserProfileData(email);
    const personal = (profile.personal as Record<string, string> | undefined) ?? {};
    if (firstName !== undefined) personal.firstName = firstName;
    if (lastName  !== undefined) personal.lastName  = lastName;
    await setUserProfileMeta(email, "personal", personal);

    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_UPDATE_USER", actor: "admin", note: adminNote ?? null, meta: { firstName, lastName }, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);

    console.log(`[Admin] UPDATED user: ${email}`);
    res.json({ success: true, email });
  } catch (err) {
    console.error("[Admin] update-user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.post("/admin/suspend-user", validate(AdminEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    await setUserStatus(email, "suspended");
    const profile = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_SUSPEND", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] SUSPENDED: ${email}`);
    res.json({ success: true, email, status: "suspended" });
  } catch (err) { res.status(500).json({ error: "Failed to suspend user" }); }
});

router.post("/admin/ban-user", validate(AdminBanSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    await setUserStatus(email, "banned");
    const profile = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_BAN", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] BANNED: ${email}`);
    res.json({ success: true, email, status: "banned" });
  } catch (err) { res.status(500).json({ error: "Failed to ban user" }); }
});

router.post("/admin/reactivate-user", validate(AdminEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    await setUserStatus(email, "approved");
    const profile = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REACTIVATE", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] REACTIVATED: ${email}`);
    res.json({ success: true, email, status: "approved" });
  } catch (err) { res.status(500).json({ error: "Failed to reactivate user" }); }
});

router.post("/admin/assign-role", validate(AdminAssignRoleSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role, adminNote } = req.body as { email: string; role: string; adminNote?: string };
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    await setUserRole(email, role);
    if (adminNote) {
      const profile = await getUserProfileData(email);
      const auditLog = (profile._auditLog as unknown[]) ?? [];
      auditLog.push({ actionType: "ADMIN_ASSIGN_ROLE", actor: "admin", note: adminNote, meta: { role }, timestamp: new Date().toISOString() });
      await setUserProfileMeta(email, "_auditLog", auditLog);
    }
    console.log(`[Admin] ROLE ASSIGNED: ${email} → ${role}`);
    res.json({ success: true, email, role });
  } catch (err) { res.status(500).json({ error: "Failed to assign role" }); }
});

router.get("/admin/user-balance/:email", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const bal = await getUserBalance(email);
    res.json({ email, ...bal });
  } catch (err) { res.status(500).json({ error: "Failed to get balance" }); }
});

router.get("/admin/transaction-types", (_req: Request, res: Response): void => {
  res.json({ types: TRANSACTION_TYPES });
});

router.post("/admin/set-balance", validate(AdminSetBalanceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, balance, profit, adminNote, transactionType } = req.body as {
      email: string; balance: number; profit: number;
      adminNote: string; transactionType?: string;
    };
    const balNum = balance;
    const profNum = profit;
    const txType = (transactionType && (TRANSACTION_TYPES as readonly string[]).includes(transactionType))
      ? transactionType as TransactionType
      : "adjustment";
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    await setUserBalance(email, balNum, profNum, adminNote.trim(), "admin", txType);
    console.log(`[Admin] SET BALANCE: ${email} balance=$${balNum} profit=$${profNum} type=${txType}`);
    res.json({ success: true, email, balance: balNum, profit: profNum, transactionType: txType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to set balance";
    res.status(400).json({ error: msg });
  }
});

router.get("/admin/global-audit", async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(500, parseInt(String(req.query.limit ?? "100")));
    const all   = (await getGlobalAuditLog()).slice(0, limit);
    const decrypted = decryptSensitiveProfile({ entries: all });
    res.json({ total: all.length, entries: (decrypted as Record<string, unknown>).entries ?? all });
  } catch (err) { res.status(500).json({ error: "Failed to load audit log" }); }
});

router.get("/admin/all-users", async (req: Request, res: Response): Promise<void> => {
  try {
    const master = await readMaster();
    const search  = (req.query.search  as string ?? "").toLowerCase();
    const statusF = req.query.status   as string | undefined;
    const roleF   = req.query.role     as string | undefined;

    const users = await Promise.all(Object.values(master).map(async (u) => {
      const email   = u.email as string;
      const profile = await getUserProfileData(email);
      const risk    = await evaluateRisk(email);
      const completed = (profile._completedStepNumbers as number[] | undefined) ?? [];
      const p         = profile.personal as Record<string, string> | undefined;
      const bal       = profile._balance  as { balance?: number; profit?: number } | undefined;
      const auditLog  = (profile._auditLog as Array<Record<string, unknown>>) ?? [];
      const lastAction = auditLog.length > 0 ? auditLog[auditLog.length - 1] : null;

      return {
        email,
        name:           [p?.firstName ?? "", p?.lastName ?? ""].join(" ").trim() || email,
        status:         (u.status as string) ?? "pending",
        role:           (u.role   as string) ?? "user",
        createdAt:      u.createdAt as string,
        updatedAt:      u.updatedAt as string,
        completedSteps: completed.length,
        totalSteps:     12,
        riskScore:      risk.score,
        riskLevel:      risk.level,
        flagCount:      risk.flags.length,
        balance:        bal?.balance ?? 0,
        profit:         bal?.profit  ?? 0,
        lastActionType: lastAction ? (lastAction.actionType as string) : null,
        lastActionAt:   lastAction ? (lastAction.timestamp  as string) : null,
        auditCount:     auditLog.length,
      };
    }));

    const filtered = users
      .filter((u) => !statusF || u.status === statusF)
      .filter((u) => !roleF   || u.role   === roleF)
      .filter((u) => !search  || u.email.toLowerCase().includes(search) || u.name.toLowerCase().includes(search))
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

    res.json({ total: filtered.length, users: filtered });
  } catch (err) {
    console.error("[Admin] all-users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.post("/admin/flag-user", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const profile  = await getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_FLAG", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    await setUserProfileMeta(email, "_flagged", true);
    console.log(`[Admin] FLAGGED: ${email}`);
    res.json({ success: true, email });
  } catch (err) { res.status(500).json({ error: "Failed to flag user" }); }
});

router.post("/admin/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!await getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const profile  = await getUserProfileData(email);
    const creds    = (profile.credentials as Record<string, unknown>) ?? {};
    delete creds.passwordHash;
    await setUserProfileMeta(email, "credentials", creds);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_RESET_PASSWORD", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    await setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] PASSWORD RESET: ${email}`);
    res.json({ success: true, email });
  } catch (err) { res.status(500).json({ error: "Failed to reset password" }); }
});

router.get("/admin/user-documents/:email", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    const master = await getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }
    const profile = await getUserProfileData(email);
    const docs = (profile.documents as Record<string, string>)
      ?? (master.documents as Record<string, string>)
      ?? {};

    const pool = getPool();
    const dbDocs = await pool.query(
      `SELECT role, filename FROM user_documents WHERE email = $1`,
      [email]
    );
    const dbDocSet = new Set(dbDocs.rows.map((r: any) => r.role));

    const result: Record<string, { role: string; path: string; exists: boolean; fileName: string }> = {};
    for (const [role, relPath] of Object.entries(docs)) {
      const fileName = relPath.split("/").pop() ?? role;
      result[role] = { role, path: relPath, exists: dbDocSet.has(role), fileName };
    }
    res.json({ email, documents: result });
  } catch (err) {
    console.error("[Admin] user-documents error:", err);
    res.status(500).json({ error: "Failed to load documents" });
  }
});

router.get("/admin/user-document-file/:email/:role", async (req: Request, res: Response): Promise<void> => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    const role = String(req.params.role);
    const master = await getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }

    const pool = getPool();
    const result = await pool.query(
      `SELECT file_data, mimetype, filename FROM user_documents WHERE email = $1 AND role = $2`,
      [email, role]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const row = result.rows[0];
    const ext = (row.filename as string).split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      "jpg": "image/jpeg", "jpeg": "image/jpeg",
      "png": "image/png", "pdf": "application/pdf",
    };
    res.setHeader("Content-Type", row.mimetype || mimeMap[ext] || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${role}.${ext}"`);
    res.send(row.file_data);
  } catch (err) {
    console.error("[Admin] user-document-file error:", err);
    res.status(500).json({ error: "Failed to serve document" });
  }
});

router.post("/admin/verify-signature", requireAdmin, adminRateLimit, validate(AdminEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    const master = await getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }

    const profile = await getUserProfileData(email);
    const existingSigs = (profile["signatures"] as Record<string, unknown>) ?? {};
    const now = new Date().toISOString();

    await upsertUserStep(email, "signatures", {
      ...existingSigs,
      signatureVerified: true,
      signatureVerifiedAt: now,
    });

    const auditLog = (profile["_auditLog"] as unknown[]) ?? [];
    const adminUser = (req as Request & { adminUser: string }).adminUser;
    auditLog.push({
      actionType: "SIGNATURE_VERIFIED",
      actor: adminUser,
      email,
      note: adminNote ?? null,
      timestamp: now,
    });
    await setUserProfileMeta(email, "_auditLog", auditLog);

    console.log(`[Admin] Signature verified for ${email} by ${adminUser}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin] verify-signature error:", err);
    res.status(500).json({ error: "Failed to verify signature" });
  }
});

// ─── Signature Audit Log ────────────────────────────────────────────────────

router.get("/admin/signature-audit-log", requireAdmin, adminRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search ?? "").trim();
    const page   = Math.max(1, parseInt(String(req.query.page  ?? "1"),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "25"), 10)));
    const offset = (page - 1) * limit;

    const result = await querySignatureAuditLog({ search, limit, offset });
    res.json({ ...result, page, limit });
  } catch (err) {
    console.error("[Admin] signature-audit-log error:", err);
    res.status(500).json({ error: "Failed to fetch signature audit log" });
  }
});

router.get("/admin/signature-audit-log/export", requireAdmin, adminRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search ?? "").trim();
    const result = await querySignatureAuditLog({ search, limit: 10_000, offset: 0 });

    const escCsv = (v: string | null | undefined) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = "ID,Email,IP Address,User Agent,Signed At\n";
    const rows   = result.entries.map((e) =>
      [e.id, escCsv(e.email), escCsv(e.ip_address), escCsv(e.user_agent), escCsv(e.created_at)].join(",")
    ).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="signature-audit-${Date.now()}.csv"`);
    res.send(header + rows);
  } catch (err) {
    console.error("[Admin] signature-audit-log export error:", err);
    res.status(500).json({ error: "Failed to export signature audit log" });
  }
});

export default router;
