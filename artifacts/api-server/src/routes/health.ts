import { Router, type IRouter } from "express";
import { getPool } from "../lib/db.js";
import { checkEmailConfig } from "../lib/mailer.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health", async (_req, res) => {
  const start = Date.now();
  const result: {
    status: string;
    uptime: number;
    timestamp: string;
    database: { connected: boolean; latency_ms?: number; error?: string };
    email: { configured: boolean };
    version: string;
  } = {
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: { connected: false },
    email: { configured: false },
    version: process.env.npm_package_version ?? "1.0.0",
  };

  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    result.database = { connected: true, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    result.status = "degraded";
    result.database = {
      connected: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }

  const emailOk = await checkEmailConfig();
  result.email = { configured: emailOk };
  if (!emailOk) {
    result.status = "degraded";
  }

  const statusCode = result.status === "ok" ? 200 : 503;
  res.status(statusCode).json(result);
});

export default router;
