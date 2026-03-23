import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, TooltipProps, AreaChart, Area,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, BarChart3, ArrowRightLeft } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

const portfolioHistory = [
  { month: "Jan", value: 88000 }, { month: "Feb", value: 76000 },
  { month: "Mar", value: 83000 }, { month: "Apr", value: 79000 },
  { month: "May", value: 86000 }, { month: "Jun", value: 91000 },
  { month: "Jul", value: 89000 }, { month: "Aug", value: 127450 },
  { month: "Sep", value: 118000 }, { month: "Oct", value: 124000 },
  { month: "Nov", value: 130000 }, { month: "Dec", value: 127000 },
];

const trades = [
  { symbol: "AAPL", name: "Apple Inc.",     amount: "+$3,430", status: "Open",      date: "22/03/26", dir: "+", color: "#3b82f6" },
  { symbol: "TSLA", name: "Tesla, Inc.",    amount: "+$200",   status: "Closed",    date: "19/03/26", dir: "+", color: "#ef4444" },
  { symbol: "NVDA", name: "NVIDIA Corp.",   amount: "-$41",    status: "Cancelled", date: "15/03/26", dir: "-", color: "#10b981" },
  { symbol: "AMD",  name: "Advanced Micro", amount: "+$1,200", status: "Closed",    date: "12/03/26", dir: "+", color: "#f59e0b" },
  { symbol: "MSFT", name: "Microsoft",      amount: "+$890",   status: "Open",      date: "10/03/26", dir: "+", color: "#8b5cf6" },
];

const topAssets = [
  { symbol: "NVDA", name: "NVIDIA",   pct: 27.5, value: "$35,004", change: "+6.72%", color: "#10b981", barColor: "#10b981" },
  { symbol: "AAPL", name: "Apple",    pct: 22.1, value: "$28,125", change: "+2.65%", color: "#3b82f6", barColor: "#3b82f6" },
  { symbol: "TSLA", name: "Tesla",    pct: 15.6, value: "$19,880", change: "+3.50%", color: "#ef4444", barColor: "#ef4444" },
  { symbol: "AMD",  name: "AMD",      pct: 15.3, value: "$19,536", change: "+5.52%", color: "#f59e0b", barColor: "#f59e0b" },
  { symbol: "Cash", name: "Reserves", pct: 19.5, value: "$24,905", change: "---",    color: "#6b7280", barColor: "#6b7280" },
];

function generateLiveData(base: number, count = 40): { time: string; price: number }[] {
  const arr: { time: string; price: number }[] = [];
  let price = base * (0.98 + Math.random() * 0.02);
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const ts = new Date(now - i * 3000);
    price += (Math.random() - 0.49) * price * 0.002;
    arr.push({ time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), price: parseFloat(price.toFixed(2)) });
  }
  return arr;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, border: "1px solid #334155" }}>
      ${((payload[0].value as number)).toLocaleString()}
    </div>
  );
}

function PortfolioTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, border: "1px solid #334155" }}>
      ${((payload[0].value as number) / 1000).toFixed(1)}K
    </div>
  );
}

