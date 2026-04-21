import { useState, useEffect, useCallback } from "react";
import { PieChart as PieChartIcon, TrendingUp, Wallet, RefreshCw } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { getApiBase } from "@/lib/api";

interface BalanceData {
  balance: number;
  profit: number;
  updatedAt: string | null;
  history: Array<{
    timestamp: string;
    transactionType: string;
    newBalance: number;
    balanceChange: number;
    note: string;
  }>;
}

function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: colors.textMuted }}>
      <div className="flex items-center justify-center rounded-xl mb-4" style={{ width: "60px", height: "60px", background: colors.filterBar }}>
        <Icon size={26} color={colors.textMuted} />
      </div>
      <p style={{ fontSize: "15px", fontWeight: 600, color: colors.textSub, marginBottom: "6px" }}>{title}</p>
      <p style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center", maxWidth: "280px" }}>{message}</p>
    </div>
  );
}

export default function Portfolio() {
  const { colors } = useTheme();
  const API = getApiBase();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";

  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!email) { setLoading(false); return; }
    try {
      const res = await fetch(`${API}/api/user/balance/${encodeURIComponent(email)}`);
      if (!res.ok) { setLoading(false); return; }
      const json = await res.json() as BalanceData;
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [email, API]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const balance = data?.balance ?? 0;
  const profit = data?.profit ?? 0;
  const pPct = balance > 0 && (balance - profit) > 0 ? (profit / (balance - profit)) * 100 : 0;
  const hasActivity = balance > 0;

  const stats = [
    { label: "Total Value", value: hasActivity ? `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00" },
    { label: "Total Return", value: hasActivity ? `${profit >= 0 ? "+" : ""}${pPct.toFixed(2)}%` : "0.00%" },
    { label: "Day Change", value: hasActivity ? `${profit >= 0 ? "+" : ""}$${Math.abs(profit).toFixed(2)}` : "$0.00" },
    { label: "Holdings", value: "0" },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Portfolio</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Investment analytics & holdings</p>
          </div>
          <button
            onClick={fetchBalance}
            title="Refresh"
            style={{ padding: "9px 12px", background: colors.filterBar, color: colors.textSub, border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px" }}>
              <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: "8px" }}>{c.label}</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}>
                {loading ? "—" : c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
          <div className="lg:col-span-3 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Account Balance</p>
              {data?.updatedAt && (
                <span style={{ fontSize: "11px", color: colors.textMuted }}>
                  Updated {new Date(data.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Balance & profit/loss history</p>
            {hasActivity && data?.history && data.history.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
                  <thead>
                    <tr>
                      {["Date", "Type", "Change", "Balance"].map(h => (
                        <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.textMuted, fontWeight: 600, paddingBottom: "10px", borderBottom: `1px solid ${colors.divider}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.history].reverse().slice(0, 10).map((h, i) => {
                      const chg = h.balanceChange;
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}>
                          <td style={{ padding: "10px 8px 10px 0", fontSize: "12px", color: colors.textMuted }}>
                            {new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "12px", color: colors.textSub, textTransform: "capitalize" }}>
                            {h.transactionType}
                          </td>
                          <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 600, color: chg >= 0 ? colors.green : colors.red }}>
                            {chg >= 0 ? "+" : ""}${Math.abs(chg).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "10px 0 10px 8px", fontSize: "13px", color: colors.textPrimary, fontWeight: 600 }}>
                            ${h.newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No activity yet"
                message="Your account history and balance changes will appear here once your account is funded."
              />
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Account Summary</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Your current account standing</p>
            {hasActivity ? (
              <div className="space-y-4">
                {[
                  { label: "Total Balance", value: `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: colors.accent },
                  { label: "Profit / Loss", value: `${profit >= 0 ? "+" : ""}$${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: profit >= 0 ? colors.green : colors.red },
                  { label: "Return %", value: `${pPct >= 0 ? "+" : ""}${pPct.toFixed(2)}%`, color: pPct >= 0 ? colors.green : colors.red },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between" style={{ padding: "12px 0", borderBottom: `1px solid ${colors.divider}` }}>
                    <span style={{ fontSize: "13px", color: colors.textSub }}>{item.label}</span>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wallet}
                title="No balance yet"
                message="Submit a deposit request to fund your account and start trading."
              />
            )}
          </div>
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
          <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Holdings</p>
          <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Your current positions</p>
          <EmptyState
            icon={PieChartIcon}
            title="No holdings yet"
            message="Securities and assets you hold will be listed here with real-time valuations."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
