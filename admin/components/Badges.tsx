import type { RiskLevel, UserStatus } from "@/lib/api";
import { riskColors, riskLabel, statusColors, statusLabel } from "@/lib/utils";

interface BadgeProps { style?: React.CSSProperties; }

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number } & BadgeProps) {
  const c = riskColors(level);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: c.text, flexShrink: 0,
      }} />
      {riskLabel(level)}{score !== undefined && ` · ${score}`}
    </span>
  );
}

export function StatusBadge({ status }: { status: UserStatus } & BadgeProps) {
  const c = statusColors(status);
  return (
    <span style={{
      display: "inline-block",
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "11px", fontWeight: "600",
    }}>
      {statusLabel(status)}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: "info" | "warning" | "critical" }) {
  const map = {
    critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "CRITICAL" },
    warning:  { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA", label: "WARN" },
    info:     { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", label: "INFO" },
  };
  const c = map[severity];
  return (
    <span style={{
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: "3px", padding: "1px 6px",
      fontSize: "10px", fontWeight: "700", letterSpacing: "0.05em",
    }}>
      {c.label}
    </span>
  );
}
