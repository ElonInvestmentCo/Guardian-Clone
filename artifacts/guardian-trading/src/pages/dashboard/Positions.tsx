import { useState } from "react";
import { TrendingUp, ArrowUpRight, Briefcase } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

function BarChart3Icon({ size = 24, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
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

export default function Positions() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"All" | "Long" | "Short">("All");

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Positions</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Active market positions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Positions", value: "0", sub: "No open positions", subColor: colors.accent, icon: BarChart3Icon, gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
            { label: "Market Value", value: "$0.00", sub: "Across all positions", subColor: colors.textMuted, icon: TrendingUp, gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)" },
            { label: "Unrealised P&L", value: "$0.00", sub: "No active trades", subColor: colors.textMuted, icon: ArrowUpRight, gradient: "linear-gradient(135deg, #10b981, #059669)" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px" }}>
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{c.label}</p>
                <div className="flex items-center justify-center rounded-lg" style={{ width: "28px", height: "28px", background: c.gradient }}>
                  <c.icon size={14} color="#fff" />
                </div>
              </div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, marginBottom: "4px" }}>{c.value}</p>
              <span style={{ fontSize: "11px", fontWeight: 600, color: c.subColor }}>{c.sub}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <input
              placeholder="Search positions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 14px", fontSize: "13px", border: `1px solid ${colors.inputBorder}`, borderRadius: "10px", color: colors.inputText, background: colors.inputBg, outline: "none" }}
            />
            <div className="flex gap-1 p-0.5 rounded-lg flex-shrink-0" style={{ background: colors.filterBar }}>
              {(["All", "Long", "Short"] as const).map(f => (
                <button key={f} onClick={() => setSideFilter(f)} style={{
                  padding: "6px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "7px",
                  border: "none", cursor: "pointer",
                  background: sideFilter === f ? colors.accent : "transparent",
                  color: sideFilter === f ? "#fff" : colors.filterInactiveText,
                }}>{f}</button>
              ))}
            </div>
          </div>

          <EmptyState
            icon={Briefcase}
            title="No open positions"
            message="Your active market positions will appear here once you place and execute trades."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
