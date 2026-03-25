import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

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

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Portfolio</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Investment analytics & holdings</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Value", value: "$0.00" },
            { label: "Total Return", value: "0.00%" },
            { label: "Day Change", value: "$0.00" },
            { label: "Holdings", value: "0" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px" }}>
              <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: "8px" }}>{c.label}</p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
          <div className="lg:col-span-3 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Live Chart</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Real-time price tracking</p>
            <EmptyState
              icon={TrendingUp}
              title="No holdings to chart"
              message="Once you purchase assets, live price charts will appear here."
            />
          </div>

          <div className="lg:col-span-2 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Allocation</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "16px" }}>Portfolio distribution</p>
            <EmptyState
              icon={PieChartIcon}
              title="No assets yet"
              message="Your asset allocation breakdown will appear here once you hold investments."
            />
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
