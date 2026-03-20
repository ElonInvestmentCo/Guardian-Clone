import { useState } from "react";
import { Bell } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from "recharts";
import DashboardLayout from "./DashboardLayout";

const chartData = [
  { month: "Jan", value: 88000 }, { month: "Feb", value: 76000 },
  { month: "Mar", value: 83000 }, { month: "Apr", value: 79000 },
  { month: "May", value: 86000 }, { month: "Jun", value: 91000 },
  { month: "Jul", value: 89000 }, { month: "Aug", value: 127450 },
  { month: "Sep", value: 118000 }, { month: "Oct", value: 124000 },
  { month: "Nov", value: 130000 }, { month: "Dec", value: 127000 },
];

const sparkData = [
  { v: 420 }, { v: 380 }, { v: 450 }, { v: 420 }, { v: 470 },
  { v: 440 }, { v: 490 }, { v: 460 }, { v: 510 }, { v: 490 },
];

const trades = [
  { symbol: "AAPL", id: "323133", amount: "+$3,430", status: "Open",      date: "22/03/26", acct: "3010", dir: "+" },
  { symbol: "TSLA", id: "134325", amount: "+$200",   status: "Closed",    date: "19/03/26", acct: "4026", dir: "+" },
  { symbol: "NVDA", id: "433229", amount: "-$41",    status: "Cancelled", date: "15/03/26", acct: "5400", dir: "-" },
  { symbol: "AMD",  id: "632132", amount: "+$1,200", status: "Closed",    date: "12/03/26", acct: "4322", dir: "+" },
];

const statusStyle: Record<string, React.CSSProperties> = {
  Open:      { background: "#fff8e1", color: "#f59e0b", border: "1px solid #fde68a" },
  Closed:    { background: "#e8f5e9", color: "#28a745", border: "1px solid #c3e6cb" },
  Cancelled: { background: "#fdecea", color: "#dc3545", border: "1px solid #f5c6cb" },
};

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1c2e3e", color: "#fff", borderRadius: "10px", padding: "5px 12px", fontSize: "13px", fontWeight: 700 }}>
      ${((payload[0].value as number) / 1000).toFixed(0)}K
    </div>
  );
}

