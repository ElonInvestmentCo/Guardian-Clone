import "dotenv/config";
import http from "http";
import app from "./app.js";
import { createWebSocketServer } from "./lib/realtime.js";
import { setupAdminCredentials } from "./lib/setupAdmin.js";
import { initDatabase } from "./lib/db.js";
import { checkEmailConfig } from "./lib/mailer.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await initDatabase();
  console.log("[Startup] Database initialized");

  await setupAdminCredentials();
  console.log("[Startup] Admin credentials configured");

  await checkEmailConfig();

  const server = http.createServer(app);
  createWebSocketServer(server);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("[Startup] Failed to start server:", err);
  process.exit(1);
});
