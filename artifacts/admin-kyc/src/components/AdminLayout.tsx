import { useState } from "react";
import { clearSession } from "@/lib/api";

export type View = "dashboard" | "kyc" | "risk" | "audit" | "users" | "activity";

interface NavItem { id: View; label: string; icon: string; }

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { id: "kyc", label: "KYC Queue", icon: "bi-clipboard-check" },
  { id: "users", label: "Users", icon: "bi-people" },
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
          <img src={`${basePath}logo-white.png`} alt="Guardiian Trading" style={{ height: 28 }} />
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

      <header className="safee-header">
        <button className="mobile-sidebar-toggle" onClick={() => setSidebarOpen(true)}>
          <i className="bi bi-list" />
        </button>

        <div style={{ fontSize: 16, fontWeight: 600, color: "#1E293B" }}>
          {NAV.find(n => n.id === activeView)?.label || "Dashboard"}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search..."
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              padding: "6px 14px 6px 34px",
              fontSize: 13,
              background: "#F8F9FC",
              outline: "none",
              width: 200,
              color: "#3C4858",
            }}
            readOnly
          />
          <i className="bi bi-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }} />
        </div>

        <button style={{ background: "none", border: "none", position: "relative", cursor: "pointer", padding: 4 }}>
          <i className="bi bi-bell" style={{ fontSize: 18, color: "#64748B" }} />
        </button>

        <div
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #0D6EFD, #7A5AF8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          A
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
