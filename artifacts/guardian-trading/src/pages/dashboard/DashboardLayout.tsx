import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";
import spinnerImg from "@assets/spinner-clean.png";
import {
  LayoutDashboard, Briefcase, ShoppingCart, PieChart,
  FileText, Settings, LogOut, Sun, Moon, Search, Bell,
  TrendingUp, TrendingDown, ChevronDown, BarChart3,
  MessageCircle,
} from "lucide-react";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";
import { useTheme } from "@/context/ThemeContext";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     href: "/dashboard"     },
  { icon: BarChart3,       label: "Markets",        href: "/markets"       },
  { icon: Briefcase,       label: "Positions",      href: "/positions"     },
  { icon: ShoppingCart,    label: "Orders",         href: "/orders"        },
  { icon: PieChart,        label: "Portfolio",      href: "/portfolio"     },
  { icon: FileText,        label: "Statements",     href: "/statements"    },
  { icon: Bell,            label: "Notifications",  href: "/notifications" },
  { icon: Settings,        label: "Settings",       href: "/settings"      },
];

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

const INITIAL_TICKERS: TickerItem[] = [
  { symbol: "AAPL", price: 187.24, change: 1.42 },
  { symbol: "TSLA", price: 248.50, change: -0.83 },
  { symbol: "NVDA", price: 875.10, change: 3.21 },
  { symbol: "AMD",  price: 162.80, change: -1.15 },
  { symbol: "MSFT", price: 418.20, change: 0.67 },
  { symbol: "META", price: 528.40, change: 2.14 },
  { symbol: "AMZN", price: 184.20, change: -0.42 },
  { symbol: "GOOG", price: 168.90, change: 0.89 },
  { symbol: "SPY",  price: 521.40, change: 0.34 },
  { symbol: "QQQ",  price: 447.80, change: 0.56 },
];

interface Props {
  children: React.ReactNode;
}

interface UserStatus {
  status: string;
  kycComplete: boolean;
  profilePicture: string | null;
}

