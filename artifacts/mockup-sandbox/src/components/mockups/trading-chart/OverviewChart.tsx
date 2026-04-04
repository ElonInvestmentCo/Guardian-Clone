import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, type TooltipProps,
} from "recharts";

function generatePortfolioData(): { time: string; price: number }[] {
  const arr: { time: string; price: number }[] = [];
  let price = 48500;
  const now = Date.now();
  for (let i = 39; i >= 0; i--) {
    const ts = new Date(now - i * 3000);
    price += (Math.random() - 0.46) * price * 0.003;
    arr.push({
      time: ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return arr;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f1722", color: "#e2e8f0", borderRadius: "8px", padding: "8px 14px",
      fontSize: "13px", fontWeight: 700, border: "1px solid #1e293b",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", fontVariantNumeric: "tabular-nums",
    }}>
      ${((payload[0]!.value as number)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  );
}

export function OverviewChart() {
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const data = useMemo(() => generatePortfolioData(), []);

  const currentVal = data[data.length - 1]?.price ?? 0;
  const startVal = data[0]?.price ?? 0;
  const pChange = currentVal - startVal;
  const pPct = startVal > 0 ? (pChange / startVal) * 100 : 0;
  const isPositive = pChange >= 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0c1118", padding: "32px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Portfolio Value", value: `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: `+${pPct.toFixed(2)}% total return`, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { label: "Today's P&L", value: `+$${Math.abs(pChange).toFixed(2)}`, sub: "Total profit/loss", gradient: "linear-gradient(135deg, #10b981, #059669)" },
            { label: "Buying Power", value: `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: "Available balance", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
            { label: "Open Trades", value: "0", sub: "No active positions", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, margin: 0 }}>{c.label}</p>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: c.gradient }} />
              </div>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em", marginBottom: "4px", margin: 0 }}>{c.value}</p>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>{c.sub}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: "12px" }}>
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", margin: 0 }}>Portfolio Performance</p>
                <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", margin: "2px 0 0" }}>Equity curve over time</p>
              </div>
              <div style={{ display: "flex", gap: "2px", padding: "3px", background: "#1e293b", borderRadius: "8px" }}>
                {(["1D", "1W", "1M", "1Y"] as const).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)} style={{
                    padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px",
                    border: "none", cursor: "pointer", transition: "all 0.15s ease",
                    background: timeRange === r ? "#3b82f6" : "transparent",
                    color: timeRange === r ? "#fff" : "#64748b",
                  }}>{r}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px", marginTop: "12px" }}>
              <span style={{ fontSize: "32px", fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: isPositive ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                {isPositive ? "▲" : "▼"}
                +${Math.abs(pChange).toFixed(0)} (+{pPct.toFixed(2)}%)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto", fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                LIVE
              </span>
            </div>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
          <div style={{ padding: "0 8px 16px 0" }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={60}
                  tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.5 }} />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fill="url(#portfolioGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#3b82f6", stroke: "#111827", strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
