import { useEffect, useState } from "react";

export type ToastType = "registration" | "kyc_complete" | "success" | "info" | "error";

export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  subtext?: string;
}

interface AdminToastProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function ToastIcon({ type }: { type: ToastType }) {
  const icons: Record<ToastType, string> = {
    registration: "bi-person-plus-fill",
    kyc_complete: "bi-shield-check",
    success: "bi-check2",
    info: "bi-info-lg",
    error: "bi-x-lg",
  };
  const colors: Record<ToastType, string> = {
    registration: "#22C55E",
    kyc_complete: "#3B82F6",
    success: "#22C55E",
    info: "#F59E0B",
    error: "#EF4444",
  };

  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%",
      background: colors[type],
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: `0 0 12px ${colors[type]}55`,
    }}>
      <i className={`bi ${icons[type]}`} style={{ fontSize: 16, color: "#fff" }} />
    </div>
  );
}

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => setVisible(false), 7600);
    const t3 = setTimeout(() => onDismiss(toast.id), 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [toast.id, onDismiss]);

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        background: "linear-gradient(135deg, #071507 0%, #0C1F0C 100%)",
        border: "1px solid rgba(34,197,94,0.30)",
        borderRadius: 14, padding: "14px 18px",
        boxShadow: "0 0 0 1px rgba(34,197,94,0.08), 0 12px 40px rgba(0,0,0,0.7), 0 0 24px rgba(34,197,94,0.05)",
        cursor: "pointer", userSelect: "none",
        minWidth: 300, maxWidth: 380,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1)",
        backdropFilter: "blur(8px)",
      }}
    >
      <ToastIcon type={toast.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.3, marginBottom: 3 }}>
          {toast.title}
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.4 }}>
          {toast.message}
        </div>
        {toast.subtext && (
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 3 }}>
            {toast.subtext}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminToast({ toasts, onDismiss }: AdminToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 99999,
      display: "flex", flexDirection: "column", gap: 10,
      pointerEvents: "none",
    }}>
      {[...toasts].reverse().map(toast => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <SingleToast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
