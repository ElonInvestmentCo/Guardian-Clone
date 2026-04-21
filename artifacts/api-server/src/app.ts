import fs from "fs";
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

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: Math.floor(process.uptime()) });
});

const allowedOrigins = [
  "https://guardiiantrading.com",
  "https://www.guardiiantrading.com",
  "https://guardiantrading.com",
  "https://www.guardiantrading.com",
  "https://guardian-clone-production.up.railway.app",
  "https://guardian-trading.vercel.app",
  "https://guardian-clone-admin-kyc.vercel.app",
  "https://guardian-trading-api.onrender.com",
];

// Allow additional origins via ALLOWED_ORIGINS env var (comma-separated)
const extraOrigins = process.env.ALLOWED_ORIGINS;
if (extraOrigins) {
  extraOrigins.split(",").forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

const IS_DEV = process.env.NODE_ENV !== "production";

if (IS_DEV) {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) allowedOrigins.push(`https://${devDomain}`);
  const replDomains = process.env.REPLIT_DOMAINS;
  if (replDomains) {
    replDomains.split(",").forEach((d) => {
      const trimmed = d.trim();
      if (trimmed) allowedOrigins.push(`https://${trimmed}`);
    });
  }
  allowedOrigins.push("http://localhost:5000", "http://localhost:5001", "http://localhost:5002");
  allowedOrigins.push("http://localhost:22593", "http://localhost:22594", "http://localhost:22595");
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) { callback(null, true); return; }
    if (allowedOrigins.includes(origin)) { callback(null, true); return; }
    console.warn(`[Security] {"event":"CORS_REJECTED","origin":"${origin}","timestamp":"${new Date().toISOString()}"}`);
    callback(null, false);
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
  function resolveArtifactDir(artifactName: string): string {
    const candidates = [
      path.resolve(process.cwd(), `artifacts/${artifactName}/dist/public`),
      path.resolve(process.cwd(), `../${artifactName}/dist/public`),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        console.log(`[Static] ${artifactName} → ${dir}`);
        try {
          const files = fs.readdirSync(dir);
          console.log(`[Static] ${artifactName} files:`, files.join(", "));
          const assetsDir = path.join(dir, "assets");
          if (fs.existsSync(assetsDir)) {
            console.log(`[Static] ${artifactName}/assets:`, fs.readdirSync(assetsDir).join(", "));
          }
        } catch { /**/ }
        return dir;
      }
    }
    console.warn(`[Static] ${artifactName}: no dist found! Checked:`, candidates);
    return candidates[0];
  }

  const hasFileExtension = (reqPath: string) => /\.\w+$/.test(reqPath);

  const adminDir = resolveArtifactDir("admin-kyc");
  app.use(
    "/admin-kyc",
    express.static(adminDir, { maxAge: "1y", immutable: true }),
  );
  app.get("/admin-kyc/{*splat}", (req, res, next) => {
    if (hasFileExtension(req.path)) return next();
    res.sendFile(path.join(adminDir, "index.html"));
  });

  const frontendDir = resolveArtifactDir("guardian-trading");
  app.use(express.static(frontendDir, { maxAge: "1y", immutable: true }));
  app.get("{*splat}", (req, res, next) => {
    if (hasFileExtension(req.path)) return next();
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[GlobalErrorHandler]", err.stack ?? err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
