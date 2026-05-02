import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { clearSession, getFundRequests } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { isChimeMuted, setChimeMuted } from "@/lib/guardian-toast";

export type View = "dashboard" | "kyc" | "risk" | "audit" | "users" | "activity" | "funds" | "orders";

interface NavItem { id: View; label: string; icon: string; }

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard",    icon: "bi-speedometer2" },
  { id: "kyc",       label: "KYC Queue",    icon: "bi-clipboard-check" },
  { id: "users",     label: "Users",        icon: "bi-people" },
  { id: "funds",     label: "Fund Requests", icon: "bi-cash-stack" },
  { id: "orders",    label: "Orders",       icon: "bi-bar-chart-line" },
  { id: "risk",      label: "Risk Events",  icon: "bi-exclamation-triangle" },
  { id: "activity",  label: "Activity Logs", icon: "bi-activity" },
  { id: "audit",     label: "Audit Log",    icon: "bi-shield-check" },
];

const TYPE_ICONS: Record<string, string> = {
  registration: "bi-person-plus-fill",
  signature: "bi-pen-fill",
  kyc_complete: "bi-clipboard-check-fill",
  deposit: "bi-arrow-down-circle-fill",
  withdrawal: "bi-arrow-up-circle-fill",
  adjustment: "bi-pencil-fill",
  default: "bi-bell-fill",
};

const TYPE_COLORS: Record<string, string> = {
  registration: "#0D6EFD",
  signature: "#7A5AF8",
  kyc_complete: "#198754",
  deposit: "#198754",
  withdrawal: "#DC3545",
  adjustment: "#FFC107",
  default: "#64748B",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  userEmail: string | null;
  isRead: boolean;
  createdAt: string;
}

function getToken(): string | null {
  return localStorage.getItem("guardianAdminToken");
}

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL?.replace(/\/$/, "") ?? "";

