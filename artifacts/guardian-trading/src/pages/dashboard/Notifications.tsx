import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { useLocation } from "wouter";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function NotificationsPage() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const email = sessionStorage.getItem("signupEmail") ?? "";

  const fetchNotifications = useCallback(() => {
    if (!email) return;
    fetch(`${API}/api/notifications?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data: { notifications: Notification[] }) => {
        setNotifications(data.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [email]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = (ids: string[]) => {
    fetch(`${API}/api/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ids }),
    }).then(() => fetchNotifications());
  };

  const markAllRead = () => {
    fetch(`${API}/api/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(() => fetchNotifications());
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeColors: Record<string, { bg: string; icon: string; border: string }> = {
    kyc: { bg: "#EFF6FF", icon: "#2563EB", border: "#BFDBFE" },
    account: { bg: "#F0FDF4", icon: "#16A34A", border: "#BBF7D0" },
    alert: { bg: "#FEF2F2", icon: "#DC2626", border: "#FECACA" },
    system: { bg: "#F5F3FF", icon: "#7C3AED", border: "#DDD6FE" },
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Notifications</h1>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 0" }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "8px", border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.accent, fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Bell size={48} color={colors.textMuted} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
            <p style={{ fontSize: "16px", fontWeight: 600, color: colors.textPrimary, margin: "0 0 8px" }}>No notifications yet</p>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: 0 }}>
              You'll receive notifications for KYC updates, account activity, and system alerts.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notifications.map((n) => {
              const tc = typeColors[n.type] ?? typeColors.system!;
              return (
                <div
                  key={n.id}
                  style={{
                    padding: "16px", borderRadius: "10px",
                    background: n.read ? colors.card ?? "#fff" : tc.bg,
                    border: `1px solid ${n.read ? colors.inputBorder : tc.border}`,
                    opacity: n.read ? 0.7 : 1,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (!n.read) markRead([n.id]);
                    if (n.actionUrl) navigate(n.actionUrl);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: tc.bg, border: `1px solid ${tc.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Bell size={16} color={tc.icon} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{n.title}</span>
                        <span style={{ fontSize: "11px", color: colors.textMuted, flexShrink: 0 }}>{formatTime(n.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: colors.textSub, margin: "4px 0 0", lineHeight: 1.5 }}>{n.message}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                        {n.actionUrl && (
                          <span style={{ fontSize: "11px", color: colors.accent, fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                            View details <ExternalLink size={10} />
                          </span>
                        )}
                        {!n.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead([n.id]); }}
                            style={{
                              fontSize: "11px", color: colors.textMuted, display: "flex", alignItems: "center", gap: "4px",
                              background: "none", border: "none", cursor: "pointer", padding: 0,
                            }}
                          >
                            <Check size={10} /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.accent, flexShrink: 0, marginTop: "4px" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
