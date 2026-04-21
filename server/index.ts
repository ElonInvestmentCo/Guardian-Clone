import "dotenv/config";
import http from "http";
import app from "./app.js";
import { createWebSocketServer } from "./lib/realtime.js";
import { setupAdminCredentials } from "./lib/setupAdmin.js";
import { initDatabase } from "./lib/db.js";
import { checkEmailConfig } from "./lib/mailer.js";
import { scheduleDailySummary } from "./lib/dailySummaryScheduler.js";

const rawPort = process.env["PORT"] ?? "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`[Startup] Invalid PORT value: "${rawPort}" — defaulting to 3001`);
}

async function start() {
  await initDatabase();
  console.log("[Startup] Database initialized");

  await setupAdminCredentials();
  console.log("[Startup] Admin credentials configured");

  await checkEmailConfig();

  scheduleDailySummary();

  const server = http.createServer(app);
  createWebSocketServer(server);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on 0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error("[Startup] Failed to start server:", err);
  process.exit(1);
});
