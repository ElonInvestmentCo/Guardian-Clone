import { useState, useEffect, useCallback } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RefreshCw } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

import { getApiBase } from "@/lib/api";
const API = getApiBase();

interface CoinData {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  market_cap: number;
  volume_24h: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 6 : 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  }).format(price);
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  return `$${volume.toLocaleString()}`;
}

export default function Markets() {
  const { colors } = useTheme();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMarkets = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/markets`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch market data");
        return r.json();
      })
      .then((data: CoinData[]) => {
        setCoins(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch market data. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Crypto Markets</h1>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 0" }}>Live cryptocurrency prices</p>
          </div>
          <button onClick={fetchMarkets} style={{
            padding: "8px", borderRadius: "8px", border: `1px solid ${colors.inputBorder}`,
            background: colors.inputBg, color: colors.textSub, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px"
          }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ padding: "16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "16px", color: "#DC2626", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div style={{ position: "relative", minHeight: "200px" }}>
          <LoadingOverlay loading={loading} />
          <div style={{
            background: colors.card ?? "#fff", border: `1px solid ${colors.inputBorder}`,
            borderRadius: "12px", overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.inputBorder}` }}>
                    {["Coin", "Price", "24h Change", "Market Cap", "Volume (24h)"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => (
                    <tr key={coin.symbol} style={{ borderBottom: index < coins.length - 1 ? `1px solid ${colors.inputBorder}` : "none" }}>
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600 }}>{coin.name}</span>
                          <span style={{ fontSize: "12px", color: colors.textMuted }}>{coin.symbol.toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary, textAlign: "left" }}>
                        {formatPrice(coin.price)}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", textAlign: "left" }}>
                        <span style={{ color: coin.percent_change_24h >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                          {coin.percent_change_24h >= 0 ? "+" : ""}{coin.percent_change_24h.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary, textAlign: "left" }}>
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary, textAlign: "left" }}>
                        {formatVolume(coin.volume_24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
