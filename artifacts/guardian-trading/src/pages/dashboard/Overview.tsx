import { useState, useEffect, useRef } from "react";
import { getApiBase } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, TooltipProps,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, BarChart3, ArrowRightLeft, InboxIcon } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

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

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-12" style={{ color: colors.textMuted }}>
      <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: "56px", height: "56px", background: colors.filterBar }}>
        <Icon size={24} color={colors.textMuted} />
      </div>
      <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textSub, marginBottom: "4px" }}>{title}</p>
      <p style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center" }}>{message}</p>
    </div>
  );
}

export default function Overview() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";

  const [liveData, setLiveData] = useState(() => generateLiveData(0));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    if (!email) return;
    const base = getApiBase();
    fetch(`${base}/api/admin/user-balance/${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d: { balance?: number; profit?: number }) => {
        setBalance(d.balance ?? 0);
        setProfit(d.profit ?? 0);
        setLiveData(generateLiveData(d.balance ?? 1000));
      })
      .catch(() => {});
  }, [email]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLiveData(prev => {
        const arr = [...prev];
        const last = arr[arr.length - 1];
        if (!last) return arr;
        const delta = (Math.random() - 0.49) * Math.max(last.price, 1) * 0.001;
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

  const currentVal = balance;
  const pChange = profit;
  const pPct = balance > 0 && (balance - profit) > 0 ? (profit / (balance - profit)) * 100 : 0;

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
              { icon: Wallet, label: "Portfolio Value", value: `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, sub: balance > 0 ? `${pChange >= 0 ? "+" : ""}${pPct.toFixed(2)}% total return` : "No activity yet", positive: pChange >= 0, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
              { icon: TrendingUp, label: "Today's P&L", value: balance > 0 ? `${pChange >= 0 ? "+" : ""}$${Math.abs(pChange).toFixed(2)}` : "--", sub: balance > 0 ? "Total profit/loss" : "No trades yet", positive: pChange >= 0, gradient: "linear-gradient(135deg, #10b981, #059669)" },
              { icon: BarChart3, label: "Buying Power", value: balance > 0 ? `$${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "--", sub: balance > 0 ? "Available balance" : "Fund your account", positive: true, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
              { icon: ArrowRightLeft, label: "Open Trades", value: "0", sub: "No active positions", positive: true, gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
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

          <div className="rounded-xl mb-6" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
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
              {balance > 0 && (
                <span className="flex items-center gap-1" style={{ fontSize: "13px", fontWeight: 600, color: pChange >= 0 ? colors.green : colors.red }}>
                  {pChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {pChange >= 0 ? "+" : ""}${Math.abs(pChange).toFixed(0)} ({pChange >= 0 ? "+" : ""}{pPct.toFixed(2)}%)
                </span>
              )}
              <span className="flex items-center gap-1 ml-auto" style={{ fontSize: "11px", color: colors.green, fontWeight: 600 }}>
                <span className="inline-block rounded-full" style={{ width: "6px", height: "6px", background: colors.green, animation: "pulse 1.5s infinite" }} />
                LIVE
              </span>
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={liveData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.accent} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false}
                  domain={["auto", "auto"]} width={50}
                  tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.divider, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="price" stroke={colors.accent} strokeWidth={2}
                  fill="url(#areaGrad)" dot={false}
                  activeDot={{ r: 4, fill: colors.accent, stroke: colors.card, strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Recent Trades</p>
                <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>Latest market activity</p>
              </div>
            </div>
            <EmptyState
              icon={InboxIcon}
              title="No trades yet"
              message="Your recent trading activity will appear here once you start trading."
            />
          </div>
        </div>

        <aside className="hidden xl:flex flex-col flex-shrink-0 overflow-y-auto" style={{
          width: "300px", background: colors.rightPanel, borderLeft: `1px solid ${colors.rightPanelBorder}`, padding: "24px 20px",
        }}>
          <div className="mb-5">
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Account Equity</p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>
              ${currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            {balance > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} color={colors.green} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: colors.green }}>
                  +${pChange.toFixed(2)} ({pPct.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-6">
            <button style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "10px", background: colors.accent, color: "#fff", cursor: "pointer" }}>Deposit</button>
            <button style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>Withdraw</button>
          </div>

          <div className="rounded-xl p-4" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary, marginBottom: "8px" }}>Asset Allocation</p>
            <EmptyState
              icon={PieIcon}
              title="No assets yet"
              message="Your portfolio allocation will appear here once you make your first trade."
            />
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function PieIcon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  );
}
