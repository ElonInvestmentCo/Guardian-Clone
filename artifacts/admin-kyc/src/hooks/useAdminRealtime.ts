import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const ADMIN_CHANNEL = "guardian-admin";
const STORAGE_KEY = "guardian-admin-live-events";
const MAX_STORED = 100;

export interface RegistrationEvent {
  email: string;
  registeredAt: string;
  formattedAt: string;
  ipAddress?: string;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseAdminRealtimeOptions {
  onNewRegistration?: (event: RegistrationEvent) => void;
}

export function useAdminRealtime({ onNewRegistration }: UseAdminRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const onNewRegistrationRef = useRef(onNewRegistration);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  onNewRegistrationRef.current = onNewRegistration;

  const persistEvent = useCallback((event: RegistrationEvent) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored: RegistrationEvent[] = raw ? JSON.parse(raw) : [];
      stored.unshift(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, MAX_STORED)));
    } catch {}
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const wsPath = `${base}/api/realtime?project_id=${ADMIN_CHANNEL}`;
    const wsUrl = `${protocol}//${window.location.host}${wsPath}`;

    setStatus("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      setStatus("disconnected");
      reconnectTimer.current = setTimeout(connect, 5000);
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string);

        if (event.type === "NEW_USER_REGISTRATION" && event.data) {
          const regEvent = event.data as RegistrationEvent;
          persistEvent(regEvent);

          queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
          queryClient.invalidateQueries({ queryKey: ["registration-log"] });

          onNewRegistrationRef.current?.(regEvent);
        }
      } catch {}
    };

    ws.onclose = () => {
      setStatus("disconnected");
      reconnectTimer.current = setTimeout(connect, 4000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [queryClient, persistEvent]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const getStoredEvents = useCallback((): RegistrationEvent[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const clearStoredEvents = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { status, getStoredEvents, clearStoredEvents };
}
