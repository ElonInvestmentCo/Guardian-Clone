import { useState } from "react";
import { Download, FileText } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "Trade" | "Deposit" | "Withdrawal" | "Dividend" | "Fee";
  symbol?: string;
  qty?: number;
  price?: number;
  amount: number;
  balance: number;
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

export default function Statements() {
  const { colors } = useTheme();
  const TRANSACTIONS: Transaction[] = [];

  const [typeFilter, setTypeFilter] = useState<"All" | Transaction["type"]>("All");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<"csv" | null>(null);

  const filtered = TRANSACTIONS.filter((t) =>
    (typeFilter === "All" || t.type === typeFilter) &&
    (t.description.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || (t.symbol ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownload = (format: "csv") => {
    if (TRANSACTIONS.length === 0) return;
    setDownloading(format);
    const headers = ["ID", "Date", "Description", "Type", "Symbol", "Qty", "Price", "Amount", "Balance"];
    const rows = TRANSACTIONS.map((t) => [t.id, t.date, t.description, t.type, t.symbol ?? "", t.qty ?? "", t.price ?? "", t.amount, t.balance].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guardian_trading_statement.csv"; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(null), 1200);
  };

  const totalIn  = TRANSACTIONS.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = TRANSACTIONS.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netBalance = totalIn - totalOut;

  const typeColors: Record<string, { bg: string; text: string }> = {
    Trade:      { bg: colors.purpleBg, text: colors.purple },
    Deposit:    { bg: colors.greenBg, text: colors.green },
    Withdrawal: { bg: colors.redBg, text: colors.red },
    Dividend:   { bg: colors.yellowBg, text: colors.yellow },
    Fee:        { bg: colors.filterBar, text: colors.textMuted },
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Statements</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Transaction history & reports</p>
          </div>
          <button
            onClick={() => handleDownload("csv")}
            disabled={TRANSACTIONS.length === 0}
            className="flex items-center gap-2"
            style={{
              padding: "9px 16px", fontSize: "13px", fontWeight: 600,
              border: `1px solid ${colors.btnBorder}`, borderRadius: "10px",
              background: colors.btnBg, color: colors.textSub, cursor: TRANSACTIONS.length === 0 ? "not-allowed" : "pointer",
              opacity: TRANSACTIONS.length === 0 ? 0.5 : 1,
            }}
          >
            <Download size={14} />
            {downloading ? "Exporting..." : "Export CSV"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Credits", value: `$${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: colors.green },
            { label: "Total Debits",  value: `$${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: colors.red },
            { label: "Net Balance",   value: `$${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: netBalance >= 0 ? colors.green : colors.red },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px" }}>
              <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, marginBottom: "8px" }}>{c.label}</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 14px", fontSize: "13px", border: `1px solid ${colors.inputBorder}`, borderRadius: "10px", color: colors.inputText, background: colors.inputBg, outline: "none" }}
            />
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
              {(["All", "Trade", "Deposit", "Withdrawal", "Dividend", "Fee"] as ("All" | Transaction["type"])[]).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: "6px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "7px",
                  border: "none", cursor: "pointer", flexShrink: 0,
                  background: typeFilter === t ? colors.accent : colors.filterBar,
                  color: typeFilter === t ? "#fff" : colors.filterInactiveText,
                }}>{t}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No transactions yet"
              message="Your transaction history will appear here once you make deposits, withdrawals, or trades."
            />
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                  <thead>
                    <tr>
                      {["ID", "Date", "Description", "Type", "Amount", "Balance"].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, paddingBottom: "12px", borderBottom: `1px solid ${colors.divider}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const tc = typeColors[t.type] ?? typeColors.Fee;
                      return (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                          <td style={{ padding: "12px 0", fontSize: "11px", color: colors.textMuted, fontFamily: "monospace" }}>{t.id}</td>
                          <td style={{ padding: "12px 8px", fontSize: "12px", color: colors.textMuted }}>{t.date}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: colors.textPrimary }}>{t.description}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span className="inline-block px-2.5 py-1 rounded-md" style={{ background: tc.bg, color: tc.text, fontSize: "11px", fontWeight: 600 }}>{t.type}</span>
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", fontWeight: 700, color: t.amount >= 0 ? colors.green : colors.red }}>
                            {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px 0 12px 8px", fontSize: "13px", color: colors.textPrimary }}>
                            ${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="block sm:hidden space-y-3">
                {filtered.map((t) => {
                  const tc = typeColors[t.type] ?? typeColors.Fee;
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl" style={{ border: `1px solid ${colors.divider}` }}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{t.description}</span>
                          <span className="px-2 py-0.5 rounded-md" style={{ background: tc.bg, color: tc.text, fontSize: "10px", fontWeight: 600 }}>{t.type}</span>
                        </div>
                        <span style={{ fontSize: "11px", color: colors.textMuted }}>{t.date}</span>
                      </div>
                      <div className="text-right">
                        <span style={{ fontSize: "13px", fontWeight: 700, color: t.amount >= 0 ? colors.green : colors.red, display: "block" }}>
                          {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                        </span>
                        <span style={{ fontSize: "10px", color: colors.textMuted }}>${t.balance.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
