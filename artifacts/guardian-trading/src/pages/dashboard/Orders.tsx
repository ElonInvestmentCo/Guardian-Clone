import { useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
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

const TABS: OrderStatus[] = ["Active", "Pending", "Filled", "Cancelled"];

export default function Orders() {
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<OrderStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newSymbol, setNewSymbol] = useState("AAPL");
  const [newSide, setNewSide] = useState<"Buy" | "Sell">("Buy");
  const [newType, setNewType] = useState<OrderType>("Market");
  const [newQty, setNewQty] = useState("100");
  const [newPrice, setNewPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orders, setOrders] = useState<Order[]>(ALL_ORDERS);

  const filtered = orders.filter((o) =>
    (activeTab === "All" || o.status === activeTab) &&
    (o.symbol.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = Object.fromEntries(TABS.map((t) => [t, orders.filter((o) => o.status === t).length]));

  const handleSubmitOrder = () => {
    if (!newQty || Number(newQty) <= 0) return;
    if ((newType === "Limit" || newType === "Stop" || newType === "Stop Limit") && !newPrice) return;
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-4)}`,
      symbol: newSymbol,
      side: newSide,
      type: newType,
      qty: Number(newQty),
      price: newPrice ? Number(newPrice) : null,
      filled: 0,
      status: newType === "Market" ? "Filled" : "Pending",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowNewOrder(false);
      setNewSymbol("AAPL");
      setNewSide("Buy");
      setNewType("Market");
      setNewQty("100");
      setNewPrice("");
    }, 1500);
  };

  const statusStyle = (status: OrderStatus): { bg: string; text: string } => {
    switch (status) {
      case "Active":    return { bg: "rgba(59,130,246,0.12)", text: colors.accent };
      case "Pending":   return { bg: colors.yellowBg, text: colors.yellow };
      case "Filled":    return { bg: colors.greenBg, text: colors.green };
      case "Cancelled": return { bg: "rgba(100,116,139,0.1)", text: "#64748b" };
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "13px",
    border: `1px solid ${colors.inputBorder}`, borderRadius: "10px",
    color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box",
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Orders</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Manage your trade orders</p>
          </div>
          <button onClick={() => setShowNewOrder(true)}
            className="flex items-center gap-2"
            style={{ padding: "9px 20px", fontSize: "13px", fontWeight: 600, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
            <Plus size={15} /> <span className="hidden sm:inline">New Order</span>
          </button>
        </div>

        {showNewOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="rounded-2xl w-full" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "28px", maxWidth: "380px", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg" style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                    <ShoppingCart size={18} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Place Order</h2>
                </div>
                <button onClick={() => setShowNewOrder(false)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "20px", lineHeight: 1 }}>&times;</button>
              </div>
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="flex items-center justify-center mx-auto rounded-full mb-4" style={{ width: "56px", height: "56px", background: colors.greenBg }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: colors.green }}>Order submitted!</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-5 p-1 rounded-lg" style={{ background: colors.filterBar }}>
                    {(["Buy", "Sell"] as const).map((s) => (
                      <button key={s} onClick={() => setNewSide(s)} style={{ flex: 1, padding: "8px", fontSize: "13px", fontWeight: 600, borderRadius: "8px", border: "none", cursor: "pointer",
                        background: newSide === s ? (s === "Buy" ? colors.green : colors.red) : "transparent",
                        color: newSide === s ? "#fff" : colors.filterInactiveText }}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {[
                    { label: "Symbol", el: <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} style={inputStyle} /> },
                    { label: "Order Type", el: <select value={newType} onChange={(e) => setNewType(e.target.value as OrderType)} style={inputStyle}>
                      {(["Market", "Limit", "Stop", "Stop Limit"] as const).map((t) => <option key={t}>{t}</option>)}</select> },
                    { label: "Quantity", el: <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} style={inputStyle} /> },
                    ...(newType !== "Market" ? [{ label: "Price ($)", el: <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" style={inputStyle} /> }] : []),
                  ].map(({ label, el }) => (
                    <div key={label} className="mb-4">
                      <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
                      {el}
                    </div>
                  ))}
                  <button onClick={handleSubmitOrder}
                    style={{ width: "100%", marginTop: "4px", padding: "12px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", border: "none", cursor: "pointer",
                      background: newSide === "Buy" ? colors.green : colors.red, color: "#fff" }}>
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
                style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  background: activeTab === "All" ? colors.filterActiveBg : "transparent",
                  color: activeTab === "All" ? colors.filterActiveText : colors.filterInactiveText }}>
                All ({ALL_ORDERS.length})
              </button>
              {TABS.map((t) => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: activeTab === t ? colors.filterActiveBg : "transparent",
                    color: activeTab === t ? colors.filterActiveText : colors.filterInactiveText }}>
                  {t} ({counts[t]})
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xs rounded-lg" style={{ padding: "8px 14px", background: colors.inputBg, border: `1px solid ${colors.inputBorder}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", color: colors.inputText, background: "transparent" }} />
          </div>
        </div>

        <div className="hidden sm:block rounded-xl overflow-x-auto" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ background: colors.tableHead }}>
                {["Order ID", "Symbol", "Side", "Type", "Qty", "Price", "Filled", "Status", "Date", "Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, padding: "12px 14px", borderBottom: `1px solid ${colors.divider}`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const ss = statusStyle(o.status);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.accent, fontWeight: 600 }}>{o.id}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                        background: o.side === "Buy" ? colors.greenBg : colors.redBg, color: o.side === "Buy" ? colors.green : colors.red }}>
                        {o.side}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textSub }}>{o.type}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.qty}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.price ? `$${o.price.toFixed(2)}` : "Market"}</td>
                    <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textSub }}>{o.filled}/{o.qty}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ background: ss.bg, color: ss.text, fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600 }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{o.date}</td>
                    <td style={{ padding: "11px 14px", fontSize: "12px", color: colors.textMuted }}>{o.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No orders found.</div>
          )}
        </div>

        <div className="block sm:hidden space-y-3">
          {filtered.map((o, i) => {
            const ss = statusStyle(o.status);
            return (
              <div key={i} className="rounded-xl p-4" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                      background: o.side === "Buy" ? colors.greenBg : colors.redBg, color: o.side === "Buy" ? colors.green : colors.red }}>
                      {o.side}
                    </span>
                  </div>
                  <span style={{ background: ss.bg, color: ss.text, fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: 600 }}>
                    {o.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Type", value: o.type },
                    { label: "Price", value: o.price ? `$${o.price.toFixed(2)}` : "Market" },
                    { label: "Qty", value: `${o.filled}/${o.qty}` },
                    { label: "Date", value: `${o.date} ${o.time}` },
                  ].map(item => (
                    <div key={item.label}>
                      <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase" }}>{item.label}</span>
                      <p style={{ fontSize: "12px", color: colors.textSub }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: colors.accent, fontWeight: 600, marginTop: "6px" }}>{o.id}</p>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.textMuted, fontSize: "14px" }}>No orders found.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
