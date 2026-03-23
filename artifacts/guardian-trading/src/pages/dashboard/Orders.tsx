import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

type OrderStatus = "Active" | "Pending" | "Filled" | "Cancelled";
type OrderType = "Market" | "Limit" | "Stop" | "Stop Limit";

interface Order {
  id: string;
  symbol: string;
  side: "Buy" | "Sell";
  type: OrderType;
  qty: number;
  price: number | null;
  filled: number;
  status: OrderStatus;
  date: string;
  time: string;
}

const ALL_ORDERS: Order[] = [
  { id: "ORD-1001", symbol: "AAPL", side: "Buy",  type: "Limit",      qty: 50,  price: 185.00, filled: 0,   status: "Active",    date: "20/03/26", time: "09:32:14" },
  { id: "ORD-1002", symbol: "TSLA", side: "Buy",  type: "Market",     qty: 20,  price: null,   filled: 20,  status: "Filled",    date: "20/03/26", time: "09:31:05" },
  { id: "ORD-1003", symbol: "NVDA", side: "Sell", type: "Limit",      qty: 10,  price: 890.00, filled: 0,   status: "Pending",   date: "20/03/26", time: "09:28:50" },
  { id: "ORD-1004", symbol: "AMD",  side: "Buy",  type: "Stop Limit", qty: 30,  price: 160.50, filled: 0,   status: "Pending",   date: "20/03/26", time: "09:15:22" },
  { id: "ORD-1005", symbol: "MSFT", side: "Buy",  type: "Market",     qty: 15,  price: null,   filled: 15,  status: "Filled",    date: "19/03/26", time: "14:42:11" },
  { id: "ORD-1006", symbol: "META", side: "Sell", type: "Limit",      qty: 25,  price: 535.00, filled: 0,   status: "Cancelled", date: "19/03/26", time: "11:20:33" },
  { id: "ORD-1007", symbol: "AMZN", side: "Buy",  type: "Stop",       qty: 40,  price: 180.00, filled: 0,   status: "Active",    date: "19/03/26", time: "10:05:47" },
  { id: "ORD-1008", symbol: "GOOG", side: "Sell", type: "Market",     qty: 20,  price: null,   filled: 20,  status: "Filled",    date: "18/03/26", time: "15:55:02" },
  { id: "ORD-1009", symbol: "AAPL", side: "Sell", type: "Limit",      qty: 30,  price: 192.00, filled: 0,   status: "Cancelled", date: "18/03/26", time: "10:11:09" },
  { id: "ORD-1010", symbol: "TSLA", side: "Buy",  type: "Limit",      qty: 10,  price: 245.00, filled: 10,  status: "Filled",    date: "17/03/26", time: "13:30:00" },
];

const STATUS_STYLE: Record<OrderStatus, React.CSSProperties> = {
  Active:    { background: "#e8f0fb", color: "#3a7bd5", border: "1px solid #c5d8f5" },
  Pending:   { background: "#fff8e1", color: "#f59e0b", border: "1px solid #fde68a" },
  Filled:    { background: "#e8f5e9", color: "#28a745", border: "1px solid #c3e6cb" },
  Cancelled: { background: "#f5f5f5", color: "#999",    border: "1px solid #e0e0e0" },
};

const TABS: OrderStatus[] = ["Active", "Pending", "Filled", "Cancelled"];