export default function Overview() {
  const { colors } = useTheme();

  const [recipientName, setRecipientName] = useState("Royal Pervej");
  const [amount, setAmount] = useState("140.00");
  const [liveData, setLiveData] = useState(() => generateLiveData(127450));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "1Y">("1M");

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLiveData(prev => {
        const arr = [...prev];
        const last = arr[arr.length - 1];
        const delta = (Math.random() - 0.49) * last.price * 0.001;
        arr.push({
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          price: parseFloat((last.price + delta).toFixed(2)),
        });
        if (arr.length > 60) arr.shift();
        return arr;
      });
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const currentVal = liveData[liveData.length - 1]?.price ?? 127450;
  const prevVal = liveData[0]?.price ?? 127450;
  const pChange = currentVal - prevVal;
  const pPct = (pChange / prevVal) * 100;

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open:      { bg: colors.greenBg, text: colors.green },
    Closed:    { bg: colors.purpleBg, text: colors.purple },
    Cancelled: { bg: colors.redBg, text: colors.red },
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col xl:flex-row" style={{ minHeight: "100%" }}>
        <div className="flex-1 overflow-y-auto" style={{ padding: "24px 20px" }}>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Wallet, label: "Portfolio Value", value: `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `${pChange >= 0 ? "+" : ""}${pPct.toFixed(2)}% today`, positive: pChange >= 0, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
              { icon: TrendingUp, label: "Today's P&L", value: "+$2,340", sub: "+1.84% return", positive: true, gradient: "linear-gradient(135deg, #10b981, #059669)" },
              { icon: BarChart3, label: "Buying Power", value: "$45,200", sub: "Available margin", positive: true, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
              { icon: ArrowRightLeft, label: "Open Trades", value: "8", sub: "4 symbols active", positive: true, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 18px" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 500 }}>{c.label}</p>
                    <div className="flex items-center justify-center rounded-lg" style={{ width: "32px", height: "32px", background: c.gradient }}>
                      <c.icon size={16} color="#fff" />
                    </div>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.02em", marginBottom: "4px" }}>{c.value}</p>
                  <div className="flex items-center gap-1">
                    {c.positive ? <ArrowUpRight size={12} color={colors.green} /> : <ArrowDownRight size={12} color={colors.red} />}
                    <span style={{ fontSize: "11px", fontWeight: 600, color: c.positive ? colors.green : colors.red }}>{c.sub}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
            <div className="lg:col-span-3 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Portfolio Performance</p>
                  <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>Equity curve over time</p>
                </div>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: colors.filterBar }}>
                  {(["1D", "1W", "1M", "1Y"] as const).map(r => (
                    <button key={r} onClick={() => setTimeRange(r)} style={{
                      padding: "4px 10px", fontSize: "11px", fontWeight: 600, borderRadius: "5px",
                      border: "none", cursor: "pointer",
                      background: timeRange === r ? colors.accent : "transparent",
                      color: timeRange === r ? "#fff" : colors.filterInactiveText,
                    }}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-4 mt-3">
                <span style={{ fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>
                  ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="flex items-center gap-1" style={{ fontSize: "13px", fontWeight: 600, color: pChange >= 0 ? colors.green : colors.red }}>
                  {pChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {pChange >= 0 ? "+" : ""}${Math.abs(pChange).toFixed(0)} ({pChange >= 0 ? "+" : ""}{pPct.toFixed(2)}%)
                </span>
                <span className="flex items-center gap-1 ml-auto" style={{ fontSize: "11px", color: colors.green, fontWeight: 600 }}>
                  <span className="inline-block rounded-full" style={{ width: "6px", height: "6px", background: colors.green, animation: "pulse 1.5s infinite" }} />
                  LIVE
                </span>
              </div>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeRange === "1M" || timeRange === "1Y" ? portfolioHistory : liveData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} vertical={false} />
                  <XAxis dataKey={timeRange === "1M" || timeRange === "1Y" ? "month" : "time"} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false}
                    domain={["auto", "auto"]} width={50}
                    tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`} />
                  <Tooltip content={timeRange === "1M" || timeRange === "1Y" ? <PortfolioTooltip /> : <ChartTooltip />} cursor={{ stroke: colors.divider, strokeWidth: 1 }} />
                  <Area type="monotone" dataKey={timeRange === "1M" || timeRange === "1Y" ? "value" : "price"} stroke={colors.accent} strokeWidth={2}
                    fill="url(#areaGrad)" dot={false}
                    activeDot={{ r: 4, fill: colors.accent, stroke: colors.card, strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Asset Allocation</p>
              <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Portfolio breakdown</p>

              <div className="flex gap-1 rounded-full overflow-hidden mb-5" style={{ height: "8px" }}>
                {topAssets.map(a => (
                  <div key={a.symbol} style={{ width: `${a.pct}%`, background: a.barColor, borderRadius: "4px" }} />
                ))}
              </div>

              {topAssets.map((a) => (
                <div key={a.symbol} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-lg font-bold text-white"
                      style={{ width: "32px", height: "32px", background: a.color, fontSize: "11px", borderRadius: "8px" }}>
                      {a.symbol[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{a.symbol}</p>
                      <p style={{ fontSize: "10px", color: colors.textMuted }}>{a.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{a.value}</p>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: a.change.startsWith("+") ? colors.green : colors.textMuted }}>{a.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Recent Trades</p>
                <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>Latest market activity</p>
              </div>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr>
                    {["Asset", "P&L", "Status", "Date"].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, paddingBottom: "12px", borderBottom: `1px solid ${colors.divider}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => {
                    const sc = statusColors[t.status] ?? statusColors.Open;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                        <td style={{ padding: "12px 0" }}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center rounded-lg font-bold text-white"
                              style={{ width: "32px", height: "32px", background: t.color, fontSize: "11px", borderRadius: "8px" }}>
                              {t.symbol[0]}
                            </div>
                            <div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, display: "block" }}>{t.symbol}</span>
                              <span style={{ fontSize: "10px", color: colors.textMuted }}>{t.name}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: "13px", fontWeight: 600, color: t.dir === "+" ? colors.green : colors.red }}>{t.amount}</td>
                        <td>
                          <span className="inline-block px-2.5 py-1 rounded-md" style={{ background: sc.bg, color: sc.text, fontSize: "11px", fontWeight: 600 }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: colors.textMuted }}>{t.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="block sm:hidden space-y-3">
              {trades.map((t, i) => {
                const sc = statusColors[t.status] ?? statusColors.Open;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ border: `1px solid ${colors.divider}` }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center rounded-lg font-bold text-white"
                        style={{ width: "32px", height: "32px", background: t.color, fontSize: "11px", borderRadius: "8px" }}>
                        {t.symbol[0]}
                      </div>
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, display: "block" }}>{t.symbol}</span>
                        <span style={{ fontSize: "10px", color: colors.textMuted }}>{t.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span style={{ fontSize: "13px", fontWeight: 600, color: t.dir === "+" ? colors.green : colors.red, display: "block" }}>{t.amount}</span>
                      <span className="inline-block px-2 py-0.5 rounded-md mt-1" style={{ background: sc.bg, color: sc.text, fontSize: "10px", fontWeight: 600 }}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="hidden xl:flex flex-col flex-shrink-0 overflow-y-auto" style={{
          width: "300px", background: colors.rightPanel, borderLeft: `1px solid ${colors.rightPanelBorder}`, padding: "24px 20px",
        }}>
          <div className="mb-5">
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Account Equity</p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>$127,450</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={12} color={colors.green} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: colors.green }}>+$2,340 (1.84%)</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "10px", background: colors.accent, color: "#fff", cursor: "pointer" }}>Deposit</button>
            <button style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>Withdraw</button>
          </div>

          <div className="rounded-xl mb-5 p-4" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: `1px solid ${colors.divider}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ef4444", opacity: 0.9 }} />
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#f59e0b", opacity: 0.9, marginLeft: "-7px" }} />
              </div>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)" }} />
            </div>
            <p style={{ fontSize: "13px", letterSpacing: "0.14em", marginBottom: "14px", color: "rgba(255,255,255,0.85)" }}>6375 8456 9825 6775</p>
            <div className="flex items-end justify-between">
              <div>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>NAME</p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>Trader</p>
              </div>
              <div>
                <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>EXP</p>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>08/28</p>
              </div>
              <div style={{ width: "28px", height: "20px", background: "#c0a060", borderRadius: "3px" }} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, marginBottom: "16px" }}>Quick Transfer</p>

            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", fontWeight: 500 }}>Recipient Name</p>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", fontSize: "13px", border: `1px solid ${colors.inputBorder}`, borderRadius: "10px", marginBottom: "14px", boxSizing: "border-box", color: colors.inputText, background: colors.inputBg, outline: "none" }} />

            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", fontWeight: 500 }}>Amount</p>
            <div className="flex gap-2 mb-5">
              <div className="flex items-center gap-1 px-3 py-2.5 rounded-lg flex-shrink-0" style={{ border: `1px solid ${colors.inputBorder}`, fontSize: "12px", fontWeight: 600, color: colors.textSub, background: colors.inputBg }}>
                USD <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <input value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ flex: 1, padding: "10px 14px", fontSize: "13px", border: `1px solid ${colors.inputBorder}`, borderRadius: "10px", color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
              Send Money
            </button>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
