import { useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  AAPL: "#3b82f6", TSLA: "#ef4444", NVDA: "#10b981", AMD: "#f59e0b",
  MSFT: "#8b5cf6", AMZN: "#f97316", META: "#06b6d4", GOOG: "#14b8a6",
};

export default function Positions() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"All" | "Long" | "Short">("All");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const filtered = POSITIONS.filter((p) =>
    (sideFilter === "All" || p.side === sideFilter) &&
    (p.symbol.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPnl = POSITIONS.reduce((s, p) => s + p.pnl, 0);
  const totalValue = POSITIONS.reduce((s, p) => s + p.current * p.qty, 0);

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Positions</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Active market positions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Positions", value: String(POSITIONS.length), sub: "All Open", subColor: colors.accent, icon: BarChart3Icon, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { label: "Market Value", value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: "Across all positions", subColor: colors.textMuted, icon: TrendingUp, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
            { label: "Unrealised P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: totalPnl >= 0 ? "Up today" : "Down today", subColor: totalPnl >= 0 ? colors.green : colors.red, icon: totalPnl >= 0 ? ArrowUpRight : ArrowDownRight, gradient: totalPnl >= 0 ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{c.label}</p>
                <div className="flex items-center justify-center rounded-lg" style={{ width: "28px", height: "28px", background: c.gradient }}>
                  <c.icon size={14} color="#fff" />
                </div>
              </div>
              <p style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.02em" }}>{c.value}</p>
              <p style={{ fontSize: "11px", color: c.subColor, fontWeight: 600, marginTop: "4px" }}>{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1 max-w-sm rounded-lg" style={{ padding: "8px 14px", background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol or name..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", color: colors.inputText, background: "transparent" }} />
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.filterBar }}>
            {(["All", "Long", "Short"] as const).map((s) => (
              <button key={s} onClick={() => setSideFilter(s)}
                style={{ padding: "6px 16px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer",
                  background: sideFilter === s ? colors.filterActiveBg : "transparent",
                  color: sideFilter === s ? colors.filterActiveText : colors.filterInactiveText }}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh}
            style={{ padding: "8px 16px", fontSize: "12px", border: `1px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.btnText, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", fontWeight: 600 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Symbol", "Company", "Side", "Quantity", "Entry Price", "Current Price", "Market Value", "Unrealised P&L", "Change %", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.divider}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                  <td style={{ padding: "12px 14px" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg text-white font-bold"
                        style={{ width: "32px", height: "32px", background: COLORS[p.symbol] ?? "#3b82f6", fontSize: "11px", borderRadius: "8px" }}>
                        {p.symbol[0]}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{p.symbol}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px", color: colors.textSub, padding: "12px 14px", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="inline-flex items-center gap-1" style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                      background: p.side === "Long" ? colors.greenBg : colors.redBg, color: p.side === "Long" ? colors.green : colors.red }}>
                      {p.side === "Long" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {p.side}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>{p.qty}</td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>${p.entry.toFixed(2)}</td>
                  <td style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, padding: "12px 14px" }}>${p.current.toFixed(2)}</td>
                  <td style={{ fontSize: "13px", color: colors.textSub, padding: "12px 14px" }}>${(p.current * p.qty).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td style={{ fontSize: "13px", fontWeight: 700, color: p.pnl >= 0 ? colors.green : colors.red, padding: "12px 14px" }}>
                    {p.pnl >= 0 ? "+" : "-"}${Math.abs(p.pnl).toFixed(2)}
                  </td>
                  <td style={{ fontSize: "13px", fontWeight: 600, color: p.pnlPct >= 0 ? colors.green : colors.red, padding: "12px 14px" }}>
                    {p.pnlPct >= 0 ? "+" : ""}{p.pnlPct.toFixed(2)}%
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", background: colors.greenBg, color: colors.green, fontWeight: 600 }}>
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
            <div key={i} className="rounded-xl p-4" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg text-white font-bold"
                    style={{ width: "36px", height: "36px", background: COLORS[p.symbol] ?? "#3b82f6", fontSize: "12px", borderRadius: "8px" }}>
                    {p.symbol[0]}
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, display: "block" }}>{p.symbol}</span>
                    <span style={{ fontSize: "11px", color: colors.textMuted }}>{p.name}</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                  background: p.side === "Long" ? colors.greenBg : colors.redBg, color: p.side === "Long" ? colors.green : colors.red }}>
                  {p.side}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Entry", value: `$${p.entry.toFixed(2)}` },
                  { label: "Current", value: `$${p.current.toFixed(2)}`, bold: true },
                  { label: "P&L", value: `${p.pnl >= 0 ? "+" : "-"}$${Math.abs(p.pnl).toFixed(2)}`, color: p.pnl >= 0 ? colors.green : colors.red },
                  { label: "Qty", value: String(p.qty) },
                ].map(item => (
                  <div key={item.label}>
                    <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>{item.label}</span>
                    <p style={{ fontSize: "13px", color: item.color ?? colors.textSub, fontWeight: item.bold ? 600 : 400 }}>{item.value}</p>
                  </div>
                ))}
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

function BarChart3Icon(props: { size: number; color: string }) {
  return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
}
