import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import AiSignalsPanel from "@/components/trading/AiSignalsPanel";
import MarginCallBanner from "@/components/trading/MarginCallBanner";
import TradingStatusCard from "@/components/trading/TradingStatusCard";
import TradeOrderForm from "@/components/trading/TradeOrderForm";
import VoiceAgentPanel from "@/components/trading/VoiceAgentPanel";
import { Cpu } from "lucide-react";

export default function Trading() {
  const { colors } = useTheme();

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center rounded-xl" style={{ width: "40px", height: "40px", background: "rgba(59,130,246,0.12)" }}>
            <Cpu size={18} color={colors.accent} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.02em" }}>
              AI Trading Engine
            </h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>
              Guardian Intelligence · Real-time signals, risk management & order execution
            </p>
          </div>
        </div>

        <MarginCallBanner />

        <div className="flex flex-col xl:flex-row gap-5">
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            <AiSignalsPanel />
            <TradeOrderForm />
          </div>

          <div className="flex flex-col gap-5" style={{ width: "100%", maxWidth: "340px" }}>
            <VoiceAgentPanel />
            <TradingStatusCard />
          </div>
        </div>

        <div className="rounded-xl mt-5" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px 20px" }}>
          <p style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: colors.textSub }}>Regulatory Disclaimer:</span> Guardian Intelligence provides market analysis and educational context only. All signals are algorithmic in nature and do not constitute investment advice, a solicitation, or a recommendation to buy or sell any security. The simulated order system is for educational purposes only — no real trades are executed and no capital is at risk. Past performance does not guarantee future results. All trading involves risk of loss.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
