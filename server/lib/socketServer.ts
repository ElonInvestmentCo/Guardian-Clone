import { Server as SocketIOServer, type Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

export let io: SocketIOServer | null = null;

function getJwtSecret(): string {
  return process.env.SESSION_SECRET ?? process.env.ADMIN_JWT_SECRET ?? "guardian-user-dev-secret-fallback-v1";
}

function parseCookieHeader(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx < 0) return;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    if (key) cookies[key] = val;
  });
  return cookies;
}

export function createSocketIOServer(httpServer: HTTPServer): SocketIOServer {
  const IS_DEV = process.env.NODE_ENV !== "production";

  const allowedOrigins: string[] = [
    "https://guardiiantrading.com",
    "https://www.guardiiantrading.com",
    "https://guardiantrading.com",
    "https://www.guardiantrading.com",
  ];

  if (IS_DEV) {
    allowedOrigins.push(
      "http://localhost:5000",
      "http://localhost:5001",
      "http://localhost:5002",
    );
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    if (devDomain) allowedOrigins.push(`https://${devDomain}`);
    const replDomains = process.env.REPLIT_DOMAINS;
    if (replDomains) {
      replDomains.split(",").forEach((d) => {
        const trimmed = d.trim();
        if (trimmed) allowedOrigins.push(`https://${trimmed}`);
      });
    }
  }

  const extraOrigins = process.env.ALLOWED_ORIGINS;
  if (extraOrigins) {
    extraOrigins.split(",").forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) allowedOrigins.push(trimmed);
    });
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
  });

  io.use((socket: Socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const cookies = parseCookieHeader(cookieHeader);
      const token = cookies["guardian_session"];

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const secret = getJwtSecret();
      const payload = jwt.verify(token, secret) as { email?: string; iss?: string };

      if (payload.iss === "guardian-admin" || !payload.email) {
        return next(new Error("Authentication required"));
      }

      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error("Session expired"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const email = socket.data.email as string;
    const room = `user:${email}`;

    socket.join(room);
    console.log(`[Socket.io] User connected: ${email}`);

    socket.emit("system:notification", {
      type: "connected",
      message: "Real-time trading feed connected",
      timestamp: new Date().toISOString(),
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] User disconnected: ${email} (${reason})`);
    });

    socket.on("error", (err: Error) => {
      console.error(`[Socket.io] Socket error for ${email}:`, err.message);
    });
  });

  console.log("[Socket.io] Server initialized");
  return io;
}

export function emitToUser(email: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${email}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}

export function getUserRoomName(email: string): string {
  return `user:${email}`;
}
