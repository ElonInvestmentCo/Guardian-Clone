import { useState, useEffect } from "react";
import { Activity, TrendingUp, DollarSign, Shield, RefreshCw } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface TradingStatus {
  accountBalance: number;
  profit: number;
  openPositions: number;
  buyingPower: number;
  tradingEnabled: boolean;
  marginStatus: {
    status: string;
    message: string;
    marginRatio: number;
    availableMargin: number;
  };
  portfolioRisk: {
    overallRisk: string;
    riskScore: number;
    warnings: string[];
  };
  timestamp: string;
}

const API = getApiBase();

const RISK_COLORS: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  CRITICAL: "#ef4444",
};

export default function TradingStatusCard() {
  const { colors } = useTheme();
  const [status, setStatus] = useState<TradingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    fetch(`${API}/api/trading/status`, { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<TradingStatus> : null)
      .then(d => { if (d) setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStatus(); }, []);

  const riskColor = status ? (RISK_COLORS[status.portfolioRisk.overallRisk] ?? colors.textMuted) : colors.textMuted;

  return (
    <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
      <div className="flex items-center justify-between" style={{ padding: "16px 20px 12px" }}>
        <div className="flex items-center gap-2">
          <Activity size={15} color={colors.accent} />
          <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Trading Status</p>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <span style={{
              padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
              background: status.tradingEnabled ? colors.greenBg : colors.redBg,
              color: status.tradingEnabled ? colors.green : colors.red,
            }}>
              {status.tradingEnabled ? "LIVE" : "DISABLED"}
            </span>
          )}
          <button onClick={fetchStatus} disabled={loading} style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", color: colors.textMuted }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      <div style={{ padding: "0 20px 16px" }}>
        {loading && !status && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: "52px", background: colors.filterBar, borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {status && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { icon: DollarSign, label: "Account Balance", value: `$${status.accountBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: colors.accent, bg: "rgba(59,130,246,0.12)" },
                { icon: TrendingUp, label: "Total P&L", value: `${status.profit >= 0 ? "+" : ""}$${Math.abs(status.profit).toFixed(2)}`, color: status.profit >= 0 ? colors.green : colors.red, bg: status.profit >= 0 ? colors.greenBg : colors.redBg },
                { icon: Activity, label: "Open Positions", value: String(status.openPositions), color: colors.textPrimary, bg: colors.filterBar },
                { icon: DollarSign, label: "Buying Power", value: `$${status.buyingPower.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: colors.textPrimary, bg: colors.filterBar },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: "10px", padding: "12px" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon size={11} color={item.color} />
                    <p style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  </div>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: colors.filterBar, borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Shield size={12} color={riskColor} />
                  <span style={{ fontSize: "11px", color: colors.textMuted }}>Portfolio Risk</span>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: `${riskColor}18`, color: riskColor }}>
                  {status.portfolioRisk.overallRisk}
                </span>
              </div>
              <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${status.portfolioRisk.riskScore}%`, background: riskColor, borderRadius: "2px", transition: "width 0.6s ease" }} />
              </div>
              {status.portfolioRisk.warnings.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {status.portfolioRisk.warnings.slice(0, 2).map((w, i) => (
                    <p key={i} style={{ fontSize: "10px", color: colors.yellow, lineHeight: 1.4 }}>• {w}</p>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: colors.filterBar, borderRadius: "10px", padding: "12px" }}>
              <p style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Margin Status</p>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: "12px", color: colors.textSub }}>{status.marginStatus.message}</p>
                <span style={{ fontSize: "11px", fontWeight: 700, color: status.marginStatus.status === "SAFE" ? colors.green : colors.yellow }}>
                  {status.marginStatus.status}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "10px", color: colors.textMuted, marginTop: "8px", textAlign: "right" }}>
              Updated {new Date(status.timestamp).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
