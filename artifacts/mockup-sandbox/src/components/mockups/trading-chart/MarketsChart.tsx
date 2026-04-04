import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, type TooltipProps,
} from "recharts";

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAxisPrice(v: number): string {
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return `${(v / 1e3).toFixed(1)}K`;
}

function generateBTCData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = 96500;
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const ts = now - i * 86400000;
    const open = price;
    const change = (Math.random() - 0.45) * 2500;
    price = Math.max(85000, price + change);
    const high = Math.max(open, price) + Math.random() * 1200;
    const low = Math.min(open, price) - Math.random() * 1200;
    data.push({
      timestamp: ts,
      time: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open, high, low, close: price,
      volume: 15e9 + Math.random() * 10e9,
    });
  }
  return data;
}

function ChartTooltipContent({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as ChartDataPoint | undefined;
  if (!point) return null;
  const isPos = point.close >= point.open;

  return (
    <div style={{
      background: "#0f1722", border: "1px solid #1e293b", borderRadius: "8px",
      padding: "12px 16px", minWidth: "180px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px", fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>
          {formatCurrency(point.close)}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 600, color: isPos ? "#10b981" : "#ef4444" }}>
          {isPos ? "+" : ""}{((point.close - point.open) / point.open * 100).toFixed(2)}%
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "11px" }}>
        <span style={{ color: "#64748b" }}>Open</span>
        <span style={{ color: "#94a3b8", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.open)}</span>
        <span style={{ color: "#64748b" }}>High</span>
        <span style={{ color: "#10b981", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.high)}</span>
        <span style={{ color: "#64748b" }}>Low</span>
        <span style={{ color: "#ef4444", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.low)}</span>
        {point.volume != null && (
          <>
            <span style={{ color: "#64748b" }}>Volume</span>
            <span style={{ color: "#94a3b8", textAlign: "right", fontWeight: 500 }}>{formatVolume(point.volume)}</span>
          </>
        )}
      </div>
    </div>
  );
}

const TIMEFRAMES = [
  { label: "1D", days: "1" },
  { label: "1W", days: "7" },
  { label: "1M", days: "30" },
  { label: "3M", days: "90" },
  { label: "1Y", days: "365" },
];

export function MarketsChart() {
  const [timeframe, setTimeframe] = useState("30");
  const data = useMemo(() => generateBTCData(), []);

  const isPositive = data.length >= 2 && data[data.length - 1]!.close >= data[0]!.open;
  const accentColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = isPositive ? "g-green" : "g-red";

  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const d of data) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const pad = (max - min) * 0.05;
    return { minPrice: min - pad, maxPrice: max + pad };
  }, [data]);

  const lastPrice = data[data.length - 1]?.close ?? 0;
  const pctChange = data.length >= 2 ? ((data[data.length - 1]!.close - data[0]!.open) / data[0]!.open) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0c1118", padding: "32px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{
        background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", overflow: "hidden", maxWidth: "900px", margin: "0 auto",
      }}>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="https://assets.coingecko.com/coins/images/1/large/bitcoin.png" alt="BTC" style={{ width: 36, height: 36, borderRadius: "50%" }} />
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>Bitcoin</span>
                  <span style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 500 }}>BTC</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "2px", padding: "3px", background: "#1e293b", borderRadius: "8px" }}>
              {TIMEFRAMES.map((tf) => (
                <button key={tf.days} onClick={() => setTimeframe(tf.days)} style={{
                  padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: "none",
                  transition: "all 0.15s ease",
                  background: timeframe === tf.days ? "#3b82f6" : "transparent",
                  color: timeframe === tf.days ? "#fff" : "#64748b",
                }}>{tf.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px", marginTop: "8px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrency(lastPrice)}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: pctChange >= 0 ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
              {pctChange >= 0 ? "▲" : "▼"} {Math.abs(pctChange).toFixed(2)}%
            </span>
          </div>
        </div>

        <div style={{ padding: "0 8px 16px 0" }}>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={accentColor} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b", fontWeight: 400 }} axisLine={{ stroke: "#1e293b", strokeWidth: 1 }} tickLine={false} interval="preserveStartEnd" minTickGap={50} />
              <YAxis domain={[minPrice, maxPrice]} tick={{ fontSize: 10, fill: "#64748b", fontWeight: 400 }} axisLine={false} tickLine={false} width={65} tickFormatter={formatAxisPrice} tickCount={6} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.5 }} isAnimationActive={false} />
              <Area type="monotone" dataKey="close" stroke={accentColor} strokeWidth={2} fill={`url(#${gradientId})`} dot={false}
                activeDot={{ r: 5, fill: accentColor, stroke: "#111827", strokeWidth: 2 }} animationDuration={800} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
