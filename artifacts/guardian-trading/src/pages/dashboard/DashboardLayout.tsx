import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, CreditCard, Send, BarChart2,
  ArrowLeftRight, Settings, LogOut,
} from "lucide-react";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/dashboard"   },
  { icon: CreditCard,      label: "Positions",   href: "/positions"   },
  { icon: Send,            label: "Orders",      href: "/orders"      },
  { icon: BarChart2,       label: "Portfolio",   href: "/portfolio"   },
  { icon: ArrowLeftRight,  label: "Statements",  href: "/statements"  },
  { icon: Settings,        label: "Settings",    href: "/settings"    },
];

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f2f5", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: "220px", background: "#1c2e3e", padding: "0" }}>
        {/* Logo */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/dashboard">
            <img src={guardianLogo} alt="Guardian Trading" style={{ height: "34px", width: "auto", cursor: "pointer" }} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5" style={{ padding: "14px 10px", flex: 1 }}>
          {NAV.map(({ icon: Icon, label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={label} href={href}>
                <div
                  className="flex items-center gap-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    padding: "9px 12px",
                    background: isActive ? "#3a7bd5" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Icon size={16} />
                  <span style={{ fontSize: "13.5px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Verified badge */}
        <div style={{ padding: "0 10px 10px" }}>
          <div className="flex items-center gap-2 rounded-lg" style={{ padding: "8px 12px", background: "rgba(40,167,69,0.15)", border: "1px solid rgba(40,167,69,0.3)" }}>
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: "18px", height: "18px", background: "#28a745" }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: "11px", color: "#4fc86a", fontWeight: 600 }}>Account Verified</span>
          </div>
        </div>

        {/* Log out */}
        <div style={{ padding: "0 10px 18px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", marginTop: "4px" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg"
            style={{ padding: "9px 12px", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13.5px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
