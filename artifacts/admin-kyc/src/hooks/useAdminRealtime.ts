import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const ADMIN_CHANNEL = "guardian-admin";
const STORAGE_KEY = "guardian-admin-live-events";
const MAX_STORED = 100;
const HEARTBEAT_TIMEOUT_MS = 65_000;

export interface RegistrationEvent {
  email: string;
  registeredAt: string;
  formattedAt: string;
  ipAddress?: string;
}

export interface ApplicationCompleteEvent {
  email: string;
  completedAt: string;
  formattedAt: string;
  totalSteps: number;
}

export interface StepCompletedEvent {
  email: string;
  stepKey: string;
  stepNumber: number;
  totalCompleted: number;
  totalSteps: number;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface UseAdminRealtimeOptions {
  onNewRegistration?: (event: RegistrationEvent) => void;
  onApplicationComplete?: (event: ApplicationCompleteEvent) => void;
  onStepCompleted?: (event: StepCompletedEvent) => void;
}

export function useAdminRealtime({
  onNewRegistration,
  onApplicationComplete,
  onStepCompleted,
}: UseAdminRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const heartbeatTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbacksRef = useRef({ onNewRegistration, onApplicationComplete, onStepCompleted });
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  callbacksRef.current = { onNewRegistration, onApplicationComplete, onStepCompleted };

  const resetHeartbeat = useCallback((reconnectFn: () => void) => {
    clearTimeout(heartbeatTimer.current);
    heartbeatTimer.current = setTimeout(() => {
      console.warn("[AdminRealtime] Heartbeat timeout — reconnecting");
      wsRef.current?.close();
      reconnectFn();
    }, HEARTBEAT_TIMEOUT_MS);
  }, []);

  const persistEvent = useCallback((event: RegistrationEvent) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored: RegistrationEvent[] = raw ? JSON.parse(raw) : [];
      stored.unshift(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, MAX_STORED)));
    } catch {}
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
    const wsUrl = `${protocol}//${window.location.host}${base}/api/realtime?project_id=${ADMIN_CHANNEL}`;

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
      resetHeartbeat(connect);
    };

    ws.onmessage = (e) => {
      resetHeartbeat(connect);
      try {
        const event = JSON.parse(e.data as string);

        if (event.type === "ping") return;

        if (event.type === "NEW_USER_REGISTRATION" && event.data) {
          const regEvent = event.data as RegistrationEvent;
          persistEvent(regEvent);
          queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
          queryClient.invalidateQueries({ queryKey: ["registration-log"] });
          callbacksRef.current.onNewRegistration?.(regEvent);
        }

        if (event.type === "APPLICATION_COMPLETE" && event.data) {
          const appEvent = event.data as ApplicationCompleteEvent;
          queryClient.invalidateQueries({ queryKey: ["registration-log"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
          callbacksRef.current.onApplicationComplete?.(appEvent);
        }

        if (event.type === "new_event" && event.data?.eventType === "STEP_COMPLETED") {
          const stepEvent = event.data as StepCompletedEvent;
          callbacksRef.current.onStepCompleted?.(stepEvent);
        }
      } catch {}
    };

    ws.onclose = () => {
      clearTimeout(heartbeatTimer.current);
      setStatus("disconnected");
      reconnectTimer.current = setTimeout(connect, 4000);
    };

    ws.onerror = () => { ws.close(); };
  }, [queryClient, persistEvent, resetHeartbeat]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearTimeout(heartbeatTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const getStoredEvents = useCallback((): RegistrationEvent[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const clearStoredEvents = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { status, getStoredEvents, clearStoredEvents };
}
