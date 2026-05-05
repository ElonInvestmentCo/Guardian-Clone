import { useState } from "react";
import { ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/lib/guardian-toast";

interface TradeResult {
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  status: string;
  filledQty: number;
  fillPrice: number;
  totalValue: number;
  commission: number;
  netCost: number;
  slippage: number;
  riskLevel: string;
  message: string;
  timestamp: string;
}

const API = getApiBase();

const POPULAR_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "ADA", "AVAX", "DOT", "LINK"];

const RISK_COLORS: Record<string, string> = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#ef4444" };

export default function TradeOrderForm() {
  const { colors } = useTheme();
  const [symbol, setSymbol] = useState("BTC");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT" | "STOP">("MARKET");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<TradeResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !currentPrice) {
      toast.error("Missing fields", "Quantity and current price are required");
      return;
    }
    setLoading(true);
    setLastResult(null);

    try {
      const body: Record<string, unknown> = {
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        currentPrice: parseFloat(currentPrice),
      };
      if (orderType === "LIMIT" && limitPrice) body.limitPrice = parseFloat(limitPrice);
      if ((orderType === "STOP") && stopPrice) body.stopPrice = parseFloat(stopPrice);

      const r = await fetch(`${API}/api/trading/execute`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await r.json();

      if (!r.ok) {
        toast.error("Order rejected", data.error || "Trade execution failed");
        return;
      }

      setLastResult(data as TradeResult);
      toast.success("Order filled", `${side} ${quantity} ${symbol} at $${(data as TradeResult).fillPrice.toFixed(4)}`);
      setQuantity("");
      setCurrentPrice("");
    } catch {
      toast.error("Network error", "Could not connect to trading system");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: `1px solid ${colors.inputBorder}`, background: colors.inputBg,
    color: colors.inputText, fontSize: "13px", outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = { fontSize: "11px", color: colors.textMuted, marginBottom: "5px", display: "block", fontWeight: 500 };

  return (
    <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
      <div className="flex items-center gap-2" style={{ padding: "16px 20px 12px" }}>
        <ShoppingCart size={15} color={colors.accent} />
        <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>Place Order</p>
        <span style={{ fontSize: "10px", color: colors.textMuted, background: colors.filterBar, padding: "2px 8px", borderRadius: "20px" }}>Simulation</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 20px 20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Symbol</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {POPULAR_SYMBOLS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                style={{
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${symbol === s ? colors.accent : colors.cardBorder}`,
                  background: symbol === s ? `${colors.accent}18` : "transparent",
                  color: symbol === s ? colors.accent : colors.textMuted,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <input style={inputStyle} value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="BTC, ETH, SOL..." />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Side</label>
            <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: `1px solid ${colors.cardBorder}` }}>
              {(["BUY", "SELL"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  style={{
                    flex: 1, padding: "9px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "none",
                    background: side === s ? (s === "BUY" ? colors.green : colors.red) : colors.inputBg,
                    color: side === s ? "#fff" : colors.textMuted,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Order Type</label>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value as typeof orderType)}
              style={{ ...inputStyle, appearance: "none" }}
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
              <option value="STOP">Stop</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Quantity</label>
            <input style={inputStyle} type="number" step="any" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.001" required />
          </div>
          <div>
            <label style={labelStyle}>Current Market Price ($)</label>
            <input style={inputStyle} type="number" step="any" min="0" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="e.g. 68500" required />
          </div>
        </div>

        {orderType === "LIMIT" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Limit Price ($)</label>
            <input style={inputStyle} type="number" step="any" min="0" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} placeholder="Limit execution price" />
          </div>
        )}

        {orderType === "STOP" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Stop Price ($)</label>
            <input style={inputStyle} type="number" step="any" min="0" value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder="Stop trigger price" />
          </div>
        )}

        <div style={{ background: colors.yellowBg, border: `1px solid rgba(245,158,11,0.25)`, borderRadius: "8px", padding: "10px 12px", marginBottom: "14px" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} color={colors.yellow} />
            <p style={{ fontSize: "11px", color: colors.yellow, fontWeight: 600 }}>Simulated Trading Environment</p>
          </div>
          <p style={{ fontSize: "10px", color: colors.textMuted, marginTop: "3px" }}>
            All orders are simulated. No real capital is at risk. Use this to practice trade execution and test strategy parameters.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "11px", borderRadius: "10px", border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? colors.filterBar : (side === "BUY" ? colors.green : colors.red),
            color: loading ? colors.textMuted : "#fff",
            fontSize: "13px", fontWeight: 700, transition: "all 0.15s ease",
          }}
        >
          {loading ? "Processing..." : `${side} ${symbol || "Asset"}`}
        </button>

        {lastResult && (
          <div style={{ marginTop: "14px", background: colors.greenBg, border: `1px solid rgba(16,185,129,0.25)`, borderRadius: "10px", padding: "14px" }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={14} color={colors.green} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: colors.green }}>Order Filled — {lastResult.orderId}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Fill Price", value: `$${lastResult.fillPrice.toFixed(4)}` },
                { label: "Quantity", value: String(lastResult.filledQty) },
                { label: "Total Value", value: `$${lastResult.totalValue.toFixed(2)}` },
                { label: "Commission", value: `$${lastResult.commission.toFixed(2)}` },
                { label: "Net Cost", value: `$${lastResult.netCost.toFixed(2)}` },
                { label: "Risk Level", value: lastResult.riskLevel, color: RISK_COLORS[lastResult.riskLevel] ?? colors.textPrimary },
              ].map(item => (
                <div key={item.label}>
                  <p style={{ fontSize: "9px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: (item as { color?: string }).color ?? colors.textPrimary }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