export default function DashboardLayout({ children }: Props) {
  const [location, navigate] = useLocation();
  const { theme, colors, toggleTheme } = useTheme();

  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    const base = getApiBase();
    fetch(`${base}/api/user/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data: UserStatus & { completedSteps?: number[] }) => {
        setUserStatus(data);
        if (data.status !== "approved") {
          if (data.status === "resubmit_required" || data.status === "resubmit") {
            navigate("/kyc/resubmit");
          } else if (data.status === "reviewing") {
            navigate("/kyc/reviewing");
          } else if (data.status === "verified" && data.kycComplete) {
            navigate("/application-pending");
          } else if (data.status === "rejected") {
            navigate("/application-pending");
          } else if (data.status === "pending" && data.kycComplete) {
            navigate("/application-pending");
          } else {
            const stepPaths = [
              "/general-details", "/personal-details", "/professional-details",
              "/id-information", "/income-details", "/risk-tolerance",
              "/financial-situation", "/investment-experience", "/id-proof-upload",
              "/funding-details", "/disclosures", "/signatures",
            ];
            const nextStep = (data.completedSteps ?? []).length;
            navigate(stepPaths[nextStep] ?? "/general-details");
          }
          return;
        }
        setGateChecked(true);
      })
      .catch(() => { navigate("/login"); });
  }, [email]);

  useEffect(() => {
    if (!email) return;
    const base = getApiBase();
    const fetchNotifs = () => {
      fetch(`${base}/api/notifications?email=${encodeURIComponent(email)}`)
        .then((r) => r.json())
        .then((d: { unreadCount?: number }) => setUnreadCount(d.unreadCount ?? 0))
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [email]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(t => {
        const delta = (Math.random() - 0.48) * t.price * 0.001;
        const newPrice = parseFloat((t.price + delta).toFixed(2));
        const newChange = parseFloat((t.change + (Math.random() - 0.5) * 0.1).toFixed(2));
        return { ...t, price: newPrice, change: newChange };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!gateChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: colors.bg }}>
        <img src={spinnerImg} alt="Loading" className="spinner-img-rotate" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const profilePicUrl = userStatus?.profilePicture
    ? `${getApiBase()}/api/user/profile-picture/${userStatus.profilePicture}`
    : null;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: "240px", background: colors.sidebar, borderRight: `1px solid ${colors.sidebarBorder}` }}>
        <div style={{ padding: "20px 20px 16px" }}>
          <Link href="/dashboard">
            <img src={guardianLogo} alt="Guardian Trading" style={{ height: "30px", width: "auto", cursor: "pointer", opacity: 0.95 }} />
          </Link>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1" style={{ padding: "8px 12px" }}>
          {NAV.map(({ icon: Icon, label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={label} href={href}>
                <div
                  className="flex items-center gap-3 rounded-lg cursor-pointer"
                  style={{
                    padding: "10px 12px",
                    background: isActive ? colors.sidebarItemActiveBg : "transparent",
                    color: isActive ? colors.sidebarItemActive : colors.sidebarText,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = colors.sidebarItemHover; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ fontSize: "13.5px", fontWeight: isActive ? 600 : 400, letterSpacing: "-0.01em" }}>{label}</span>
                  {isActive && <div style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: colors.sidebarItemActive }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "0 12px 8px" }}>
          <div className="flex items-center gap-2 rounded-lg" style={{ padding: "10px 12px", background: colors.greenBg, border: `1px solid rgba(14,203,129,0.2)` }}>
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: "18px", height: "18px", background: colors.green }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span style={{ fontSize: "11px", color: colors.green, fontWeight: 600 }}>Account Approved</span>
          </div>
        </div>

        <div style={{ padding: "8px 12px 16px", borderTop: `1px solid ${colors.sidebarBorder}` }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full rounded-lg"
            style={{ padding: "10px 12px", background: "transparent", border: "none", color: colors.sidebarTextMuted, cursor: "pointer", fontSize: "13px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.red; (e.currentTarget as HTMLElement).style.background = colors.redBg; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.sidebarTextMuted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        <div className="hidden md:block overflow-hidden flex-shrink-0" style={{ background: colors.topBar, borderBottom: `1px solid ${colors.topBarBorder}` }}>
          <div className="flex items-center" style={{ padding: "0 8px", height: "32px" }}>
            <div className="flex items-center gap-6 overflow-hidden" style={{ animation: "tickerScroll 30s linear infinite" }}>
              {[...tickers, ...tickers].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                  <span style={{ fontSize: "11px", fontWeight: 600, color: colors.textSub }}>{t.symbol}</span>
                  <span style={{ fontSize: "11px", color: colors.textPrimary, fontWeight: 500 }}>${t.price.toFixed(2)}</span>
                  <span className="flex items-center gap-0.5" style={{ fontSize: "10px", fontWeight: 600, color: t.change >= 0 ? colors.green : colors.red }}>
                    {t.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <style>{`@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
        </div>

        <div className="flex items-center justify-between flex-shrink-0" style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${colors.topBarBorder}`,
          background: colors.topBar,
        }}>
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-lg" style={{
              padding: "7px 14px",
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
            }}>
              <Search size={14} color={colors.textMuted} />
              <input placeholder="Search markets, assets..." style={{
                flex: 1, border: "none", outline: "none", fontSize: "12.5px",
                color: colors.inputText, background: "transparent",
              }} />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              style={{
                width: "34px", height: "34px", borderRadius: "8px",
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                color: colors.textSub,
                cursor: "pointer",
              }}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            <div className="relative">
              <Link href="/notifications">
                <button className="flex items-center justify-center" style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.inputBg,
                  color: colors.bellColor,
                  cursor: "pointer",
                }}>
                  <Bell size={15} />
                </button>
              </Link>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                  style={{ width: "16px", height: "16px", background: colors.red, fontSize: "9px", fontWeight: 700 }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-lg cursor-pointer" style={{
              padding: "5px 12px 5px 5px",
              border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg,
            }}>
              {profilePicUrl ? (
                <img src={profilePicUrl} alt={displayName}
                  style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover" }} />
              ) : (
                <div className="flex items-center justify-center rounded-md font-bold text-white"
                  style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: "12px", borderRadius: "6px" }}>
                  {displayName[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="hidden lg:block">
                <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>{displayName}</p>
                <p style={{ fontSize: "10px", color: colors.textMuted, lineHeight: 1.2 }}>Pro Account</p>
              </div>
              <ChevronDown size={12} color={colors.textMuted} className="hidden lg:block" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{
          scrollbarWidth: "thin",
          scrollbarColor: `${colors.scrollbar} transparent`,
        }}>
          {children}
        </div>


        <nav className="flex md:hidden flex-shrink-0" style={{
          borderTop: `1px solid ${colors.topBarBorder}`,
          background: colors.sidebar,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {NAV.map(({ icon: Icon, label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={label} href={href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2"
                style={{ color: isActive ? colors.accent : colors.textMuted, textDecoration: "none", background: "none" }}>
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.5} />
                <span style={{ fontSize: "9px", fontWeight: isActive ? 700 : 400 }}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
