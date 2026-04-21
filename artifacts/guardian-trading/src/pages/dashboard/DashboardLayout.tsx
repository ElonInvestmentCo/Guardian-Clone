import { useLocation, Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";
import { getApiBase } from "@/lib/api";
import {
  LayoutDashboard, Briefcase, ShoppingCart, PieChart,
  FileText, Settings, LogOut, Sun, Moon, Search, Bell,
  TrendingUp, TrendingDown, ChevronDown, BarChart3,
  X, CheckCheck, ExternalLink,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";


const LOGO_URL = "/images/img-guardian-logo-reversed.png";

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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const API = getApiBase();

  const fetchNotifications = useCallback(() => {
    if (!email) return;
    setNotifLoading(true);
    fetch(`${API}/api/notifications?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d: { notifications?: Notification[]; unreadCount?: number }) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
        setNotifLoading(false);
      })
      .catch(() => setNotifLoading(false));
  }, [email, API]);

  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    fetch(`${API}/api/user/me?email=${encodeURIComponent(email)}`)
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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markAllRead = () => {
    fetch(`${API}/api/notifications/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(() => fetchNotifications()).catch(() => {});
  };

  if (!gateChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: colors.bg }}>
        <img src={loaderGif} alt="Loading" draggable={false} style={{ width: 80, height: 80, objectFit: "contain" }} />
      </div>
    );
  }

  const profilePicUrl = userStatus?.profilePicture
    ? `${API}/api/user/profile-picture/${userStatus.profilePicture}`
    : null;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const recentNotifs = notifications.slice(0, 5);
  const iconBtnStyle = (extraBg?: string): React.CSSProperties => ({
    width: "44px",
    height: "44px",
    borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`,
    background: extraBg ?? colors.inputBg,
    color: colors.textSub,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── Mobile Search Overlay ──────────────────────────────────── */}
      {searchOpen && (
        <div
          className="gt-search-overlay fixed inset-0 z-[200] flex flex-col"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div
            className="gt-search-modal"
            style={{
              background: colors.topBar,
              borderBottom: `1px solid ${colors.topBarBorder}`,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Search size={18} color={colors.textMuted} style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets, assets, symbols..."
              aria-label="Search"
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "16px", color: colors.inputText,
                background: "transparent",
              }}
            />
            <button
              className="gt-icon-btn"
              aria-label="Close search"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              style={{ ...iconBtnStyle(), border: "none", background: "transparent", color: colors.textSub }}
            >
              <X size={18} />
            </button>
          </div>
          {searchQuery && (
            <div style={{ padding: "12px 16px", color: colors.textMuted, fontSize: "13px" }}>
              Searching for &ldquo;<strong style={{ color: colors.textPrimary }}>{searchQuery}</strong>&rdquo;&hellip;
            </div>
          )}
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: "240px", background: colors.sidebar, borderRight: `1px solid ${colors.sidebarBorder}` }}>
        <div style={{ padding: "20px 20px 16px" }}>
          <Link href="/dashboard">
            <img src={LOGO_URL} alt="Guardian Trading Logo" style={{ height: "52px", width: "auto", cursor: "pointer", opacity: 0.95 }} />
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
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center rounded-full text-white text-[9px] font-bold"
                      style={{ width: "18px", height: "18px", background: colors.red, flexShrink: 0 }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {label !== "Notifications" && isActive && (
                    <div style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: colors.sidebarItemActive }} />
                  )}
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
            aria-label="Log out"
            className="flex items-center gap-3 w-full rounded-lg"
            style={{ padding: "10px 12px", background: "transparent", border: "none", color: colors.sidebarTextMuted, cursor: "pointer", fontSize: "13px", transition: "color 0.15s, background 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.red; (e.currentTarget as HTMLElement).style.background = colors.redBg; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.sidebarTextMuted; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Ticker Bar — desktop only */}
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

        {/* ── Top Bar ───────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: "8px 16px", borderBottom: `1px solid ${colors.topBarBorder}`, background: colors.topBar, minHeight: "60px" }}
        >
          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div
              className="gt-search-wrap flex items-center gap-2 w-full rounded-lg cursor-text"
              style={{
                padding: "9px 14px",
                background: colors.inputBg,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: "8px",
              }}
              onClick={() => desktopSearchRef.current?.focus()}
            >
              <Search size={14} color={colors.textMuted} style={{ flexShrink: 0 }} />
              <input
                ref={desktopSearchRef}
                placeholder="Search markets, assets..."
                aria-label="Search markets and assets"
                style={{
                  flex: 1, border: "none", outline: "none", fontSize: "12.5px",
                  color: colors.inputText, background: "transparent",
                }}
              />
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Mobile search button */}
            <button
              className="gt-icon-btn md:hidden"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              style={iconBtnStyle()}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.cardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.inputBg; }}
            >
              <Search size={16} />
            </button>

            {/* Theme toggle */}
            <button
              className="gt-icon-btn"
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
              style={iconBtnStyle()}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.cardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.inputBg; }}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Notification Bell + Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                className="gt-icon-btn"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-haspopup="true"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((o) => !o)}
                style={iconBtnStyle(notifOpen ? colors.cardHover : undefined)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = colors.cardHover; }}
                onMouseLeave={(e) => { if (!notifOpen) (e.currentTarget as HTMLButtonElement).style.background = colors.inputBg; }}
              >
                <Bell size={16} color={unreadCount > 0 ? colors.accent : colors.bellColor} />
              </button>

              {/* Badge */}
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white pointer-events-none ${unreadCount > 0 ? "gt-badge-pulse" : ""}`}
                  style={{ width: "18px", height: "18px", background: colors.red, fontSize: "9px", fontWeight: 700, zIndex: 1 }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}

              {/* Notification Dropdown */}
              {notifOpen && (
                <div
                  className="gt-dropdown absolute right-0 top-[calc(100%+8px)] z-[100] rounded-xl shadow-2xl overflow-hidden"
                  style={{
                    width: "340px",
                    background: colors.card,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  }}
                  role="dialog"
                  aria-label="Notifications panel"
                >
                  <div className="flex items-center justify-between" style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.divider}` }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{
                            fontSize: "11px", color: colors.accent, background: "none", border: "none",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 8px", borderRadius: "4px", transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${colors.accent}18`; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                        >
                          <CheckCheck size={12} />
                          Mark all read
                        </button>
                      )}
                      <Link href="/notifications">
                        <button
                          onClick={() => setNotifOpen(false)}
                          style={{
                            fontSize: "11px", color: colors.textMuted, background: "none", border: "none",
                            cursor: "pointer", padding: "4px 8px", borderRadius: "4px", transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.textPrimary; (e.currentTarget as HTMLButtonElement).style.background = colors.inputBg; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                        >
                          View all
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notifLoading ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: colors.textMuted, fontSize: "13px" }}>
                        Loading…
                      </div>
                    ) : recentNotifs.length === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center" }}>
                        <Bell size={28} color={colors.textMuted} style={{ margin: "0 auto 8px" }} />
                        <p style={{ fontSize: "13px", color: colors.textMuted, margin: 0 }}>You're all caught up</p>
                      </div>
                    ) : (
                      recentNotifs.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "12px 16px",
                            borderBottom: `1px solid ${colors.divider}`,
                            background: n.read ? "transparent" : `${colors.accent}08`,
                            transition: "background 0.15s",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.read ? "transparent" : `${colors.accent}08`; }}
                          onClick={() => {
                            if (n.actionUrl) { navigate(n.actionUrl); setNotifOpen(false); }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              style={{
                                width: "8px", height: "8px", borderRadius: "50%",
                                background: n.read ? colors.textMuted : colors.accent,
                                flexShrink: 0, marginTop: "4px",
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-start justify-between gap-2">
                                <p style={{ fontSize: "12.5px", fontWeight: n.read ? 400 : 600, color: colors.textPrimary, margin: 0, lineHeight: 1.4 }}>{n.title}</p>
                                {n.actionUrl && <ExternalLink size={11} color={colors.textMuted} style={{ flexShrink: 0, marginTop: "2px" }} />}
                              </div>
                              <p style={{ fontSize: "11.5px", color: colors.textSub, margin: "2px 0 0", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{n.message}</p>
                              <p style={{ fontSize: "10px", color: colors.textMuted, margin: "4px 0 0" }}>
                                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(n.createdAt))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {recentNotifs.length > 0 && (
                    <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.divider}` }}>
                      <Link href="/notifications">
                        <button
                          onClick={() => setNotifOpen(false)}
                          style={{
                            width: "100%", padding: "8px", borderRadius: "6px",
                            background: `${colors.accent}14`, color: colors.accent,
                            border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${colors.accent}28`; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${colors.accent}14`; }}
                        >
                          View all notifications
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Chip */}
            <div
              className="hidden sm:flex items-center gap-2 rounded-lg cursor-pointer"
              style={{
                padding: "5px 12px 5px 5px",
                border: `1px solid ${colors.inputBorder}`,
                background: colors.inputBg,
                height: "44px",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.cardHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = colors.inputBg; }}
            >
              {profilePicUrl ? (
                <img src={profilePicUrl} alt={displayName}
                  style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover" }} />
              ) : (
                <div className="flex items-center justify-center rounded-md font-bold text-white"
                  style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: "12px", borderRadius: "6px", flexShrink: 0 }}>
                  {displayName[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="hidden lg:block">
                <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2, margin: 0 }}>{displayName}</p>
                <p style={{ fontSize: "10px", color: colors.textMuted, lineHeight: 1.2, margin: 0 }}>Pro Account</p>
              </div>
              <ChevronDown size={12} color={colors.textMuted} className="hidden lg:block" />
            </div>
          </div>
        </div>

        {/* ── Page Content ──────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${colors.scrollbar} transparent` }}
        >
          {children}
        </div>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
        <nav
          className="flex md:hidden flex-shrink-0"
          style={{
            borderTop: `1px solid ${colors.topBarBorder}`,
            background: colors.sidebar,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {NAV.map(({ icon: Icon, label, href }) => {
            const isActive = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 relative"
                style={{
                  color: isActive ? colors.accent : colors.textMuted,
                  textDecoration: "none",
                  background: "none",
                  minHeight: "52px",
                  transition: "color 0.15s",
                }}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.5} />
                <span style={{ fontSize: "9px", fontWeight: isActive ? 700 : 400 }}>{label}</span>
                {label === "Notifications" && unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-[calc(50%-16px)] flex items-center justify-center rounded-full text-white"
                    style={{ width: "14px", height: "14px", background: colors.red, fontSize: "8px", fontWeight: 700 }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