export default function Orders() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newSymbol, setNewSymbol] = useState("AAPL");
  const [newSide, setNewSide] = useState<"Buy" | "Sell">("Buy");
  const [newType, setNewType] = useState<OrderType>("Market");
  const [newQty, setNewQty] = useState("100");
  const [newPrice, setNewPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filtered = ALL_ORDERS.filter((o) =>
    (activeTab === "All" || o.status === activeTab) &&
    (o.symbol.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = Object.fromEntries(TABS.map((t) => [t, ALL_ORDERS.filter((o) => o.status === t).length]));

  const handleSubmitOrder = () => {
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowNewOrder(false); }, 2000);
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "20px 16px" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Orders</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNewOrder(true)}
              className="flex items-center gap-2"
              style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600, background: "#3a7bd5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              <Plus size={15} /> <span className="hidden sm:inline">New Order</span>
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

        {showNewOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="rounded-2xl w-full" style={{ background: colors.card, padding: "28px", maxWidth: "360px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Place New Order</h2>
                <button onClick={() => setShowNewOrder(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "20px" }}>x</button>
              </div>
              {submitted ? (
                <div className="py-6 text-center">
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>&#10003;</div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#28a745" }}>Order submitted!</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ background: colors.filterBar }}>
                    {(["Buy", "Sell"] as const).map((s) => (
                      <button key={s} onClick={() => setNewSide(s)} style={{ flex: 1, padding: "7px", fontSize: "13px", fontWeight: 600, borderRadius: "7px", border: "none", cursor: "pointer",
                        background: newSide === s ? (s === "Buy" ? "#28a745" : "#dc3545") : "transparent",
                        color: newSide === s ? "#fff" : colors.filterInactiveText }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {[
                    { label: "Symbol", el: <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box" as const }} /> },
                    { label: "Order Type", el: <select value={newType} onChange={(e) => setNewType(e.target.value as OrderType)} style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", color: colors.inputText, outline: "none", background: colors.inputBg }}>
                      {(["Market", "Limit", "Stop", "Stop Limit"] as const).map((t) => <option key={t}>{t}</option>)}</select> },
                    { label: "Quantity", el: <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box" as const }} /> },
                    ...(newType !== "Market" ? [{ label: "Limit Price ($)", el: <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 12px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box" as const }} /> }] : []),
                  ].map(({ label, el }) => (
                    <div key={label} className="mb-3">
                      <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                      {el}
                    </div>
                  ))}
                  <button onClick={handleSubmitOrder}
                    style={{ width: "100%", marginTop: "8px", padding: "11px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", border: "none", cursor: "pointer",
                      background: newSide === "Buy" ? "#28a745" : "#dc3545", color: "#fff" }}>
                    {newSide} {newSymbol || "---"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="overflow-x-auto">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: colors.filterBar }}>
              <button onClick={() => setActiveTab("All")}
                style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  background: activeTab === "All" ? colors.filterActiveBg : "transparent",
                  color: activeTab === "All" ? colors.filterActiveText : colors.filterInactiveText,
                  boxShadow: activeTab === "All" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                All ({ALL_ORDERS.length})
              </button>
              {TABS.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "5px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: activeTab === t ? colors.filterActiveBg : "transparent",
                    color: activeTab === t ? colors.filterActiveText : colors.filterInactiveText,
                    boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                  {t} ({counts[t]})
                </button>
              ))}
            </div>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..."
            style={{ padding: "8px 14px", fontSize: "13px", border: `1.5px solid ${colors.inputBorder}`, borderRadius: "8px", outline: "none", color: colors.inputText, background: colors.inputBg, minWidth: "0" }} />
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Order ID", "Symbol", "Side", "Type", "Qty", "Price", "Filled", "Status", "Date", "Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.cardBorder}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: "#3a7bd5", fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                      background: o.side === "Buy" ? "#e8f5e9" : "#fdecea", color: o.side === "Buy" ? "#28a745" : "#dc3545" }}>
                      {o.side}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{o.type}</td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.qty}</td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.price ? `$${o.price.toFixed(2)}` : "Market"}</td>
                  <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.filled}/{o.qty}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ ...STATUS_STYLE[o.status], fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{o.date}</td>
                  <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No orders found.</div>
          )}
        </div>

        <div className="block sm:hidden space-y-3">
          {filtered.map((o, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: colors.card }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                    background: o.side === "Buy" ? "#e8f5e9" : "#fdecea", color: o.side === "Buy" ? "#28a745" : "#dc3545" }}>
                    {o.side}
                  </span>
                </div>
                <span style={{ ...STATUS_STYLE[o.status], fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>
                  {o.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Type</span>
                  <p style={{ fontSize: "12px", color: colors.textSub }}>{o.type}</p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Price</span>
                  <p style={{ fontSize: "12px", color: colors.textSub }}>{o.price ? `$${o.price.toFixed(2)}` : "Market"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Qty</span>
                  <p style={{ fontSize: "12px", color: colors.textSub }}>{o.filled}/{o.qty}</p>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>Date</span>
                  <p style={{ fontSize: "12px", color: colors.textSub }}>{o.date} {o.time}</p>
                </div>
              </div>
              <p style={{ fontSize: "11px", color: "#3a7bd5", fontWeight: 600, marginTop: "6px" }}>{o.id}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No orders found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
