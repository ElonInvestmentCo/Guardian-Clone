import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, TooltipProps, PieChart, Pie, Cell,
} from "recharts";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

interface TickerConfig {
  symbol: string;
  name: string;
  basePrice: number;
  color: string;
  quantity: number;
}

const TICKERS: TickerConfig[] = [
  { symbol: "AAPL", name: "Apple Inc.",         basePrice: 187.24, color: "#3b82f6", quantity: 150 },
  { symbol: "TSLA", name: "Tesla, Inc.",         basePrice: 248.50, color: "#ef4444", quantity: 80  },
  { symbol: "NVDA", name: "NVIDIA Corporation",  basePrice: 875.10, color: "#10b981", quantity: 40  },
  { symbol: "AMD",  name: "Advanced Micro Dev.", basePrice: 162.80, color: "#f59e0b", quantity: 120 },
];

const ALLOCATION_DATA = [
  { name: "AAPL", value: 28125, pct: 22.1 },
  { name: "TSLA", value: 19880, pct: 15.6 },
  { name: "NVDA", value: 35004, pct: 27.5 },
  { name: "AMD",  value: 19536, pct: 15.3 },
  { name: "Cash", value: 24905, pct: 19.5 },
];

const ALLOC_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6b7280"];

function generateHistory(base: number, count = 60): { time: string; price: number }[] {
  const arr: { time: string; price: number }[] = [];
  let price = base * (0.97 + Math.random() * 0.02);
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const ts = new Date(now - i * 2000);
    price += (Math.random() - 0.49) * price * 0.003;
    arr.push({ time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), price: parseFloat(price.toFixed(2)) });
  }
  return arr;
}

function LiveTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, border: "1px solid #334155" }}>
      ${(payload[0].value as number).toFixed(2)}
    </div>
  );
}

function AllocTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { name: string; value: number; pct: number };
  return (
    <div style={{ background: "#1e293b", color: "#e2e8f0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", border: "1px solid #334155" }}>
      <b>{d.name}</b>: ${d.value.toLocaleString()} ({d.pct}%)
    </div>
  );
}

