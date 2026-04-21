import "dotenv/config";
import http from "http";
import app from "./app.js";
import { createWebSocketServer } from "./lib/realtime.js";
import { setupAdminCredentials } from "./lib/setupAdmin.js";
import { initDatabase } from "./lib/db.js";
import { checkEmailConfig } from "./lib/mailer.js";

const rawPort = process.env["PORT"] ?? "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`[Startup] Invalid PORT value: "${rawPort}" — defaulting to 3000`);
}

async function start() {
  try {
    await initDatabase();
    console.log("[Startup] Database initialized");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Startup] Database unavailable — API routes requiring a database will return 503. Reason: ${msg}`);
  }

  try {
    await setupAdminCredentials();
    console.log("[Startup] Admin credentials configured");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Startup] Could not configure admin credentials: ${msg}`);
  }

  await checkEmailConfig();

  const server = http.createServer(app);
  createWebSocketServer(server);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on 0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error("[Startup] Fatal error:", err);
  process.exit(1);
});
