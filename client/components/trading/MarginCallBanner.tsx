import { useState, useEffect } from "react";
import { AlertTriangle, X, TrendingDown, CheckCircle } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

interface MarginStatus {
  status: "SAFE" | "WARNING" | "DANGER" | "MARGIN_CALL" | "LIQUIDATION";
  balance: number;
  availableMargin: number;
  marginRatio: number;
  liquidationLevel: number;
  warningLevel: number;
  message: string;
  requiredDeposit: number;
  maintenanceMargin: number;
}

const API = getApiBase();

export default function MarginCallBanner() {
  const { colors } = useTheme();
  const [margin, setMargin] = useState<MarginStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/ai/margin-call`, { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<{ margin: MarginStatus }> : null)
      .then(d => { if (d) setMargin(d.margin); })
      .catch(() => {});
  }, []);

  if (!margin || dismissed || margin.status === "SAFE") return null;

  const config = {
    WARNING:     { bg: colors.yellowBg,  border: colors.yellow, icon: AlertTriangle, iconColor: colors.yellow,  title: "Low Margin Warning" },
    DANGER:      { bg: colors.redBg,     border: colors.red,    icon: AlertTriangle, iconColor: colors.red,     title: "Margin Danger Level" },
    MARGIN_CALL: { bg: colors.redBg,     border: colors.red,    icon: TrendingDown,  iconColor: colors.red,     title: "Margin Call Triggered" },
    LIQUIDATION: { bg: colors.redBg,     border: colors.red,    icon: TrendingDown,  iconColor: colors.red,     title: "Liquidation Risk" },
  }[margin.status] ?? { bg: colors.yellowBg, border: colors.yellow, icon: AlertTriangle, iconColor: colors.yellow, title: "Margin Alert" };

  const Icon = config.icon;

  return (
    <div style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: "10px",
      padding: "14px 16px",
      marginBottom: "16px",
    }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: "34px", height: "34px", background: `${config.iconColor}20` }}>
            <Icon size={16} color={config.iconColor} />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary, marginBottom: "3px" }}>{config.title}</p>
            <p style={{ fontSize: "12px", color: colors.textSub, lineHeight: 1.5 }}>{margin.message}</p>
            {margin.requiredDeposit > 0 && (
              <p style={{ fontSize: "11px", color: config.iconColor, marginTop: "4px", fontWeight: 600 }}>
                Deposit required: ${margin.requiredDeposit.toLocaleString(undefined, { maximumFractionDigits: 2 })} to restore safe margin
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: "Balance", value: `$${margin.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          { label: "Available Margin", value: `$${margin.availableMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
          { label: "Margin Ratio", value: `${(margin.marginRatio * 100).toFixed(1)}%` },
        ].map(item => (
          <div key={item.label} style={{ background: "rgba(0,0,0,0.15)", borderRadius: "8px", padding: "8px 10px" }}>
            <p style={{ fontSize: "9px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{item.label}</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarginStatusIndicator() {
  const { colors } = useTheme();
  const [margin, setMargin] = useState<MarginStatus | null>(null);

  useEffect(() => {
    fetch(`${API}/api/ai/margin-call`, { credentials: "include" })
      .then(r => r.ok ? r.json() as Promise<{ margin: MarginStatus }> : null)
      .then(d => { if (d) setMargin(d.margin); })
      .catch(() => {});
  }, []);

  if (!margin) return null;

  const isSafe = margin.status === "SAFE";
  const color = isSafe ? colors.green : margin.status === "WARNING" ? colors.yellow : colors.red;
  const Icon = isSafe ? CheckCircle : AlertTriangle;

  return (
    <div className="flex items-center gap-2" style={{ padding: "8px 12px", background: isSafe ? colors.greenBg : colors.redBg, borderRadius: "8px", border: `1px solid ${color}30` }}>
      <Icon size={12} color={color} />
      <span style={{ fontSize: "11px", fontWeight: 600, color }}>
        Margin: {margin.status.replace("_", " ")}
      </span>
    </div>
  );
}
