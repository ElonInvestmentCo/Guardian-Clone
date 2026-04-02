/**
 * Admin KYC management routes.
 *
 * Authentication: JWT Bearer token issued by POST /admin/login
 * (Mounted under /api in app.ts, so externally all routes are /api/admin/*)
 * All /admin/* routes (except /login) require a valid session token.
 * No development-mode bypass — auth is always enforced.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, extname } from "path";
import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getUserData,
  getUserProfileData,
  getUserDocDir,
  sanitizeEmail,
  setUserStatus,
  setUserProfileMeta,
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
  getDataDir,
  decryptSensitiveProfile,
} from "../lib/userDataStore.js";
import { evaluateRisk } from "../lib/fraud/riskEngine.js";
import { getAdminCredentials } from "../lib/setupAdmin.js";

const router = Router();

// ── Config ────────────────────────────────────────────────────────────────────
const SESSION_TTL_HOURS = 8;
const SESSION_TTL_MS    = SESSION_TTL_HOURS * 60 * 60 * 1000;

function jwtSecret(): string {
  return getAdminCredentials().jwtSecret;
}

function readMasterUsers(): Record<string, Record<string, unknown>> {
  return readMaster();
}

// ── Security headers ──────────────────────────────────────────────────────────
function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  next();
}

// ── Login rate limiter: 5 attempts / 15 min per IP ───────────────────────────
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

// ── General admin rate limiter: 120 req / min per IP ─────────────────────────
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

// ── JWT auth middleware (no dev bypass — always enforced) ─────────────────────
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

// Apply security headers to all /admin routes
router.use("/admin", securityHeaders);

// ── POST /admin/login (public) ────────────────────────────────────────────────
router.post(
  "/admin/login",
  loginRateLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body as {
        username?: string;
        password?: string;
      };

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const { username: expectedUsername, passwordHash: expectedHash } = getAdminCredentials();

      // Always run bcrypt compare to prevent timing attacks
      const usernameMatch = username === expectedUsername;
      const passwordMatch = await bcrypt.compare(
        password,
        usernameMatch ? expectedHash : "$2b$12$invalidhashtopreventtimingattack000000000000000000000000"
      );

      if (!usernameMatch || !passwordMatch) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
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
      console.log(`[Admin] LOGIN SUCCESS: ${username} from ${req.ip ?? "unknown"}`);
      res.json({ token, expiresAt });
    } catch (err) {
      console.error("[Admin] login error:", err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// ── All routes below require a valid JWT session ──────────────────────────────
router.use("/admin", adminRateLimit, requireAdmin);

// ── GET /admin/kyc-queue ──────────────────────────────────────────────────────
router.get("/admin/kyc-queue", (req: Request, res: Response): void => {
  try {
    const master = readMasterUsers();

    const page         = Math.max(1, parseInt(String(req.query.page   ?? "1")));
    const limit        = Math.min(100, parseInt(String(req.query.limit ?? "25")));
    const statusFilter = req.query.status  as string | undefined;
    const minRisk      = parseInt(String(req.query.minRisk ?? "0"));

    const users = Object.values(master).map((u) => {
      const email   = u.email as string;
      const risk    = evaluateRisk(email);
      const profile = getUserProfileData(email);
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
    });

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

// ── GET /admin/user-details/:email ────────────────────────────────────────────
router.get("/admin/user-details/:email", (req: Request, res: Response): void => {
  try {
    const email  = decodeURIComponent(String(req.params.email));
    const master = getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }

    const profile   = getUserProfileData(email);
    const risk      = evaluateRisk(email);

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
      const ALL_STEPS = ["personalDetails", "personal", "idInformation", "idProofUpload", "fundingDetails", "general"];
      for (const field of fields) {
        if (target[field] != null && String(target[field]) !== "" && String(target[field]) !== "—") continue;
        for (const step of ALL_STEPS) {
          if (step === targetKey) continue;
          const stepData = prof[step] as Record<string, unknown> | undefined;
          if (stepData?.[field] != null && String(stepData[field]) !== "") {
            target[field] = stepData[field];
            break;
          }
        }
      }
      prof[targetKey] = target;
    }

    consolidateFields(profile, ID_FIELDS, "idInformation");
    consolidateFields(profile, FUNDING_FIELDS, "fundingDetails");

    const auditLog  = (profile._auditLog as unknown[]) ?? [];

    const safeProfile = { ...profile };
    delete safeProfile.credentials;

    const decryptedProfile = decryptSensitiveProfile(safeProfile);
    const decryptedMaster  = decryptSensitiveProfile(master);
    delete decryptedMaster["credentials"];

    res.json({ email, master: decryptedMaster, profile: decryptedProfile, risk, auditLog });
  } catch (err) {
    console.error("[Admin] user-details error:", err);
    res.status(500).json({ error: "Failed to load user details" });
  }
});

// ── POST /admin/approve-user ──────────────────────────────────────────────────
router.post("/admin/approve-user", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    setUserStatus(email, "approved");
    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_APPROVE", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);

    addNotification(email, {
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

// ── POST /admin/reject-user ───────────────────────────────────────────────────
router.post("/admin/reject-user", (req: Request, res: Response): void => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!reason || !reason.trim()) { res.status(400).json({ error: "Reject reason is required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    setUserStatus(email, "rejected");
    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REJECT", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);

    addNotification(email, {
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

// ── POST /admin/request-resubmission ─────────────────────────────────────────
router.post("/admin/request-resubmission", (req: Request, res: Response): void => {
  try {
    const { email, fields, adminNote } = req.body as { email: string; fields?: string[]; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    setUserStatus(email, "resubmit");
    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REQUEST_RESUBMIT", actor: "admin", fields: fields ?? [], note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    setUserProfileMeta(email, "_resubmitFields", fields ?? []);

    addNotification(email, {
      type: "kyc",
      title: "Documents Resubmission Required",
      message: "Some of your submitted documents need to be updated. Please log in and re-upload the requested items.",
      actionUrl: "/settings",
    });
    console.log(`[Admin] RESUBMIT requested for: ${email}`);
    res.json({ success: true, email, status: "resubmit", fields: fields ?? [] });
  } catch (err) {
    console.error("[Admin] request-resubmission error:", err);
    res.status(500).json({ error: "Failed to request resubmission" });
  }
});

// ── POST /admin/create-user ───────────────────────────────────────────────────
router.post("/admin/create-user", (req: Request, res: Response): void => {
  try {
    const { email, displayName, role = "user" } = req.body as { email: string; displayName: string; role?: string };
    if (!email || !displayName) { res.status(400).json({ error: "email and displayName required" }); return; }
    if (getUserData(email)) { res.status(409).json({ error: "User already exists" }); return; }
    createAdminUser(email, displayName, role);
    console.log(`[Admin] CREATED user: ${email} (role: ${role})`);
    res.json({ success: true, email, role });
  } catch (err) {
    console.error("[Admin] create-user error:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// ── DELETE /admin/delete-user ─────────────────────────────────────────────────
router.delete("/admin/delete-user", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    console.log(`[Admin] DELETE user: ${email} — note: ${adminNote ?? "none"}`);
    deleteUser(email);
    res.json({ success: true, email });
  } catch (err) {
    console.error("[Admin] delete-user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// ── POST /admin/update-user ───────────────────────────────────────────────────
router.post("/admin/update-user", (req: Request, res: Response): void => {
  try {
    const { email, firstName, lastName, adminNote } = req.body as { email: string; firstName?: string; lastName?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    const profile = getUserProfileData(email);
    const personal = (profile.personal as Record<string, string> | undefined) ?? {};
    if (firstName !== undefined) personal.firstName = firstName;
    if (lastName  !== undefined) personal.lastName  = lastName;
    setUserProfileMeta(email, "personal", personal);

    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_UPDATE_USER", actor: "admin", note: adminNote ?? null, meta: { firstName, lastName }, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);

    console.log(`[Admin] UPDATED user: ${email}`);
    res.json({ success: true, email });
  } catch (err) {
    console.error("[Admin] update-user error:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── POST /admin/suspend-user ──────────────────────────────────────────────────
router.post("/admin/suspend-user", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserStatus(email, "suspended");
    const profile = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_SUSPEND", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] SUSPENDED: ${email}`);
    res.json({ success: true, email, status: "suspended" });
  } catch (err) { res.status(500).json({ error: "Failed to suspend user" }); }
});

// ── POST /admin/ban-user ──────────────────────────────────────────────────────
router.post("/admin/ban-user", (req: Request, res: Response): void => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserStatus(email, "banned");
    const profile = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_BAN", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] BANNED: ${email}`);
    res.json({ success: true, email, status: "banned" });
  } catch (err) { res.status(500).json({ error: "Failed to ban user" }); }
});

// ── POST /admin/reactivate-user ───────────────────────────────────────────────
router.post("/admin/reactivate-user", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserStatus(email, "approved");
    const profile = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REACTIVATE", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] REACTIVATED: ${email}`);
    res.json({ success: true, email, status: "approved" });
  } catch (err) { res.status(500).json({ error: "Failed to reactivate user" }); }
});

// ── POST /admin/assign-role ───────────────────────────────────────────────────
router.post("/admin/assign-role", (req: Request, res: Response): void => {
  try {
    const { email, role, adminNote } = req.body as { email: string; role: string; adminNote?: string };
    if (!email || !role) { res.status(400).json({ error: "email and role required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserRole(email, role);
    if (adminNote) {
      const profile = getUserProfileData(email);
      const auditLog = (profile._auditLog as unknown[]) ?? [];
      auditLog.push({ actionType: "ADMIN_ASSIGN_ROLE", actor: "admin", note: adminNote, meta: { role }, timestamp: new Date().toISOString() });
      setUserProfileMeta(email, "_auditLog", auditLog);
    }
    console.log(`[Admin] ROLE ASSIGNED: ${email} → ${role}`);
    res.json({ success: true, email, role });
  } catch (err) { res.status(500).json({ error: "Failed to assign role" }); }
});

// ── GET /admin/user-balance/:email ────────────────────────────────────────────
router.get("/admin/user-balance/:email", (req: Request, res: Response): void => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const bal = getUserBalance(email);
    res.json({ email, ...bal });
  } catch (err) { res.status(500).json({ error: "Failed to get balance" }); }
});

// ── GET /admin/transaction-types ──────────────────────────────────────────────
router.get("/admin/transaction-types", (_req: Request, res: Response): void => {
  res.json({ types: TRANSACTION_TYPES });
});

// ── POST /admin/set-balance ───────────────────────────────────────────────────
router.post("/admin/set-balance", (req: Request, res: Response): void => {
  try {
    const { email, balance, profit, adminNote, transactionType } = req.body as {
      email: string; balance: number; profit: number;
      adminNote?: string; transactionType?: string;
    };
    if (!email || balance === undefined || profit === undefined) {
      res.status(400).json({ error: "email, balance and profit required" });
      return;
    }
    if (!adminNote || !adminNote.trim()) {
      res.status(400).json({ error: "Admin note is required for balance changes" });
      return;
    }
    const balNum = Number(balance);
    const profNum = Number(profit);
    if (isNaN(balNum) || isNaN(profNum)) {
      res.status(400).json({ error: "Balance and profit must be valid numbers" });
      return;
    }
    if (balNum < 0) {
      res.status(400).json({ error: "Balance cannot be negative" });
      return;
    }
    const txType = (transactionType && (TRANSACTION_TYPES as readonly string[]).includes(transactionType))
      ? transactionType as TransactionType
      : "adjustment";
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserBalance(email, balNum, profNum, adminNote.trim(), "admin", txType);
    console.log(`[Admin] SET BALANCE: ${email} balance=$${balNum} profit=$${profNum} type=${txType}`);
    res.json({ success: true, email, balance: balNum, profit: profNum, transactionType: txType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to set balance";
    res.status(400).json({ error: msg });
  }
});

// ── GET /admin/global-audit ───────────────────────────────────────────────────
router.get("/admin/global-audit", (req: Request, res: Response): void => {
  try {
    const limit = Math.min(500, parseInt(String(req.query.limit ?? "100")));
    const all   = getGlobalAuditLog().slice(0, limit);
    res.json({ total: all.length, entries: all });
  } catch (err) { res.status(500).json({ error: "Failed to load audit log" }); }
});

// ── GET /admin/all-users ──────────────────────────────────────────────────────
router.get("/admin/all-users", (req: Request, res: Response): void => {
  try {
    const master = readMasterUsers();
    const search  = (req.query.search  as string ?? "").toLowerCase();
    const statusF = req.query.status   as string | undefined;
    const roleF   = req.query.role     as string | undefined;

    const users = Object.values(master).map((u) => {
      const email   = u.email as string;
      const profile = getUserProfileData(email);
      const risk    = evaluateRisk(email);
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
    });

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

// ── POST /admin/flag-user ─────────────────────────────────────────────────────
router.post("/admin/flag-user", (req: Request, res: Response): void => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_FLAG", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    setUserProfileMeta(email, "_flagged", true);
    console.log(`[Admin] FLAGGED: ${email}`);
    res.json({ success: true, email });
  } catch (err) { res.status(500).json({ error: "Failed to flag user" }); }
});

// ── POST /admin/reset-password ────────────────────────────────────────────────
router.post("/admin/reset-password", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const profile  = getUserProfileData(email);
    const creds    = (profile.credentials as Record<string, unknown>) ?? {};
    delete creds.passwordHash;
    setUserProfileMeta(email, "credentials", creds);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_RESET_PASSWORD", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);
    console.log(`[Admin] PASSWORD RESET: ${email}`);
    res.json({ success: true, email });
  } catch (err) { res.status(500).json({ error: "Failed to reset password" }); }
});

// ── GET /admin/user-documents/:email ─────────────────────────────────────────
router.get("/admin/user-documents/:email", (req: Request, res: Response): void => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    const master = getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }
    const profile = getUserProfileData(email);
    const docs = (profile.documents as Record<string, string>)
      ?? (master.documents as Record<string, string>)
      ?? {};
    const dataDir = getDataDir();
    const result: Record<string, { role: string; path: string; exists: boolean; fileName: string }> = {};
    for (const [role, relPath] of Object.entries(docs)) {
      const absPath = resolve(dataDir, relPath.replace(/^data\//, ""));
      const fileName = relPath.split("/").pop() ?? role;
      result[role] = { role, path: relPath, exists: existsSync(absPath), fileName };
    }
    res.json({ email, documents: result });
  } catch (err) {
    console.error("[Admin] user-documents error:", err);
    res.status(500).json({ error: "Failed to load documents" });
  }
});

// ── GET /admin/user-document-file/:email/:role ──────────────────────────────
router.get("/admin/user-document-file/:email/:role", (req: Request, res: Response): void => {
  try {
    const email = decodeURIComponent(String(req.params.email));
    const role = String(req.params.role);
    const master = getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }
    const profile = getUserProfileData(email);
    const docs = (profile.documents as Record<string, string>)
      ?? (master.documents as Record<string, string>)
      ?? {};
    const relPath = docs[role];
    if (!relPath) { res.status(404).json({ error: "Document not found" }); return; }
    const dataDir = getDataDir();
    const absPath = resolve(dataDir, relPath.replace(/^data\//, ""));
    if (!absPath.startsWith(dataDir)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (!existsSync(absPath)) { res.status(404).json({ error: "File not found on disk" }); return; }
    const ext = extname(absPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png", ".pdf": "application/pdf",
    };
    res.setHeader("Content-Type", mimeMap[ext] ?? "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${role}${ext}"`);
    res.send(readFileSync(absPath));
  } catch (err) {
    console.error("[Admin] user-document-file error:", err);
    res.status(500).json({ error: "Failed to serve document" });
  }
});

export default router;