interface Props {
  activeView: View;
  setActiveView: (v: View) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeView, setActiveView, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const [chimeMuted, setChimeMutedState] = useState(() => isChimeMuted());
  const [mutePill, setMutePill] = useState<{ visible: boolean; hiding: boolean; muted: boolean }>({ visible: false, hiding: false, muted: false });
  const mutePillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutePillHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleMute = useCallback(() => {
    setChimeMutedState(prev => {
      const next = !prev;
      setChimeMuted(next);

      if (mutePillTimer.current) clearTimeout(mutePillTimer.current);
      if (mutePillHideTimer.current) clearTimeout(mutePillHideTimer.current);

      setMutePill({ visible: true, hiding: false, muted: next });

      mutePillTimer.current = setTimeout(() => {
        setMutePill(p => ({ ...p, hiding: true }));
        mutePillHideTimer.current = setTimeout(() => {
          setMutePill(p => ({ ...p, visible: false, hiding: false }));
        }, 300);
      }, 1600);

      return next;
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setNotifLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json() as { notifications: AdminNotification[]; unreadCount: number };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch { /* ignore */ } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (profileOpen || notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, notifOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNotifOpen(false);

      if (
        e.key === "m" || e.key === "M"
      ) {
        const tag = (e.target as HTMLElement)?.tagName;
        const editable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
          || (e.target as HTMLElement)?.isContentEditable;
        if (!editable && !e.ctrlKey && !e.metaKey && !e.altKey) {
          handleToggleMute();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleToggleMute]);

  const handleLogout = () => {
    clearSession();
    window.dispatchEvent(new CustomEvent("admin:session-expired"));
  };

  const handleNav = (v: View) => {
    setActiveView(v);
    setSidebarOpen(false);
  };

  const markAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/admin/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const markOneRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/api/admin/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const { data: pendingFundData } = useQuery({
    queryKey: ["fund-requests", "pending"],
    queryFn: () => getFundRequests("pending"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const pendingFundCount = pendingFundData?.requests.length ?? 0;

  const basePath = import.meta.env.BASE_URL || "/";

  return (
    <div>
      <div className={`mobile-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`safee-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="sidebar-brand">
          <img src={`${basePath}logo-white.png`} alt="Guardian Trading" className="sidebar-logo" />
        </div>

        <div className="sidebar-nav">
          {NAV.map(({ id, label, icon }) => (
            <div className="nav-item" key={id}>
              <button
                className={`nav-link ${activeView === id ? "active" : ""}`}
                onClick={() => handleNav(id)}
              >
                <i className={`bi ${icon}`} />
                {label}
                {id === "funds" && pendingFundCount > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: activeView === id ? "rgba(255,255,255,0.25)" : "#FFC107",
                    color: activeView === id ? "#fff" : "#1a1a1a",
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                    lineHeight: 1,
                    boxShadow: activeView === id ? "none" : "0 1px 4px rgba(255,193,7,0.45)",
                    flexShrink: 0,
                  }}>
                    {pendingFundCount > 99 ? "99+" : pendingFundCount}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>
            Logged in as admin
          </div>
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ padding: "8px 0", color: "rgba(255,255,255,0.5)" }}
          >
            <i className="bi bi-box-arrow-left" />
            Sign Out
          </button>
        </div>
      </aside>

      <header className="safee-header">
        <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
          <i className="bi bi-list" />
        </button>

        <div className="header-title">
          {NAV.find(n => n.id === activeView)?.label || "Dashboard"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        <div className="header-search">
          <input type="text" placeholder="Search..." disabled />
          <i className="bi bi-search" />
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <i className={`bi ${theme === "light" ? "bi-moon-stars-fill" : "bi-sun-fill"}`} />
        </button>

        <button
          className="theme-toggle-btn"
          onClick={handleToggleMute}
          aria-label={chimeMuted ? "Unmute success chime" : "Mute success chime"}
          title={chimeMuted ? "Unmute success chime" : "Mute success chime"}
        >
          <i className={`bi ${chimeMuted ? "bi-volume-mute-fill" : "bi-volume-up-fill"}`} />
        </button>

        {/* Notification Bell */}
        <div className="admin-notif-wrapper" ref={notifRef}>
          <button
            className={`header-icon-btn admin-notif-btn ${notifOpen ? "active" : ""}`}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-haspopup="true"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen(o => !o)}
          >
            <i className={`bi ${unreadCount > 0 ? "bi-bell-fill" : "bi-bell"}`} style={{ color: unreadCount > 0 ? "var(--primary)" : undefined }} />
            {unreadCount > 0 && (
              <span className="admin-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="admin-notif-dropdown" role="dialog" aria-label="Notifications">
              <div className="admin-notif-header">
                <span className="admin-notif-title">
                  Notifications
                  {unreadCount > 0 && <span className="admin-notif-count">{unreadCount}</span>}
                </span>
                {unreadCount > 0 && (
                  <button className="admin-notif-mark-all" onClick={markAllRead}>
                    <i className="bi bi-check2-all" /> Mark all read
                  </button>
                )}
              </div>

              <div className="admin-notif-list">
                {notifLoading && notifications.length === 0 ? (
                  <div className="admin-notif-empty">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="admin-notif-empty">
                    <i className="bi bi-bell-slash" style={{ fontSize: 28, marginBottom: 8, display: "block", opacity: 0.4 }} />
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 15).map(n => {
                    const icon = TYPE_ICONS[n.type] ?? TYPE_ICONS.default;
                    const color = TYPE_COLORS[n.type] ?? TYPE_COLORS.default;
                    return (
                      <div
                        key={n.id}
                        className={`admin-notif-item ${!n.isRead ? "unread" : ""}`}
                        onClick={() => { if (!n.isRead) markOneRead(n.id); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === "Enter" && !n.isRead) markOneRead(n.id); }}
                      >
                        <div className="admin-notif-icon" style={{ background: `${color}18`, color }}>
                          <i className={`bi ${icon}`} />
                        </div>
                        <div className="admin-notif-body">
                          <div className="admin-notif-item-title">{n.title}</div>
                          <div className="admin-notif-item-msg">{n.message}</div>
                          <div className="admin-notif-item-time">{timeAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div className="admin-notif-dot" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-profile-wrapper" ref={profileRef}>
          <button
            className="header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Admin profile menu"
            aria-expanded={profileOpen}
          >
            A
          </button>

          {profileOpen && (
            <div className="header-profile-dropdown">
              <div className="profile-dropdown-header">
                <strong>Admin</strong>
                <span>guardian_admin</span>
              </div>
              <hr style={{ margin: "4px 0", borderColor: "#e5e7eb" }} />
              <button className="profile-dropdown-item" onClick={handleLogout}>
                <i className="bi bi-box-arrow-left" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="safee-main">
        <div className={`view-wrapper ${activeView === "dashboard" ? "with-padding" : ""}`}>
          {children}
        </div>
      </main>

      {mutePill.visible && (
        <div className={`gt-mute-pill${mutePill.hiding ? " hiding" : ""}`}>
          <i className={`bi ${mutePill.muted ? "bi-volume-mute-fill" : "bi-volume-up-fill"}`} style={{ fontSize: 15 }} />
          {mutePill.muted ? "Muted" : "Sound on"}
        </div>
      )}
    </div>
  );
}
