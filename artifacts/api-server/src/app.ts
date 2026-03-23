import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index.js";
import {
  securityHeaders,
  botDetection,
  globalRateLimit,
  anomalyDetection,
  requestFingerprint,
  hotlinkProtection,
  honeytrapRoute,
} from "./middleware/security.js";

const app: Express = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "https://guardiiantrading.com",
  "https://www.guardiiantrading.com",
];

const devDomain = process.env.REPLIT_DEV_DOMAIN;
if (devDomain) allowedOrigins.push(`https://${devDomain}`);
const replDomains = process.env.REPLIT_DOMAINS;
if (replDomains) {
  replDomains.split(",").forEach((d) => {
    const trimmed = d.trim();
    if (trimmed) allowedOrigins.push(`https://${trimmed}`);
  });
}

if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5000", "http://localhost:5001", "http://localhost:5002");
  allowedOrigins.push("http://localhost:22593", "http://localhost:22594", "http://localhost:22595");
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((o) => origin === o || origin.endsWith(".replit.dev") || origin.endsWith(".replit.app"))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  maxAge: 86400,
}));

app.use(securityHeaders);
app.use(botDetection);
app.use(globalRateLimit);
app.use(anomalyDetection);
app.use(requestFingerprint);
app.use(hotlinkProtection);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/.well-known/internal/users", honeytrapRoute);
app.get("/api/.well-known/internal/data", honeytrapRoute);
app.get("/api/v1/export", honeytrapRoute);
app.get("/api/v1/dump", honeytrapRoute);
app.get("/api/users.json", honeytrapRoute);
app.get("/api/data.json", honeytrapRoute);

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const adminDir = path.resolve(process.cwd(), "artifacts/admin-kyc/dist/public");
  app.use(
    "/admin-kyc",
    express.static(adminDir, { maxAge: "1y", immutable: true }),
  );
  app.get("/admin-kyc/{*splat}", (_req, res) => {
    res.sendFile(path.join(adminDir, "index.html"));
  });

  const frontendDir = path.resolve(
    process.cwd(),
    "artifacts/guardian-trading/dist/public",
  );
  app.use(express.static(frontendDir, { maxAge: "1y", immutable: true }));
  app.get("{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

export default app;
