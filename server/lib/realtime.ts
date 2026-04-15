import type { IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

export interface RealtimeEvent {
  type: "new_event" | "ping" | "NEW_USER_REGISTRATION" | "APPLICATION_COMPLETE";
  projectId?: string;
  data?: Record<string, unknown>;
}

const projectSubscribers = new Map<string, Set<WebSocket>>();

export const ADMIN_CHANNEL = "guardian-admin";

export function subscribe(projectId: string, ws: WebSocket): void {
  if (!projectSubscribers.has(projectId)) {
    projectSubscribers.set(projectId, new Set());
  }
  projectSubscribers.get(projectId)!.add(ws);
}

export function unsubscribe(projectId: string, ws: WebSocket): void {
  projectSubscribers.get(projectId)?.delete(ws);
}

export function broadcast(projectId: string, event: RealtimeEvent): void {
  const subs = projectSubscribers.get(projectId);
  if (!subs || subs.size === 0) return;
  const payload = JSON.stringify(event);
  for (const ws of subs) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function broadcastAdmin(event: RealtimeEvent): void {
  broadcast(ADMIN_CHANNEL, event);
}

export function createWebSocketServer(server: import("http").Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = req.url ?? "";
    if (!url.startsWith("/api/realtime")) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
    const projectId = params.get("project_id") ?? "";

    if (!projectId) {
      ws.close(1008, "project_id required");
      return;
    }

    subscribe(projectId, ws);

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    ws.on("close", () => {
      clearInterval(pingInterval);
      unsubscribe(projectId, ws);
    });

    ws.on("error", (err) => {
      console.error("[ws] error:", err.message);
    });
  });

  return wss;
}
