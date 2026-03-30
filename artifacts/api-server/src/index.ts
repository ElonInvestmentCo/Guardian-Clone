import http from "http";
import app from "./app.js";
import { createWebSocketServer } from "./lib/realtime.js";
import { setupAdminCredentials } from "./lib/setupAdmin.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

setupAdminCredentials().then(() => {
  const server = http.createServer(app);
  createWebSocketServer(server);
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error("[Startup] Failed to initialise admin credentials:", err);
  process.exit(1);
});
