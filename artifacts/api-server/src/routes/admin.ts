/**
 * Admin KYC management routes.
 *
 * Protected by X-Admin-Key header matching ADMIN_SECRET env var.
 * In production replace with JWT role-based auth.
 *
 * GET  /api/admin/kyc-queue
 * GET  /api/admin/user-details/:email
 * POST /api/admin/approve-user
 * POST /api/admin/reject-user
 * POST /api/admin/request-resubmission
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Router, type Request, type Response, type NextFunction } from "express";
import {
  getUserData,
  getUserProfileData,
  setUserStatus,
  setUserProfileMeta,
  deleteUser,
  setUserBalance,
  getUserBalance,
  setUserRole,
  getGlobalAuditLog,
  createAdminUser,
} from "../lib/userDataStore.js";
import { evaluateRisk } from "../lib/fraud/riskEngine.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
function masterPath(): string {
  return process.env.USER_DATA_DIR
    ? join(process.env.USER_DATA_DIR, "master.json")
    : join(process.cwd(), "data", "users", "master.json");
}

function readMasterUsers(): Record<string, Record<string, unknown>> {
  try {
    return JSON.parse(readFileSync(masterPath(), "utf-8"));
  } catch {
    return {};
  }
}

// ── Admin auth middleware ─────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "Admin system not configured" });
      return;
    }
    next();
    return;
  }
  if (req.headers["x-admin-key"] !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ── Rate limit (60 req/min per IP) ───────────────────────────────────────────
const rateMap = new Map<string, number[]>();
function adminRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip  = req.ip ?? "unknown";
  const now = Date.now();
  const hits = (rateMap.get(ip) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  rateMap.set(ip, hits);
  if (hits.length > 60) { res.status(429).json({ error: "Too many requests" }); return; }
  next();
}

router.use("/api/admin", adminRateLimit, requireAdmin);

// ── GET /api/admin/kyc-queue ─────────────────────────────────────────────────
router.get("/api/admin/kyc-queue", (req: Request, res: Response): void => {
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
        totalSteps:     11,
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

// ── GET /api/admin/user-details/:email ───────────────────────────────────────
router.get("/api/admin/user-details/:email", (req: Request, res: Response): void => {
  try {
    const email  = decodeURIComponent(req.params.email);
    const master = getUserData(email);
    if (!master) { res.status(404).json({ error: "User not found" }); return; }

    const profile   = getUserProfileData(email);
    const risk      = evaluateRisk(email);
    const auditLog  = (profile._auditLog as unknown[]) ?? [];

    const safeProfile = { ...profile };
    delete safeProfile.credentials;

    res.json({ email, master, profile: safeProfile, risk, auditLog });
  } catch (err) {
    console.error("[Admin] user-details error:", err);
    res.status(500).json({ error: "Failed to load user details" });
  }
});

// ── POST /api/admin/approve-user ─────────────────────────────────────────────
router.post("/api/admin/approve-user", (req: Request, res: Response): void => {
  try {
    const { email, adminNote } = req.body as { email: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    setUserStatus(email, "approved");

    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_APPROVE", actor: "admin", note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);

    console.log(`[Admin] APPROVED: ${email}`);
    res.json({ success: true, email, status: "approved" });
  } catch (err) {
    console.error("[Admin] approve-user error:", err);
    res.status(500).json({ error: "Failed to approve user" });
  }
});

// ── POST /api/admin/reject-user ──────────────────────────────────────────────
router.post("/api/admin/reject-user", (req: Request, res: Response): void => {
  try {
    const { email, reason, adminNote } = req.body as { email: string; reason?: string; adminNote?: string };
    if (!email) { res.status(400).json({ error: "email required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }

    setUserStatus(email, "rejected");

    const profile  = getUserProfileData(email);
    const auditLog = (profile._auditLog as unknown[]) ?? [];
    auditLog.push({ actionType: "ADMIN_REJECT", actor: "admin", reason: reason ?? null, note: adminNote ?? null, timestamp: new Date().toISOString() });
    setUserProfileMeta(email, "_auditLog", auditLog);

    console.log(`[Admin] REJECTED: ${email}`);
    res.json({ success: true, email, status: "rejected" });
  } catch (err) {
    console.error("[Admin] reject-user error:", err);
    res.status(500).json({ error: "Failed to reject user" });
  }
});

// ── POST /api/admin/request-resubmission ────────────────────────────────────
router.post("/api/admin/request-resubmission", (req: Request, res: Response): void => {
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

    console.log(`[Admin] RESUBMIT requested for: ${email}`);
    res.json({ success: true, email, status: "resubmit", fields: fields ?? [] });
  } catch (err) {
    console.error("[Admin] request-resubmission error:", err);
    res.status(500).json({ error: "Failed to request resubmission" });
  }
});

// ── POST /api/admin/create-user ──────────────────────────────────────────────
router.post("/api/admin/create-user", (req: Request, res: Response): void => {
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

// ── DELETE /api/admin/delete-user ─────────────────────────────────────────────
router.delete("/api/admin/delete-user", (req: Request, res: Response): void => {
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

// ── POST /api/admin/update-user ───────────────────────────────────────────────
router.post("/api/admin/update-user", (req: Request, res: Response): void => {
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

// ── POST /api/admin/suspend-user ──────────────────────────────────────────────
router.post("/api/admin/suspend-user", (req: Request, res: Response): void => {
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

// ── POST /api/admin/ban-user ──────────────────────────────────────────────────
router.post("/api/admin/ban-user", (req: Request, res: Response): void => {
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

// ── POST /api/admin/reactivate-user ───────────────────────────────────────────
router.post("/api/admin/reactivate-user", (req: Request, res: Response): void => {
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

// ── POST /api/admin/assign-role ───────────────────────────────────────────────
router.post("/api/admin/assign-role", (req: Request, res: Response): void => {
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

// ── GET /api/admin/user-balance/:email ────────────────────────────────────────
router.get("/api/admin/user-balance/:email", (req: Request, res: Response): void => {
  try {
    const email = decodeURIComponent(req.params.email);
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    const bal = getUserBalance(email);
    res.json({ email, ...bal });
  } catch (err) { res.status(500).json({ error: "Failed to get balance" }); }
});

// ── POST /api/admin/set-balance ───────────────────────────────────────────────
router.post("/api/admin/set-balance", (req: Request, res: Response): void => {
  try {
    const { email, balance, profit, adminNote } = req.body as { email: string; balance: number; profit: number; adminNote?: string };
    if (!email || balance === undefined || profit === undefined) { res.status(400).json({ error: "email, balance and profit required" }); return; }
    if (!getUserData(email)) { res.status(404).json({ error: "User not found" }); return; }
    setUserBalance(email, Number(balance), Number(profit), adminNote ?? "");
    console.log(`[Admin] SET BALANCE: ${email} balance=$${balance} profit=$${profit}`);
    res.json({ success: true, email, balance, profit });
  } catch (err) { res.status(500).json({ error: "Failed to set balance" }); }
});

// ── GET /api/admin/global-audit ───────────────────────────────────────────────
router.get("/api/admin/global-audit", (req: Request, res: Response): void => {
  try {
    const limit = Math.min(500, parseInt(String(req.query.limit ?? "100")));
    const all   = getGlobalAuditLog().slice(0, limit);
    res.json({ total: all.length, entries: all });
  } catch (err) { res.status(500).json({ error: "Failed to load audit log" }); }
});

export default router;
