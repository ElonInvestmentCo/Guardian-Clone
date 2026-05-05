import { useState, useEffect, useCallback } from "react";
import { Activity as ActivityIcon, LogIn, Shield, Bell, Settings, User, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { getApiBase } from "@/lib/api";

interface ActivityEvent {
  id: string;
  type: "login" | "security" | "notification" | "settings" | "kyc" | "system";
  title: string;
  description: string;
  timestamp: string;
  severity?: "info" | "warning" | "success";
}

function typeIcon(type: ActivityEvent["type"], colors: { accent: string; yellow: string; green: string; textMuted: string; purple: string }) {
  const map: Record<ActivityEvent["type"], { icon: React.ReactNode; bg: string }> = {
    login:        { icon: <LogIn size={14} color={colors.accent} />,     bg: "rgba(59,130,246,0.12)" },
    security:     { icon: <Shield size={14} color={colors.yellow} />,    bg: "rgba(234,179,8,0.12)" },
    notification: { icon: <Bell size={14} color={colors.purple} />,      bg: "rgba(167,139,250,0.12)" },
    settings:     { icon: <Settings size={14} color={colors.textMuted} />, bg: "rgba(128,128,128,0.1)" },
    kyc:          { icon: <User size={14} color={colors.green} />,        bg: "rgba(34,197,94,0.12)" },
    system:       { icon: <ActivityIcon size={14} color={colors.accent} />, bg: "rgba(59,130,246,0.1)" },
  };
  return map[type] ?? map.system;
}

function severityBadge(sev: ActivityEvent["severity"], colors: { green: string; greenBg: string; yellow: string; yellowBg: string; accent: string; textMuted: string; filterBar: string }) {
  if (!sev || sev === "info") return null;
  const cfg = sev === "success"
    ? { label: "Success", color: colors.green,  bg: colors.greenBg }
    : { label: "Warning", color: colors.yellow, bg: colors.yellowBg };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildSessionEvents(): ActivityEvent[] {
  const email = sessionStorage.getItem("signupEmail") ?? "";
  const events: ActivityEvent[] = [];
  const now = new Date();

  events.push({
    id: "session-current",
    type: "login",
    title: "Session started",
    description: `Signed in as ${email}`,
    timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
    severity: "success",
  });

  const stored = localStorage.getItem("gt-activity-log");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ActivityEvent[];
      events.push(...parsed.slice(0, 10));
    } catch { /* ignore */ }
  }

  return events;
}

export default function ActivityPage() {
  const { colors } = useTheme();
  const email = sessionStorage.getItem("signupEmail") ?? "";
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ActivityEvent["type"]>("all");
  const base = getApiBase();

  const fetchActivity = useCallback(async () => {
    const sessionEvents = buildSessionEvents();
    const apiEvents: ActivityEvent[] = [];

    try {
      const res = await fetch(`${base}/api/notifications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json() as { notifications: Array<{ id: string; type: string; title: string; message: string; createdAt: string; read: boolean }> };
        for (const n of (data.notifications ?? []).slice(0, 8)) {
          apiEvents.push({
            id: `notif-${n.id}`,
            type: "notification",
            title: n.title,
            description: n.message,
            timestamp: n.createdAt,
            severity: n.read ? "info" : "info",
          });
        }
      }
    } catch { /* ignore */ }

    const combined = [...sessionEvents, ...apiEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setEvents(combined);
    setLoading(false);
  }, [email, base]);

  useEffect(() => {
    const ev: ActivityEvent = {
      id: `login-${Date.now()}`,
      type: "login",
      title: "Login recorded",
      description: `Account accessed from this browser`,
      timestamp: new Date().toISOString(),
      severity: "success",
    };
    try {
      const existing = JSON.parse(localStorage.getItem("gt-activity-log") ?? "[]") as ActivityEvent[];
      const updated = [ev, ...existing].slice(0, 50);
      localStorage.setItem("gt-activity-log", JSON.stringify(updated));
    } catch { /* ignore */ }
    fetchActivity();
  }, []);

  const FILTER_TABS: { key: "all" | ActivityEvent["type"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "login", label: "Logins" },
    { key: "security", label: "Security" },
    { key: "notification", label: "Notifications" },
    { key: "settings", label: "Settings" },
  ];

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px", maxWidth: "860px" }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Activity</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Login history, security events & account actions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Events",    value: events.length.toString(), icon: <ActivityIcon size={16} color={colors.accent} />,  bg: "rgba(59,130,246,0.1)" },
            { label: "Login Events",    value: events.filter(e => e.type === "login").length.toString(), icon: <LogIn size={16} color={colors.green} />, bg: colors.greenBg },
            { label: "Notifications",   value: events.filter(e => e.type === "notification").length.toString(), icon: <Bell size={16} color={colors.purple} />, bg: "rgba(167,139,250,0.1)" },
            { label: "Security Events", value: events.filter(e => e.type === "security").length.toString(), icon: <Shield size={16} color={colors.yellow} />, bg: colors.yellowBg },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px" }}>
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</p>
                <div className="flex items-center justify-center rounded-lg" style={{ width: "28px", height: "28px", background: bg }}>{icon}</div>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 p-1 rounded-xl overflow-x-auto" style={{ background: colors.filterBar }}>
          {FILTER_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: filter === key ? colors.card : "transparent",
              color: filter === key ? colors.textPrimary : colors.textMuted,
              boxShadow: filter === key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: "48px", color: colors.textMuted }}>
              <div style={{ width: "20px", height: "20px", border: `2px solid ${colors.inputBorder}`, borderTop: `2px solid ${colors.accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: "48px", color: colors.textMuted }}>
              <Clock size={32} color={colors.textMuted} style={{ marginBottom: "12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textSub, marginBottom: "4px" }}>No events yet</p>
              <p style={{ fontSize: "12px" }}>Activity will appear here as you use your account</p>
            </div>
          ) : (
            <div>
              {filtered.map((ev, idx) => {
                const { icon, bg } = typeIcon(ev.type, colors);
                return (
                  <div key={ev.id} className="flex items-start gap-4" style={{
                    padding: "16px 20px",
                    borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.tableRowBorder}` : "none",
                  }}>
                    <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: "36px", height: "36px", background: bg, marginTop: "1px" }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{ev.title}</p>
                        {severityBadge(ev.severity, colors)}
                      </div>
                      <p style={{ fontSize: "12px", color: colors.textMuted }}>{ev.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: colors.textMuted }}>
                      <Clock size={11} />
                      <span style={{ fontSize: "11px" }}>{formatTime(ev.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "12px", textAlign: "center" }}>
          Activity log is retained locally. For complete audit history, contact support.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );
}
