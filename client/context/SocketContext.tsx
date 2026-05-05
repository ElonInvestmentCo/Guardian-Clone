import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io as socketIO, type Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { getApiBase } from "@/lib/api";
import { toast } from "@/lib/guardian-toast";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const base = getApiBase() || window.location.origin;

    const socket = socketIO(base, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io/",
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[Socket.io] Real-time feed connected");
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.log("[Socket.io] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket.io] Connection error:", err.message);
    });

    socket.on("ai:alert", (data: {
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      message: string;
      recommendedAction?: string;
    }) => {
      const suffix = data.recommendedAction ? ` — ${data.recommendedAction}` : "";
      if (data.severity === "HIGH") {
        toast.error(`${data.message}${suffix}`);
      } else if (data.severity === "MEDIUM") {
        toast.warning(`${data.message}${suffix}`);
      } else {
        toast.info(`${data.message}${suffix}`);
      }
    });

    socket.on("ai:signal", (data: {
      asset: string;
      action: "BUY" | "SELL";
      confidence: number;
      entryPrice: number;
    }) => {
      const pct = Math.round((data.confidence ?? 0) * 100);
      const arrow = data.action === "BUY" ? "↑" : "↓";
      toast.info(`AI Signal ${arrow} ${data.action} ${data.asset} @ $${data.entryPrice} (${pct}% confidence)`);
    });

    socket.on("trade:executed", (data: {
      symbol: string;
      side: string;
      qty: number;
      price: number;
    }) => {
      toast.success(`Trade executed: ${data.side} ${data.qty} ${data.symbol} @ $${data.price}`);
    });

    socket.on("system:notification", (data: { message: string; type: string }) => {
      if (data.type !== "connected") {
        toast.info(data.message);
      }
    });

    socket.on("account:balance_update", (_data: unknown) => {
      /* silently received — components subscribe directly if needed */
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