export default function Portfolio() {
  const { colors } = useTheme();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const ticker = TICKERS[selectedIdx];

  const [dataMap, setDataMap] = useState<Record<string, { time: string; price: number }[]>>(
    () => Object.fromEntries(TICKERS.map((t) => [t.symbol, generateHistory(t.basePrice)]))
  );
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setDataMap((prev) => {
        const updated = { ...prev };
        TICKERS.forEach((t) => {
          const arr = [...prev[t.symbol]];
          const last = arr[arr.length - 1];
          const change = (Math.random() - 0.49) * last.price * 0.003;
          arr.push({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), price: parseFloat((last.price + change).toFixed(2)) });
          if (arr.length > 90) arr.shift();
          updated[t.symbol] = arr;
        });
        return updated;
      });
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused]);

  const liveData = dataMap[ticker.symbol];
  const currentPrice = liveData[liveData.length - 1].price;
  const openPrice = liveData[0].price;
  const priceChange = currentPrice - openPrice;
  const pctChange = (priceChange / openPrice) * 100;
  const isPositive = priceChange >= 0;

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Portfolio</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Investment overview & analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Portfolio", value: "$127,450", sub: "+2.3% today",  color: colors.green, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { label: "Today's P&L",     value: "+$2,340",  sub: "8 trades today",    color: colors.green, gradient: "linear-gradient(135deg, #10b981, #059669)" },
            { label: "Buying Power",    value: "$45,200",  sub: "Available margin",   color: colors.accent, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
            { label: "Open Positions",  value: "24",       sub: "Across 4 symbols",   color: colors.yellow, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px 18px" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{c.label}</p>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, marginBottom: "4px", letterSpacing: "-0.02em" }}>{c.value}</p>
              <p style={{ fontSize: "11px", color: c.color, fontWeight: 600 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 mb-6">
          <div className="flex-1 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex gap-2 flex-wrap">
                {TICKERS.map((t, i) => (
                  <button key={t.symbol} onClick={() => setSelectedIdx(i)}
                    style={{ padding: "6px 16px", fontSize: "12px", fontWeight: 600, borderRadius: "8px", border: "1.5px solid", cursor: "pointer",
                      background: i === selectedIdx ? t.color : "transparent",
                      color: i === selectedIdx ? "#fff" : t.color,
                      borderColor: t.color }}>
                    {t.symbol}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsPaused((p) => !p)}
                style={{ fontSize: "11px", padding: "5px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600,
                  background: isPaused ? colors.redBg : colors.greenBg,
                  color: isPaused ? colors.red : colors.green }}>
                {isPaused ? "Resume" : "Pause"}
              </button>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <span style={{ fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>${currentPrice.toFixed(2)}</span>
              <span className="flex items-center gap-1" style={{ fontSize: "13px", fontWeight: 600, color: isPositive ? colors.green : colors.red }}>
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({isPositive ? "+" : ""}{pctChange.toFixed(2)}%)
              </span>
              <span className="hidden sm:inline" style={{ fontSize: "12px", color: colors.textMuted }}>{ticker.name}</span>
              <span className="sm:ml-auto flex items-center gap-1.5" style={{ fontSize: "11px", color: colors.green, fontWeight: 600 }}>
                <span className="inline-block rounded-full" style={{ width: "6px", height: "6px", background: colors.green, animation: "pulse 1.5s infinite" }} />
                LIVE
              </span>
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={liveData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: colors.textMuted }} axisLine={false} tickLine={false}
                  interval={Math.floor(liveData.length / 6)} />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false}
                  domain={["auto", "auto"]} width={52}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                <Tooltip content={<LiveTooltip />} cursor={{ stroke: colors.divider, strokeWidth: 1 }} />
                <Line type="monotone" dataKey="price" stroke={ticker.color} strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: ticker.color, stroke: colors.card, strokeWidth: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl flex-shrink-0 w-full lg:w-[300px]" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Allocation</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Portfolio distribution</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={ALLOCATION_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" nameKey="name" paddingAngle={2}>
                  {ALLOCATION_DATA.map((_, i) => <Cell key={i} fill={ALLOC_COLORS[i]} />)}
                </Pie>
                <Tooltip content={<AllocTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2">
              {ALLOCATION_DATA.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: ALLOC_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: colors.textSub }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: colors.textSub }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
          <div className="mb-4">
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Holdings</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>Current stock positions</p>
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  {["Symbol", "Name", "Qty", "Avg Cost", "Current Price", "Market Value", "P&L", "% Alloc"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, paddingBottom: "12px", borderBottom: `1px solid ${colors.divider}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TICKERS.map((t, i) => {
                  const live = dataMap[t.symbol];
                  const cur = live[live.length - 1].price;
                  const avgCost = t.basePrice * 0.975;
                  const pnl = (cur - avgCost) * t.quantity;
                  const pos = pnl >= 0;
                  const mktVal = cur * t.quantity;
                  const alloc = ALLOCATION_DATA[i];
                  return (
                    <tr key={t.symbol} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                      <td style={{ padding: "12px 0" }}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-lg text-white font-bold"
                            style={{ width: "32px", height: "32px", background: ALLOC_COLORS[i], fontSize: "11px", borderRadius: "8px" }}>
                            {t.symbol[0]}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{t.symbol}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: colors.textSub, whiteSpace: "nowrap" }}>{t.name}</td>
                      <td style={{ fontSize: "13px", color: colors.textSub }}>{t.quantity}</td>
                      <td style={{ fontSize: "13px", color: colors.textSub }}>${avgCost.toFixed(2)}</td>
                      <td style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>${cur.toFixed(2)}</td>
                      <td style={{ fontSize: "13px", color: colors.textSub }}>${mktVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={{ fontSize: "13px", fontWeight: 600, color: pos ? colors.green : colors.red }}>
                        {pos ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ fontSize: "12px", color: colors.textMuted }}>{alloc.pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="block sm:hidden space-y-3">
            {TICKERS.map((t, i) => {
              const live = dataMap[t.symbol];
              const cur = live[live.length - 1].price;
              const avgCost = t.basePrice * 0.975;
              const pnl = (cur - avgCost) * t.quantity;
              const pos = pnl >= 0;
              const alloc = ALLOCATION_DATA[i];
              return (
                <div key={t.symbol} className="rounded-lg p-3" style={{ border: `1px solid ${colors.divider}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center rounded-lg text-white font-bold"
                      style={{ width: "32px", height: "32px", background: ALLOC_COLORS[i], fontSize: "11px", borderRadius: "8px" }}>
                      {t.symbol[0]}
                    </div>
                    <div className="flex-1">
                      <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{t.symbol}</span>
                      <span style={{ fontSize: "11px", color: colors.textMuted, marginLeft: "6px" }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: pos ? colors.green : colors.red }}>
                      {pos ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>QTY</span>
                      <p style={{ fontSize: "12px", color: colors.textSub }}>{t.quantity}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>PRICE</span>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: colors.textPrimary }}>${cur.toFixed(2)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>ALLOC</span>
                      <p style={{ fontSize: "12px", color: colors.textSub }}>{alloc.pct}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