export default function Overview() {
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

  const [recipientName, setRecipientName] = useState("Royal Pervej");
  const [amount, setAmount] = useState("140.00");

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "28px 24px" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111" }}>Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell size={20} color="#555" style={{ cursor: "pointer" }} />
                <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                  style={{ width: "14px", height: "14px", background: "#3a7bd5", fontSize: "8px", fontWeight: 700 }}>3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-full font-bold text-white"
                  style={{ width: "32px", height: "32px", background: "#3a7bd5", fontSize: "13px" }}>
                  {displayName[0]?.toUpperCase() ?? "U"}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{displayName}</span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="flex gap-4 mb-5">
            <div className="flex-1 rounded-xl p-5" style={{ background: "#e8f5f5" }}>
              <p style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>Portfolio Value</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#111", marginBottom: "10px" }}>$127,450</p>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: "12px", color: "#777" }}>24 Positions</p>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#28a745" }}>+2.3%</span>
              </div>
            </div>
            <div className="flex-1 rounded-xl p-5" style={{ background: "#fff0f0" }}>
              <p style={{ fontSize: "12px", color: "#555", marginBottom: "8px" }}>Today's P&L</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#111", marginBottom: "10px" }}>+$2,340</p>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: "12px", color: "#777" }}>8 Trades</p>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#28a745" }}>+1.8%</span>
              </div>
            </div>
            <div className="flex-1 rounded-xl p-5" style={{ background: "#fffbeb" }}>
              <div className="flex items-start justify-between mb-1">
                <p style={{ fontSize: "12px", color: "#555" }}>Activity</p>
                <span className="px-1.5 py-0.5 rounded text-white font-bold" style={{ fontSize: "9px", background: "#28a745" }}>+%</span>
              </div>
              <div style={{ height: "40px", marginBottom: "6px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                    <Line type="monotone" dataKey="v" stroke="#1c2e3e" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: "10px", color: "#999", marginBottom: "1px" }}>Buying Power</p>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>$45,200</p>
            </div>
          </div>

          {/* Overview Chart */}
          <div className="rounded-xl mb-5" style={{ background: "#fff", padding: "20px 22px" }}>
            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>Portfolio Overview</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#aaa" }}
                  axisLine={false} tickLine={false} domain={[0, 140000]}
                  ticks={[0, 20000, 40000, 60000, 80000, 100000, 120000, 140000]} width={36} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#e0e0e0", strokeWidth: 1 }} />
                <Line type="monotone" dataKey="value" stroke="#3a7bd5" strokeWidth={2} dot={false}
                  activeDot={{ r: 5, fill: "#3a7bd5", stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transactions */}
          <div className="rounded-xl" style={{ background: "#fff", padding: "20px 22px" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "16px" }}>Recent Trades</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Symbol", "Trade ID", "P&L", "Status", "Date", "Account"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: "11px", color: "#aaa", fontWeight: 600, paddingBottom: "10px", borderBottom: "1px solid #f5f5f5" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f9f9f9" }}>
                    <td style={{ padding: "10px 0" }}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
                          style={{ width: "28px", height: "28px", background: "#1c2e3e", fontSize: "10px" }}>
                          {t.symbol[0]}
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{t.symbol}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", color: "#999" }}>{t.id}</td>
                    <td style={{ fontSize: "13px", fontWeight: 600, color: t.dir === "+" ? "#28a745" : "#dc3545" }}>{t.amount}</td>
                    <td>
                      <span className="inline-block px-2.5 py-1 rounded" style={{ ...statusStyle[t.status], fontSize: "11px" }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#999" }}>{t.date}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#e00" }} />
                          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#f90", marginLeft: "-5px" }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "#999" }}>**** {t.acct}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <aside className="flex flex-col flex-shrink-0 overflow-y-auto" style={{ width: "270px", background: "#fff", borderLeft: "1px solid #f0f0f0", padding: "28px 20px" }}>
          <div className="mb-5">
            <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>Account Equity</p>
            <p style={{ fontSize: "26px", fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>$127,450</p>
          </div>
          <div className="flex gap-2 mb-6">
            <button style={{ flex: 1, padding: "9px", fontSize: "13px", fontWeight: 600, border: "1.5px solid #ddd", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#333" }}>Deposit</button>
            <button style={{ flex: 1, padding: "9px", fontSize: "13px", fontWeight: 600, border: "1.5px solid #ddd", borderRadius: "8px", background: "#fff", cursor: "pointer", color: "#333" }}>Withdraw</button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>Linked Accounts</p>
          </div>
          <div className="rounded-xl mb-3 p-4" style={{ background: "#1c2e3e", color: "#fff" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#e00", opacity: 0.9 }} />
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#f90", opacity: 0.9, marginLeft: "-7px" }} />
              </div>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #fff", opacity: 0.6 }} />
            </div>
            <p style={{ fontSize: "13px", letterSpacing: "0.12em", marginBottom: "14px", opacity: 0.85 }}>6375 8456 9825 6775</p>
            <div className="flex items-end justify-between">
              <div>
                <p style={{ fontSize: "9px", opacity: 0.5, marginBottom: "2px" }}>Name</p>
                <p style={{ fontSize: "12px", fontWeight: 600 }}>{displayName}</p>
              </div>
              <div>
                <p style={{ fontSize: "9px", opacity: 0.5, marginBottom: "2px" }}>Exp Date</p>
                <p style={{ fontSize: "12px", fontWeight: 600 }}>08/28</p>
              </div>
              <div style={{ width: "28px", height: "20px", background: "#c0a060", borderRadius: "3px" }} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-5 p-3 rounded-lg" style={{ border: "1px solid #f0f0f0" }}>
            <div className="flex items-center">
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#e00" }} />
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#f90", marginLeft: "-5px" }} />
            </div>
            <span style={{ fontSize: "12px", color: "#555" }}>1234 2345 6789</span>
          </div>

          <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>Recipient Name</p>
          <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", marginBottom: "12px", boxSizing: "border-box", color: "#333", outline: "none" }} />

          <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px" }}>Amount</p>
          <div className="flex gap-2 mb-5">
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg flex-shrink-0" style={{ border: "1.5px solid #e8e8e8", fontSize: "13px", color: "#333" }}>
              USD <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", color: "#333", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700, background: "#1c2e3e", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            Send Money
          </button>
        </aside>
      </div>
    </DashboardLayout>
  );
}
