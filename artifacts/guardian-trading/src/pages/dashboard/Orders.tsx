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

const TABS: OrderStatus[] = ["Active", "Pending", "Filled", "Cancelled"];

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
  const [orders, setOrders] = useState<Order[]>([]);

  const filtered = orders.filter((o) =>
    (activeTab === "All" || o.status === activeTab) &&
    (o.symbol.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = Object.fromEntries(TABS.map((t) => [t, orders.filter((o) => o.status === t).length]));

  const handleSubmitOrder = () => {
    if (!newQty || Number(newQty) <= 0) return;
    if ((newType === "Limit" || newType === "Stop" || newType === "Stop Limit") && !newPrice) return;
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      symbol: newSymbol.toUpperCase(),
      side: newSide,
      type: newType,
      qty: Number(newQty),
      price: newType === "Market" ? null : Number(newPrice),
      filled: newType === "Market" ? Number(newQty) : 0,
      status: newType === "Market" ? "Filled" : "Active",
      date: new Date().toLocaleDateString("en-GB").split("/").join("/"),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setShowNewOrder(false); }, 1500);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "13px",
    border: `1px solid ${colors.inputBorder}`, borderRadius: "10px",
    color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box",
  };

  const sideColors: Record<string, { bg: string; text: string }> = {
    Buy:  { bg: colors.greenBg, text: colors.green },
    Sell: { bg: colors.redBg,   text: colors.red },
  };
  const statusColors: Record<string, { bg: string; text: string }> = {
    Active:    { bg: colors.greenBg,  text: colors.green  },
    Pending:   { bg: colors.yellowBg, text: colors.yellow },
    Filled:    { bg: colors.purpleBg, text: colors.purple },
    Cancelled: { bg: colors.redBg,    text: colors.red    },
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Orders</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Manage your trade orders</p>
          </div>
          <button
            onClick={() => setShowNewOrder(true)}
            className="flex items-center gap-2"
            style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 600, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}
          >
            <Plus size={15} />
            New Order
          </button>
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px" }}>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 14px", fontSize: "13px", border: `1px solid ${colors.inputBorder}`, borderRadius: "10px", color: colors.inputText, background: colors.inputBg, outline: "none" }}
            />
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
              {(["All", ...TABS] as (OrderStatus | "All")[]).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding: "6px 14px", fontSize: "12px", fontWeight: 600, borderRadius: "7px",
                  border: "none", cursor: "pointer", flexShrink: 0,
                  background: activeTab === t ? colors.accent : colors.filterBar,
                  color: activeTab === t ? "#fff" : colors.filterInactiveText,
                }}>
                  {t}{t !== "All" && counts[t] > 0 ? ` (${counts[t]})` : ""}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders yet"
              message="Place your first trade order using the New Order button above."
            />
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                  <thead>
                    <tr>
                      {["Order ID", "Symbol", "Side", "Type", "Qty", "Price", "Filled", "Status", "Date"].map((h) => (
                        <th key={h} style={{ textAlign: "left", fontSize: "11px", color: colors.tableHeaderText, fontWeight: 600, paddingBottom: "12px", borderBottom: `1px solid ${colors.divider}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => {
                      const sc = statusColors[o.status] ?? statusColors.Active;
                      const sdc = sideColors[o.side] ?? sideColors.Buy;
                      return (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${colors.tableRowBorder}` }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: "12px", color: colors.textMuted, fontFamily: "monospace" }}>{o.id}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span className="inline-block px-2 py-0.5 rounded-md" style={{ background: sdc.bg, color: sdc.text, fontSize: "11px", fontWeight: 700 }}>{o.side}</span>
                          </td>
                          <td style={{ padding: "12px 8px", fontSize: "12px", color: colors.textSub }}>{o.type}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: colors.textPrimary }}>{o.qty}</td>
                          <td style={{ padding: "12px 8px", fontSize: "13px", color: colors.textPrimary }}>{o.price ? `$${o.price.toFixed(2)}` : "Market"}</td>
                          <td style={{ padding: "12px 8px", fontSize: "12px", color: colors.textMuted }}>{o.filled}/{o.qty}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span className="inline-block px-2.5 py-1 rounded-md" style={{ background: sc.bg, color: sc.text, fontSize: "11px", fontWeight: 600 }}>{o.status}</span>
                          </td>
                          <td style={{ padding: "12px 8px 12px 0", fontSize: "11px", color: colors.textMuted }}>{o.date} {o.time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="block sm:hidden space-y-3">
                {filtered.map((o) => {
                  const sc = statusColors[o.status] ?? statusColors.Active;
                  const sdc = sideColors[o.side] ?? sideColors.Buy;
                  return (
                    <div key={o.id} className="rounded-xl p-3" style={{ border: `1px solid ${colors.divider}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary }}>{o.symbol}</span>
                          <span className="px-2 py-0.5 rounded-md" style={{ background: sdc.bg, color: sdc.text, fontSize: "11px", fontWeight: 700 }}>{o.side}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md" style={{ background: sc.bg, color: sc.text, fontSize: "11px", fontWeight: 600 }}>{o.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: "12px", color: colors.textMuted }}>{o.type} · {o.qty} shares</span>
                        <span style={{ fontSize: "11px", color: colors.textMuted }}>{o.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {showNewOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
            <div className="rounded-2xl w-full mx-4" style={{ maxWidth: "440px", background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "28px" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center rounded-xl" style={{ width: "44px", height: "44px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  <ShoppingCart size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>New Order</p>
                  <p style={{ fontSize: "11px", color: colors.textMuted }}>Place a trade order</p>
                </div>
                <button onClick={() => setShowNewOrder(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, fontSize: "18px", lineHeight: 1 }}>×</button>
              </div>

              <div className="flex gap-2 mb-5">
                {(["Buy", "Sell"] as const).map((s) => (
                  <button key={s} onClick={() => setNewSide(s)} style={{
                    flex: 1, padding: "10px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", border: "none", cursor: "pointer",
                    background: newSide === s ? (s === "Buy" ? colors.green : colors.red) : colors.filterBar,
                    color: newSide === s ? "#fff" : colors.textMuted,
                  }}>{s}</button>
                ))}
              </div>

              <div className="mb-4">
                <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Symbol</label>
                <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} style={inputStyle} placeholder="e.g. AAPL" maxLength={10} />
              </div>

              <div className="mb-4">
                <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Order Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as OrderType)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                  {(["Market", "Limit", "Stop", "Stop Limit"] as OrderType[]).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Quantity</label>
                  <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} style={inputStyle} min="1" />
                </div>
                {newType !== "Market" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Price ($)</label>
                    <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={inputStyle} placeholder="0.00" step="0.01" />
                  </div>
                )}
              </div>

              <button onClick={handleSubmitOrder} style={{
                width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700, borderRadius: "10px", border: "none", cursor: "pointer",
                background: submitted ? colors.green : (newSide === "Buy" ? colors.green : colors.red), color: "#fff",
              }}>
                {submitted ? "✓ Order Placed" : `${newSide} ${newSymbol || "—"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
