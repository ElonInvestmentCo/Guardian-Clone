import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

type ToastInput = { title: string; description?: string; duration?: number };

// ---------------------------------------------------------------------------
// Module-level event bus (imperative API works outside React tree)
// ---------------------------------------------------------------------------
type Listener = (item: ToastItem) => void;
const listeners: Listener[] = [];
let counter = 0;

function emit(variant: ToastVariant, input: ToastInput) {
  const item: ToastItem = {
    id: String(++counter),
    variant,
    title: input.title,
    description: input.description,
    duration: input.duration ?? 4000,
  };
  listeners.forEach((l) => l(item));
}

export const toast = {
  success: (title: string, description?: string, duration?: number) =>
    emit("success", { title, description, duration }),
  error: (title: string, description?: string, duration?: number) =>
    emit("error", { title, description, duration }),
  warning: (title: string, description?: string, duration?: number) =>
    emit("warning", { title, description, duration }),
  info: (title: string, description?: string, duration?: number) =>
    emit("info", { title, description, duration }),
};

// ---------------------------------------------------------------------------
// Context (optional — lets components consume toasts if needed)
// ---------------------------------------------------------------------------
const ToastContext = createContext<{ toasts: ToastItem[] }>({ toasts: [] });
export const useToastItems = () => useContext(ToastContext);

// ---------------------------------------------------------------------------
// CSS keyframes — injected once into <head> on first render
// ---------------------------------------------------------------------------
const STYLE_ID = "gt-toast-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* Icon circle spring-pop — success */
    @keyframes gt-icon-pop {
      0%   { transform: scale(0.3); opacity: 0; }
      55%  { transform: scale(1.18); opacity: 1; }
      75%  { transform: scale(0.93); }
      100% { transform: scale(1.0); opacity: 1; }
    }
    /* Checkmark stroke draw */
    @keyframes gt-check-draw {
      from { stroke-dashoffset: 22; }
      to   { stroke-dashoffset: 0; }
    }
    /* Icon circle for other variants — simpler fade+scale */
    @keyframes gt-icon-in {
      0%   { transform: scale(0.45); opacity: 0; }
      60%  { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(1.0);  opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------
type VariantConfig = {
  bg: string;
  iconBg: string;
  iconColor: string;
  glow: string;
};

const VARIANT_STYLES: Record<ToastVariant, VariantConfig> = {
  success: {
    bg: "#0d1a0d",
    iconBg: "#4ade80",
    iconColor: "#14532d",
    glow: "rgba(74,222,128,0.14)",
  },
  error: {
    bg: "#1a0d0d",
    iconBg: "#f87171",
    iconColor: "#7f1d1d",
    glow: "rgba(248,113,113,0.14)",
  },
  warning: {
    bg: "#1a150d",
    iconBg: "#fbbf24",
    iconColor: "#78350f",
    glow: "rgba(251,191,36,0.14)",
  },
  info: {
    bg: "#0d1020",
    iconBg: "#60a5fa",
    iconColor: "#1e3a5f",
    glow: "rgba(96,165,250,0.14)",
  },
};

// ---------------------------------------------------------------------------
// Animated icon
// ---------------------------------------------------------------------------
function SuccessIcon({ animKey }: { animKey: string }) {
  return (
    <svg
      key={animKey}
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <path
        d="M3.5 10.5L7.5 14.5L16.5 5.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="22"
        strokeDashoffset="22"
        style={{
          animation: `gt-check-draw 420ms cubic-bezier(0.22, 1, 0.36, 1) 210ms both`,
        }}
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 6L14 14M14 6L6 14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 6V11M10 13.5V14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 9V14M10 6.5V7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Individual toast visual
// ---------------------------------------------------------------------------
interface SingleToastProps {
  item: ToastItem;
  index: number;
  onRemove: (id: string) => void;
}

function SingleToast({ item, index, onRemove }: SingleToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const s = VARIANT_STYLES[item.variant];
  const isSuccess = item.variant === "success";

  useEffect(() => {
    injectKeyframes();
    const show = setTimeout(() => setVisible(true), 16);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 320);
    }, item.duration);
    return () => {
      clearTimeout(show);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onRemove]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 320);
    }, 1500);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(item.id), 320);
      }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        width: "min(520px, calc(100vw - 32px))",
        minHeight: "68px",
        padding: "12px 20px 12px 14px",
        borderRadius: "20px",
        background: s.bg,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
        backgroundImage: `radial-gradient(ellipse at 56px 50%, ${s.glow} 0%, transparent 62%)`,
        cursor: "pointer",
        transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        marginTop: index > 0 ? "10px" : 0,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Animated circle icon */}
      <div
        style={{
          flexShrink: 0,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: s.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: s.iconColor,
          boxShadow: `0 0 0 4px ${s.glow.replace("0.14", "0.2")}, 0 2px 8px rgba(0,0,0,0.3)`,
          animation: isSuccess
            ? "gt-icon-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both"
            : "gt-icon-in 380ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
        }}
      >
        {isSuccess ? (
          <SuccessIcon animKey={item.id} />
        ) : item.variant === "error" ? (
          <ErrorIcon />
        ) : item.variant === "warning" ? (
          <WarningIcon />
        ) : (
          <InfoIcon />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "12.5px",
              fontWeight: 400,
              lineHeight: 1.4,
              marginTop: "3px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuardianToaster — mount once in App.tsx
// ---------------------------------------------------------------------------
export function GuardianToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((item: ToastItem) => {
    setToasts((prev) => [...prev.slice(-4), item]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <ToastContext.Provider value={{ toasts }}>
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          {toasts.map((item, index) => (
            <SingleToast key={item.id} item={item} index={index} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>,
    document.body
  );
}
