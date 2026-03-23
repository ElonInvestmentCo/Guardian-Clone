import { useState } from "react";
import { Download, FileText, Filter } from "lucide-react";
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

const TRANSACTIONS: Transaction[] = [
  { id: "TXN-2001", date: "20/03/26", description: "Buy AAPL",    type: "Trade",      symbol: "AAPL", qty: 50,  price: 185.00, amount: -9250.00,  balance: 127450.00 },
  { id: "TXN-2002", date: "20/03/26", description: "Sell TSLA",   type: "Trade",      symbol: "TSLA", qty: 20,  price: 248.50, amount: +4970.00,  balance: 136700.00 },
  { id: "TXN-2003", date: "19/03/26", description: "Buy NVDA",    type: "Trade",      symbol: "NVDA", qty: 10,  price: 820.00, amount: -8200.00,  balance: 131730.00 },
  { id: "TXN-2004", date: "19/03/26", description: "Deposit",     type: "Deposit",                                              amount: +10000.00, balance: 139930.00 },
  { id: "TXN-2005", date: "18/03/26", description: "Sell META",   type: "Trade",      symbol: "META", qty: 25,  price: 535.00, amount: +13375.00, balance: 129930.00 },
  { id: "TXN-2006", date: "18/03/26", description: "AAPL Div.",   type: "Dividend",   symbol: "AAPL",                           amount: +37.50,    balance: 116555.00 },
  { id: "TXN-2007", date: "17/03/26", description: "Buy AMD",     type: "Trade",      symbol: "AMD",  qty: 60,  price: 172.30, amount: -10338.00, balance: 116517.50 },
  { id: "TXN-2008", date: "17/03/26", description: "Trading Fee", type: "Fee",                                                   amount: -12.50,    balance: 126855.50 },
  { id: "TXN-2009", date: "16/03/26", description: "Withdrawal",  type: "Withdrawal",                                           amount: -5000.00,  balance: 126868.00 },
  { id: "TXN-2010", date: "16/03/26", description: "Sell GOOG",   type: "Trade",      symbol: "GOOG", qty: 20,  price: 168.90, amount: +3378.00,  balance: 131868.00 },
  { id: "TXN-2011", date: "15/03/26", description: "Buy MSFT",    type: "Trade",      symbol: "MSFT", qty: 50,  price: 415.00, amount: -20750.00, balance: 128490.00 },
  { id: "TXN-2012", date: "15/03/26", description: "Deposit",     type: "Deposit",                                              amount: +25000.00, balance: 149240.00 },
];

export default function Statements() {
  const { colors } = useTheme();

  const [typeFilter, setTypeFilter] = useState<"All" | Transaction["type"]>("All");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<"csv" | "pdf" | null>(null);

  const filtered = TRANSACTIONS.filter((t) =>
    (typeFilter === "All" || t.type === typeFilter) &&
    (t.description.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || (t.symbol ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleDownload = (format: "csv" | "pdf") => {
    setDownloading(format);
    if (format === "csv") {
      const headers = ["ID", "Date", "Description", "Type", "Symbol", "Qty", "Price", "Amount", "Balance"];
      const rows = TRANSACTIONS.map((t) => [t.id, t.date, t.description, t.type, t.symbol ?? "", t.qty ?? "", t.price ?? "", t.amount, t.balance].join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "guardian_trading_statement.csv"; a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => setDownloading(null), 1200);
  };

  const totalIn  = TRANSACTIONS.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = Math.abs(TRANSACTIONS.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  const typeStyle = (type: string): { bg: string; text: string } => {
    switch (type) {
      case "Trade":      return { bg: "rgba(59,130,246,0.12)", text: colors.accent };
      case "Deposit":    return { bg: colors.greenBg, text: colors.green };
      case "Withdrawal": return { bg: colors.redBg, text: colors.red };
      case "Dividend":   return { bg: colors.yellowBg, text: colors.yellow };
      case "Fee":        return { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
      default:           return { bg: colors.filterBar, text: colors.textMuted };
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Statements</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Transaction history & records</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleDownload("csv")} className="flex items-center gap-2"
              style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.btnText, cursor: "pointer" }}>
              <Download size={13} /> {downloading === "csv" ? "Exporting..." : "CSV"}
            </button>
            <button disabled className="flex items-center gap-2"
              title="PDF export coming soon"
              style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.textMuted, cursor: "not-allowed", opacity: 0.5 }}>
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Credits", value: `+$${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueColor: colors.green, sub: `${TRANSACTIONS.filter((t) => t.amount > 0).length} transactions`, gradient: "linear-gradient(135deg, #10b981, #059669)" },
            { label: "Total Debits", value: `-$${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, valueColor: colors.red, sub: `${TRANSACTIONS.filter((t) => t.amount < 0).length} transactions`, gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
            { label: "Current Balance", value: "$127,450.00", valueColor: colors.textPrimary, sub: "Account Equity", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px" }}>
              <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{c.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: c.valueColor, letterSpacing: "-0.02em" }}>{c.value}</p>
              <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: colors.textMuted, fontSize: "13px" }}>
            <Filter size={14} /> Filter:
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.filterBar }}>
              {(["All", "Trade", "Deposit", "Withdrawal", "Dividend", "Fee"] as const).map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  style={{ padding: "5px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: typeFilter === f ? colors.filterActiveBg : "transparent",
                    color: typeFilter === f ? colors.filterActiveText : colors.filterInactiveText }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg" style={{ padding: "7px 14px", background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", color: colors.inputText, background: "transparent" }} />
          </div>
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Transaction ID", "Date", "Description", "Type", "Symbol", "Qty", "Price", "Amount", "Balance"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.divider}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const ts = typeStyle(t.type);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.accent, fontWeight: 600 }}>{t.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{t.date}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub, fontWeight: 500 }}>{t.description}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: ts.bg, color: ts.text, fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600 }}>{t.type}</span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{t.symbol ?? "---"}</td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{t.qty ?? "---"}</td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{t.price ? `$${t.price.toFixed(2)}` : "---"}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 700, color: t.amount >= 0 ? colors.green : colors.red }}>
                      {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub, fontWeight: 500 }}>
                      ${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No transactions match your filters.</div>
          )}
        </div>

        <div className="block sm:hidden space-y-3">
          {filtered.map((t, i) => {
            const ts = typeStyle(t.type);
            return (
              <div key={i} className="rounded-xl p-4" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textSub }}>{t.description}</span>
                  <span style={{ background: ts.bg, color: ts.text, fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600 }}>{t.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "15px", fontWeight: 700, color: t.amount >= 0 ? colors.green : colors.red }}>
                    {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: "12px", color: colors.textMuted }}>{t.date}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span style={{ fontSize: "11px", color: colors.accent, fontWeight: 600 }}>{t.id}</span>
                  <span style={{ fontSize: "11px", color: colors.textMuted }}>Bal: ${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No transactions match your filters.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
