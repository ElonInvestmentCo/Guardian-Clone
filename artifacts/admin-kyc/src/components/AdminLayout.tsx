import { useState, useRef, useEffect } from "react";
import { clearSession } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export type View = "dashboard" | "kyc" | "risk" | "audit" | "users" | "activity" | "registrations";

interface NavItem { id: View; label: string; icon: string; }

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { id: "kyc", label: "KYC Queue", icon: "bi-clipboard-check" },
  { id: "users", label: "Users", icon: "bi-people" },
  { id: "registrations", label: "Registrations", icon: "bi-person-plus" },
  { id: "risk", label: "Risk Events", icon: "bi-exclamation-triangle" },
  { id: "activity", label: "Activity Logs", icon: "bi-activity" },
  { id: "audit", label: "Audit Log", icon: "bi-shield-check" },
];

interface Props {
  activeView: View;
  setActiveView: (v: View) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeView, setActiveView, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
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

        <button className="header-icon-btn" aria-label="Notifications">
          <i className="bi bi-bell" />
        </button>

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
