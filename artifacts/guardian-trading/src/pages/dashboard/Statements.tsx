import { useState } from "react";
import { Bell, Download, FileText, Filter } from "lucide-react";
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

const TYPE_STYLE: Record<string, React.CSSProperties> = {
  Trade:      { background: "#e8f0fb", color: "#3a7bd5" },
  Deposit:    { background: "#e8f5e9", color: "#28a745" },
  Withdrawal: { background: "#fdecea", color: "#dc3545" },
  Dividend:   { background: "#fffbeb", color: "#f59e0b" },
  Fee:        { background: "#f5f5f5", color: "#888"    },
};

export default function Statements() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

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

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 16px" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Statements</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => handleDownload("csv")} className="flex items-center gap-2"
              style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: `1.5px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.btnText, cursor: "pointer" }}>
              <Download size={13} /> {downloading === "csv" ? "Exporting..." : "CSV"}
            </button>
            <button onClick={() => handleDownload("pdf")} className="flex items-center gap-2"
              style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, border: `1.5px solid ${colors.btnBorder}`, borderRadius: "8px", background: colors.btnBg, color: colors.btnText, cursor: "pointer" }}>
              <FileText size={13} /> {downloading === "pdf" ? "Generating..." : "PDF"}
            </button>
            <div className="relative">
              <Bell size={20} color={colors.bellColor} style={{ cursor: "pointer" }} />
              <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                style={{ width: "14px", height: "14px", background: "#3a7bd5", fontSize: "8px", fontWeight: 700 }}>3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full font-bold text-white"
                style={{ width: "32px", height: "32px", background: "#3a7bd5", fontSize: "13px" }}>
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden sm:inline" style={{ fontSize: "13px", fontWeight: 600, color: colors.textSub }}>{displayName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Credits</p>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#28a745" }}>+${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>{TRANSACTIONS.filter((t) => t.amount > 0).length} transactions</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Debits</p>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#dc3545" }}>-${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>{TRANSACTIONS.filter((t) => t.amount < 0).length} transactions</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: colors.card }}>
            <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Current Balance</p>
            <p style={{ fontSize: "22px", fontWeight: 800, color: colors.textPrimary }}>$127,450.00</p>
            <p style={{ fontSize: "11px", color: "#3a7bd5", fontWeight: 600, marginTop: "4px" }}>Account Equity</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: colors.textMuted, fontSize: "13px" }}>
            <Filter size={14} /> Filter:
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.filterBar }}>
              {(["All", "Trade", "Deposit", "Withdrawal", "Dividend", "Fee"] as const).map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  style={{ padding: "4px 12px", fontSize: "11px", fontWeight: 600, borderRadius: "5px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: typeFilter === f ? colors.filterActiveBg : "transparent",
                    color: typeFilter === f ? colors.filterActiveText : colors.filterInactiveText,
                    boxShadow: typeFilter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
            style={{ padding: "7px 14px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", outline: "none", color: colors.inputText, background: colors.inputBg, minWidth: "0" }} />
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Transaction ID", "Date", "Description", "Type", "Symbol", "Qty", "Price", "Amount", "Balance"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: "#3a7bd5", fontWeight: 600 }}>{t.id}</td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{t.date}</td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub, fontWeight: 500 }}>{t.description}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ ...TYPE_STYLE[t.type], fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>{t.type}</span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{t.symbol ?? "---"}</td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{t.qty ?? "---"}</td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{t.price ? `$${t.price.toFixed(2)}` : "---"}</td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 700, color: t.amount >= 0 ? "#28a745" : "#dc3545" }}>
                    {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub, fontWeight: 500 }}>
                    ${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No transactions match your filters.</div>
          )}
        </div>

        <div className="block sm:hidden space-y-3">
          {filtered.map((t, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: colors.card }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textSub }}>{t.description}</span>
                <span style={{ ...TYPE_STYLE[t.type], fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>{t.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "15px", fontWeight: 700, color: t.amount >= 0 ? "#28a745" : "#dc3545" }}>
                  {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>{t.date}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span style={{ fontSize: "11px", color: "#3a7bd5", fontWeight: 600 }}>{t.id}</span>
                <span style={{ fontSize: "11px", color: colors.textMuted }}>Bal: ${t.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No transactions match your filters.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
