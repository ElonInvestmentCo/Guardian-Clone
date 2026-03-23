import { clearSession } from "@/lib/api";

export type View = "kyc" | "risk" | "audit" | "users" | "activity";

interface NavItem { id: View; label: string; icon: React.ReactNode; shortLabel: string; }

const NAV: NavItem[] = [
  {
    id: "kyc",
    label: "KYC Queue",
    shortLabel: "Queue",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    shortLabel: "Users",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "risk",
    label: "Risk Events",
    shortLabel: "Risk",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity Logs",
    shortLabel: "Activity",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: "audit",
    label: "Audit Log",
    shortLabel: "Audit",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

interface Props {
  activeView: View;
  setActiveView: (v: View) => void;
  children: React.ReactNode;
}

export default function AdminLayout({ activeView, setActiveView, children }: Props) {
  const handleLogout = () => {
    clearSession();
    window.dispatchEvent(new CustomEvent("admin:session-expired"));
  };

  const handleNav = (v: View) => {
    setActiveView(v);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F4F8]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Desktop sidebar — hidden on mobile, visible at md+ */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#1E3A5F] flex-shrink-0">
        <SidebarContent activeView={activeView} onNav={handleNav} onLogout={handleLogout} />
      </aside>

      {/* Main column */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Content area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Mobile bottom nav — visible on mobile only, safe-area aware */}
        <nav
          className="flex md:hidden flex-shrink-0 border-t border-gray-200 bg-white"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {NAV.map(({ id, shortLabel, icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors"
              style={{
                color: activeView === id ? "#2563EB" : "#6B7280",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {icon}
              <span style={{ fontSize: "9px", fontWeight: activeView === id ? "700" : "400" }}>
                {shortLabel}
              </span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}

// ── Shared sidebar content ─────────────────────────────────────────────────────

function SidebarContent({
  activeView,
  onNav,
  onLogout,
}: {
  activeView: View;
  onNav: (v: View) => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-[14px] leading-tight">Guardian</div>
            <div className="text-white/50 text-[9px] tracking-[0.08em] uppercase leading-tight">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3 border-t border-white/10" />

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "6px",
                border: "none",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "white" : "rgba(255,255,255,0.58)",
                fontSize: "13px",
                fontWeight: active ? "600" : "400",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{icon}</span>
              {label}
              {active && (
                <span style={{ marginLeft: "auto", width: "3px", height: "16px", borderRadius: "2px", background: "#76D0F4", flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="text-white/35 text-[10px] mb-2 truncate">Logged in as admin</div>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.45)",
            fontSize: "12px",
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );
}
