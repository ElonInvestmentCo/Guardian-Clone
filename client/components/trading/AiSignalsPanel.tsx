import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Zap, Clock, AlertTriangle } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface Signal {
  id: string;
  asset: string;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskRewardRatio: number;
  timeframe: string;
  reasoning: string;
  indicators: { rsi: number; trend: string; volatility: string; momentum: number };
  generatedAt: string;
  expiresAt: string;
}

interface SignalsResponse {
  signals: Signal[];
  marketSentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
  generatedAt: string;
  source: "ai" | "technical";
}

const API = getApiBase();

const SENTIMENT_COLORS: Record<string, string> = {
  BULLISH: "#10b981",
  BEARISH: "#ef4444",
  NEUTRAL: "#94a3b8",
  MIXED: "#f59e0b",
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: "2px", transition: "width 0.6s ease" }} />
    </div>
  );
}

function RiskBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const map = {
    LOW:    { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Low Risk" },
    MEDIUM: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Med Risk" },
    HIGH:   { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", label: "High Risk" },
  };
  const s = map[level];
  return (
    <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function AiSignalsPanel() {
  const { colors } = useTheme();
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSignals = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/ai/signals`, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<SignalsResponse>;
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message || "Failed to load signals"); setLoading(false); });
  }, []);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const sentimentColor = data ? (SENTIMENT_COLORS[data.marketSentiment] ?? colors.textMuted) : colors.textMuted;

  return (
    <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
      <div className="flex items-center justify-between" style={{ padding: "16px 20px 12px" }}>
        <div>
          <div className="flex items-center gap-2">
            <Zap size={15} color={colors.accent} />
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>AI Trading Signals</p>
            {data && (
              <span style={{
                padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: 700,
                background: `${sentimentColor}18`, color: sentimentColor,
              }}>
                {data.marketSentiment}
              </span>
            )}
          </div>
          <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
            {data ? `Source: ${data.source === "ai" ? "Guardian Intelligence" : "Technical Analysis"} · ${new Date(data.generatedAt).toLocaleTimeString()}` : "Analyzing market conditions..."}
          </p>
        </div>
        <button
          onClick={fetchSignals}
          disabled={loading}
          style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: `1px solid ${colors.cardBorder}`, background: "transparent", cursor: loading ? "not-allowed" : "pointer", color: colors.textMuted }}
        >
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      <div style={{ padding: "0 20px 16px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: "110px", background: colors.filterBar, borderRadius: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-8" style={{ gap: "8px" }}>
            <AlertTriangle size={20} color={colors.red} />
            <p style={{ fontSize: "12px", color: colors.textMuted }}>Failed to load signals</p>
            <button onClick={fetchSignals} style={{ fontSize: "11px", color: colors.accent, background: "none", border: "none", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data && data.signals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p style={{ fontSize: "12px", color: colors.textMuted }}>No active signals — market conditions are neutral</p>
          </div>
        )}

        {!loading && !error && data && data.signals.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {data.signals.map(signal => {
              const isBuy = signal.action === "BUY";
              const actionColor = isBuy ? colors.green : colors.red;
              const actionBg = isBuy ? colors.greenBg : colors.redBg;

              return (
                <div
                  key={signal.id}
                  style={{
                    background: colors.filterBar,
                    border: `1px solid ${colors.cardBorder}`,
                    borderLeft: `3px solid ${actionColor}`,
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center rounded-md" style={{ width: "30px", height: "30px", background: actionBg }}>
                        {isBuy ? <TrendingUp size={14} color={actionColor} /> : <TrendingDown size={14} color={actionColor} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>{signal.symbol}</span>
                          <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: actionBg, color: actionColor }}>
                            {signal.action}
                          </span>
                          <RiskBadge level={signal.riskLevel} />
                        </div>
                        <span style={{ fontSize: "11px", color: colors.textMuted }}>{signal.timeframe} · R/R {signal.riskRewardRatio}:1</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                      <Clock size={10} color={colors.textMuted} />
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>
                        Exp {new Date(signal.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Entry", value: `$${signal.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}`, color: colors.textPrimary },
                      { label: "Stop", value: `$${signal.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 4 })}`, color: colors.red },
                      { label: "Target", value: `$${signal.takeProfit.toLocaleString(undefined, { maximumFractionDigits: 4 })}`, color: colors.green },
                    ].map(cell => (
                      <div key={cell.label} style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "9px", color: colors.textMuted, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{cell.label}</p>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: cell.color }}>{cell.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: "10px", color: colors.textMuted }}>Confidence</span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: actionColor }}>{signal.confidence}%</span>
                    </div>
                    <ConfidenceBar value={signal.confidence} color={actionColor} />
                  </div>

                  <div style={{ padding: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                    <p style={{ fontSize: "11px", color: colors.textSub, lineHeight: 1.5 }}>{signal.reasoning}</p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    {[
                      { label: "RSI", value: signal.indicators.rsi.toFixed(0) },
                      { label: "Trend", value: signal.indicators.trend },
                      { label: "Vol", value: signal.indicators.volatility },
                    ].map(ind => (
                      <span key={ind.label} style={{ fontSize: "10px", color: colors.textMuted }}>
                        <span style={{ fontWeight: 600, color: colors.textSub }}>{ind.label}:</span> {ind.value}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
