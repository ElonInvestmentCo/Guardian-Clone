import { useState } from "react";
import { CreditCard, CheckCircle, ArrowRight, Download, FileText, Zap, Shield, BarChart2, Phone } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

const PLAN_FEATURES = [
  "Access to DAS Trader Pro & Sterling Trader® Pro",
  "Options contracts from $0.15 per contract",
  "Equities commissions from $0.0005 per share",
  "30+ order routing options (ALGO & dark pool)",
  "In-house stock borrow & locate desk",
  "ECN rebates & liquidity access",
  "API trading connectivity",
  "Dedicated client support team",
];

const MOCK_INVOICES = [
  { id: "INV-2025-001", date: "May 1, 2025",  desc: "Monthly platform fee",  amount: "$0.00", status: "Paid" },
  { id: "INV-2025-002", date: "Apr 1, 2025",  desc: "Monthly platform fee",  amount: "$0.00", status: "Paid" },
  { id: "INV-2025-003", date: "Mar 1, 2025",  desc: "Monthly platform fee",  amount: "$0.00", status: "Paid" },
];

export default function Billing() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<"plan" | "invoices">("plan");

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px", maxWidth: "860px" }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Billing</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Plan details, commissions & invoice history</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: colors.filterBar, width: "fit-content" }}>
          {(["plan", "invoices"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer",
                background: tab === t ? colors.card : "transparent",
                color: tab === t ? colors.textPrimary : colors.textMuted,
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
                textTransform: "capitalize",
              }}
            >
              {t === "plan" ? "Current Plan" : "Invoice History"}
            </button>
          ))}
        </div>

        {tab === "plan" && (
          <>
            <div className="rounded-2xl mb-5 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ padding: "4px 0", background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #8b5cf6)" }} />
              <div style={{ padding: "28px 24px" }}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} color={colors.accent} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Plan</span>
                    </div>
                    <h2 style={{ fontSize: "26px", fontWeight: 800, color: colors.textPrimary, marginBottom: "6px" }}>Pro Account</h2>
                    <p style={{ fontSize: "13px", color: colors.textMuted, maxWidth: "420px" }}>
                      Full access to Guardian Trading's professional trading infrastructure, platforms, and support.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: colors.greenBg, border: `1px solid ${colors.green}22` }}>
                    <CheckCircle size={13} color={colors.green} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: colors.green }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { icon: <BarChart2 size={18} color={colors.accent} />, label: "Options", value: "$0.15", sub: "per contract (as low as)" },
                { icon: <CreditCard size={18} color={colors.purple} />, label: "Equities", value: "$0.0005", sub: "per share (as low as)" },
                { icon: <Shield size={18} color={colors.green} />, label: "Routing", value: "30+", sub: "order route options" },
              ].map(({ icon, label, value, sub }) => (
                <div key={label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px 20px" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center justify-center rounded-lg" style={{ width: "34px", height: "34px", background: colors.filterBar }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 500 }}>{label}</span>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: 800, color: colors.textPrimary, marginBottom: "2px" }}>{value}</p>
                  <p style={{ fontSize: "11px", color: colors.textMuted }}>{sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl mb-5" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "16px" }}>What's included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {PLAN_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle size={14} color={colors.green} style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "12.5px", color: colors.textSub }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl" style={{ background: colors.filterBar, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center rounded-lg" style={{ width: "36px", height: "36px", background: colors.card }}>
                  <Phone size={16} color={colors.textMuted} />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>Need to modify your plan?</p>
                  <p style={{ fontSize: "11px", color: colors.textMuted }}>Contact our team for commission negotiations and account upgrades</p>
                </div>
              </div>
              <a href="/support">
                <button className="flex items-center gap-2" style={{
                  padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  background: colors.accent, border: "none", color: "#fff", cursor: "pointer",
                }}>
                  Contact Support <ArrowRight size={14} />
                </button>
              </a>
            </div>
          </>
        )}

        {tab === "invoices" && (
          <div className="rounded-xl overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.tableRowBorder}` }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Invoice History</h3>
              <button className="flex items-center gap-1.5" style={{
                padding: "6px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
                border: `1px solid ${colors.inputBorder}`, background: "transparent", color: colors.textMuted, cursor: "pointer",
              }}>
                <Download size={13} /> Export
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: colors.tableHead }}>
                  {["Invoice", "Date", "Description", "Amount", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", fontSize: "10px", fontWeight: 700, color: colors.tableHeaderText, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: `1px solid ${colors.tableRowBorder}` }}>
                    <td style={{ padding: "14px 20px", fontSize: "12.5px", fontWeight: 600, color: colors.textPrimary }}>{inv.id}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12.5px", color: colors.textSub }}>{inv.date}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12.5px", color: colors.textSub }}>{inv.desc}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12.5px", fontWeight: 700, color: colors.textPrimary }}>{inv.amount}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{ fontSize: "10px", fontWeight: 700, color: colors.green, background: colors.greenBg }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <button className="flex items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "11px" }}>
                        <FileText size={12} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
