import { useState } from "react";
import { Bell, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

const POSITIONS = [
  { symbol: "AAPL", name: "Apple Inc.",         side: "Long",  qty: 150, entry: 182.40, current: 187.24, pnl: 726.00,   pnlPct: 2.65,  status: "Open" },
  { symbol: "TSLA", name: "Tesla, Inc.",         side: "Long",  qty: 80,  entry: 240.10, current: 248.50, pnl: 672.00,   pnlPct: 3.50,  status: "Open" },
  { symbol: "NVDA", name: "NVIDIA Corporation",  side: "Long",  qty: 40,  entry: 820.00, current: 875.10, pnl: 2204.00,  pnlPct: 6.72,  status: "Open" },
  { symbol: "AMD",  name: "Advanced Micro Dev.", side: "Short", qty: 60,  entry: 172.30, current: 162.80, pnl: 570.00,   pnlPct: 5.52,  status: "Open" },
  { symbol: "MSFT", name: "Microsoft Corp.",     side: "Long",  qty: 50,  entry: 415.00, current: 408.20, pnl: -340.00,  pnlPct: -1.64, status: "Open" },
  { symbol: "AMZN", name: "Amazon.com Inc.",     side: "Long",  qty: 30,  entry: 188.50, current: 184.20, pnl: -129.00,  pnlPct: -2.28, status: "Open" },
  { symbol: "META", name: "Meta Platforms Inc.", side: "Long",  qty: 25,  entry: 512.00, current: 528.40, pnl: 410.00,   pnlPct: 3.20,  status: "Open" },
  { symbol: "GOOG", name: "Alphabet Inc.",       side: "Short", qty: 45,  entry: 172.00, current: 168.90, pnl: 139.50,   pnlPct: 1.80,  status: "Open" },
];

const COLORS: Record<string, string> = {
  AAPL: "#3a7bd5", TSLA: "#e63946", NVDA: "#28a745", AMD: "#f59e0b",
  MSFT: "#6f42c1", AMZN: "#fd7e14", META: "#0d6efd", GOOG: "#20c997",
};

export default function Positions() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"All" | "Long" | "Short">("All");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filtered = POSITIONS.filter((p) =>
    (sideFilter === "All" || p.side === sideFilter) &&
    (p.symbol.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPnl = POSITIONS.reduce((s, p) => s + p.pnl, 0);
  const totalValue = POSITIONS.reduce((s, p) => s + p.current * p.qty, 0);

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 16px" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Positions</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} color={colors.bellColor} style={{ cursor: "pointer" }} />
              <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                style={{ width: "14px", height: "14px", background: "#3a7bd5", fontSize: "8px", fontWeight: 700 }}>3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full font-bold text-white"
                style={{ width: "32px", height: "32px", background: "#3a7bd5", fontSize: "13px" }}>
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden sm:inline" style={{ fontSize: "13px", fontWeight: 600, color: colors.textSub }}>{displayName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Positions</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: colors.textPrimary }}>{POSITIONS.length}</p>
            <p style={{ fontSize: "11px", color: "#3a7bd5", fontWeight: 600, marginTop: "4px" }}>All Open</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Market Value</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: colors.textPrimary }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p style={{ fontSize: "11px", color: colors.textSub, fontWeight: 600, marginTop: "4px" }}>Across all positions</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Unrealised P&L</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: totalPnl >= 0 ? "#28a745" : "#dc3545" }}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: "11px", color: totalPnl >= 0 ? "#28a745" : "#dc3545", fontWeight: 600, marginTop: "4px" }}>
              {totalPnl >= 0 ? "Up" : "Down"} today
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol or name..."
            style={{ flex: 1, maxWidth: "300px", padding: "8px 14px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", outline: "none", color: colors.inputText, background: colors.inputBg }} />
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.filterBar }}>
            {(["All", "Long", "Short"] as const).map((s) => (
              <button key={s} onClick={() => setSideFilter(s)}
                style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer",
                  background: sideFilter === s ? colors.filterActiveBg : "transparent",
                  color: sideFilter === s ? colors.filterActiveText : colors.filterInactiveText,
                  boxShadow: sideFilter === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh}
            style={{ padding: "7px 14px", fontSize: "12px", border: `1.5px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.btnText, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Symbol", "Company", "Side", "Quantity", "Entry Price", "Current Price", "Market Value", "Unrealised P&L", "Change %", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center rounded-full text-white font-bold"
                        style={{ width: "28px", height: "28px", background: COLORS[p.symbol] ?? "#3a7bd5", fontSize: "10px" }}>
                        {p.symbol[0]}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{p.symbol}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px", color: colors.textSub, padding: "12px 14px", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                      background: p.side === "Long" ? "#e8f5e9" : "#fdecea", color: p.side === "Long" ? "#28a745" : "#dc3545" }}>
                      {p.side === "Long" ? <TrendingUp size={10} style={{ display: "inline", marginRight: "3px" }} /> : <TrendingDown size={10} style={{ display: "inline", marginRight: "3px" }} />}
                      {p.side}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>{p.qty}</td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>${p.entry.toFixed(2)}</td>
                  <td style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, padding: "12px 14px" }}>${p.current.toFixed(2)}</td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>${(p.current * p.qty).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                  <td style={{ fontSize: "13px", fontWeight: 700, color: p.pnl >= 0 ? "#28a745" : "#dc3545", padding: "12px 14px" }}>
                    {p.pnl >= 0 ? "+" : ""}${Math.abs(p.pnl).toFixed(2)}
                  </td>
                  <td style={{ fontSize: "13px", fontWeight: 600, color: p.pnlPct >= 0 ? "#28a745" : "#dc3545", padding: "12px 14px" }}>
                    {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "#e8f5e9", color: "#28a745", fontWeight: 600 }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No positions match your filters.</div>
          )}
        </div>

        <div className="block sm:hidden space-y-3">
          {filtered.map((p, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: colors.card }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full text-white font-bold"
                    style={{ width: "32px", height: "32px", background: COLORS[p.symbol] ?? "#3a7bd5", fontSize: "11px" }}>
                    {p.symbol[0]}
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, display: "block" }}>{p.symbol}</span>
                    <span style={{ fontSize: "11px", color: colors.textMuted }}>{p.name}</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                  background: p.side === "Long" ? "#e8f5e9" : "#fdecea", color: p.side === "Long" ? "#28a745" : "#dc3545" }}>
                  {p.side}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Entry</span>
                  <p style={{ fontSize: "13px", color: colors.textSub }}>${p.entry.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Current</span>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>${p.current.toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>P&L</span>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: p.pnl >= 0 ? "#28a745" : "#dc3545" }}>
                    {p.pnl >= 0 ? "+" : ""}${Math.abs(p.pnl).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Qty</span>
                  <p style={{ fontSize: "13px", color: colors.textSub }}>{p.qty}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No positions match your filters.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
