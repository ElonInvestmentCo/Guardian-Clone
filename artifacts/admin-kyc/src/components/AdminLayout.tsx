import { useState, useRef, useEffect, useCallback } from "react";
import { clearSession } from "@/lib/api";
import { getAdminNotifications, markAdminNotificationsRead } from "@/lib/api";
import type { AdminNotification } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export type View = "dashboard" | "kyc" | "risk" | "audit" | "users" | "activity" | "registrations" | "sig-audit" | "signatures";

interface NavItem { id: View; label: string; icon: string; }

const NAV: NavItem[] = [
  { id: "dashboard",     label: "Dashboard",        icon: "bi-speedometer2" },
  { id: "kyc",           label: "KYC Queue",         icon: "bi-clipboard-check" },
  { id: "users",         label: "Users",             icon: "bi-people" },
  { id: "signatures",    label: "Signatures",        icon: "bi-pen-fill" },
  { id: "registrations", label: "Registrations",     icon: "bi-person-plus" },
  { id: "risk",          label: "Risk Events",       icon: "bi-exclamation-triangle" },
  { id: "activity",      label: "Activity Logs",     icon: "bi-activity" },
  { id: "audit",         label: "Audit Log",         icon: "bi-shield-check" },
  { id: "sig-audit",     label: "Signature Audit",   icon: "bi-pen" },
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

interface Props {
  activeView: View;
  setActiveView: (v: View) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeView, setActiveView, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const data = await getAdminNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    } finally {
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
    if (searchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setSearchOpen(false); setNotifOpen(false); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const handleLogout = () => {
    clearSession();
    window.dispatchEvent(new CustomEvent("admin:session-expired"));
  };

  const handleNav = (v: View) => {
    setActiveView(v);
    setSidebarOpen(false);
  };

  const markAllRead = async () => {
    try {
      await markAdminNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const markOneRead = async (id: string) => {
    try {
      await markAdminNotificationsRead([id]);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

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

      {searchOpen && (
        <div className="admin-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="admin-search-overlay-inner" onClick={e => e.stopPropagation()}>
            <i className="bi bi-search admin-search-overlay-icon" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Search..."
              className="admin-search-overlay-input"
            />
            <button
              className="admin-search-overlay-close"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
      )}

      <header className="safee-header">
        <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
          <i className="bi bi-list" />
        </button>

        <div className="header-title">
          {NAV.find(n => n.id === activeView)?.label || "Dashboard"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }} />

        <button
          className="header-icon-btn"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <i className="bi bi-search" />
        </button>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <i className={`bi ${theme === "light" ? "bi-moon-stars-fill" : "bi-sun-fill"}`} />
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
    </div>
  );
}
