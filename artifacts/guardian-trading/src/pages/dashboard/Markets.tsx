import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Line, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Search, RefreshCw } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d: { price: number[] };
}

interface OhlcPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TIMEFRAMES = [
  { label: "1D", days: "1" },
  { label: "7D", days: "7" },
  { label: "30D", days: "30" },
  { label: "90D", days: "90" },
  { label: "1Y", days: "365" },
];

function formatPrice(n: number): string {
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const sampled = data.filter((_, i) => i % 4 === 0).map((p, i) => ({ i, p }));
  return (
    <ResponsiveContainer width={100} height={32}>
      <AreaChart data={sampled}>
        <defs>
          <linearGradient id={positive ? "sparkGreen" : "sparkRed"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
            <stop offset="100%" stopColor={positive ? "#10b981" : "#ef4444"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="p" stroke={positive ? "#10b981" : "#ef4444"} strokeWidth={1.5}
          fill={`url(#${positive ? "sparkGreen" : "sparkRed"})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Markets() {
  const { colors } = useTheme();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [chartData, setChartData] = useState<OhlcPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("1");

  const fetchPrices = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/market/prices`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data: CoinData[]) => {
        setCoins(data);
        setLoading(false);
        if (!selectedCoin && data.length > 0) setSelectedCoin(data[0]!);
      })
      .catch(() => {
        setError("Failed to fetch market data. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    if (!selectedCoin) return;
    setChartLoading(true);
    fetch(`${API}/api/market/chart/${selectedCoin.id}?days=${timeframe}`)
      .then((r) => r.json())
      .then((data: number[][]) => {
        const ohlc = data.map((d) => ({
          time: new Date(d[0]!).toLocaleString("en-US", {
            month: "short", day: "numeric",
            ...(timeframe === "1" ? { hour: "numeric", minute: "2-digit" } : {}),
          }),
          open: d[1]!,
          high: d[2]!,
          low: d[3]!,
          close: d[4]!,
        }));
        setChartData(ohlc);
        setChartLoading(false);
      })
      .catch(() => setChartLoading(false));
  }, [selectedCoin, timeframe]);

  const filtered = coins.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Crypto Markets</h1>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 0" }}>Live cryptocurrency prices and charts</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px",
              background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: "8px",
            }}>
              <Search size={14} color={colors.textMuted} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search coins..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "12.5px", color: colors.inputText, width: "140px" }} />
            </div>
            <button onClick={fetchPrices} style={{
              padding: "8px", borderRadius: "8px", border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.textSub, cursor: "pointer",
            }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {selectedCoin && (
          <div style={{
            background: colors.card ?? "#fff", border: `1px solid ${colors.inputBorder}`,
            borderRadius: "12px", padding: "20px", marginBottom: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={selectedCoin.image} alt={selectedCoin.name} style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
                <div>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary }}>{selectedCoin.name}</span>
                  <span style={{ fontSize: "13px", color: colors.textMuted, marginLeft: "8px", textTransform: "uppercase" }}>{selectedCoin.symbol}</span>
                </div>
                <span style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, marginLeft: "16px" }}>
                  ${formatPrice(selectedCoin.current_price)}
                </span>
                <span style={{
                  fontSize: "13px", fontWeight: 600, marginLeft: "8px",
                  color: selectedCoin.price_change_percentage_24h >= 0 ? "#10b981" : "#ef4444",
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  {selectedCoin.price_change_percentage_24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {selectedCoin.price_change_percentage_24h?.toFixed(2)}%
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {TIMEFRAMES.map((tf) => (
                  <button key={tf.days} onClick={() => setTimeframe(tf.days)} style={{
                    padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    background: timeframe === tf.days ? colors.accent : colors.inputBg,
                    color: timeframe === tf.days ? "#fff" : colors.textSub,
                    border: timeframe === tf.days ? "none" : `1px solid ${colors.inputBorder}`,
                  }}>
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {chartLoading ? (
              <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid #E5E7EB", borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.inputBorder} opacity={0.5} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: colors.textMuted }} interval="preserveStartEnd" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: colors.textMuted }}
                    tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`} />
                  <Tooltip
                    contentStyle={{
                      background: colors.card ?? "#fff", border: `1px solid ${colors.inputBorder}`,
                      borderRadius: "8px", fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [`$${formatPrice(value)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Bar dataKey="high" fill={colors.accent} opacity={0.1} />
                  <Line type="monotone" dataKey="close" stroke={colors.accent} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="open" stroke={colors.textMuted} strokeWidth={1} dot={false} strokeDasharray="4 4" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: "16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "16px", color: "#DC2626", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{
            background: colors.card ?? "#fff", border: `1px solid ${colors.inputBorder}`,
            borderRadius: "12px", overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.inputBorder}` }}>
                    {["#", "Coin", "Price", "1h %", "24h %", "7d %", "Market Cap", "Volume (24h)", "7D Chart"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textAlign: h === "Coin" ? "left" : "right", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((coin, i) => {
                    const isSelected = selectedCoin?.id === coin.id;
                    return (
                      <tr
                        key={coin.id}
                        onClick={() => setSelectedCoin(coin)}
                        style={{
                          borderBottom: `1px solid ${colors.inputBorder}`,
                          background: isSelected ? (colors.accent + "10") : "transparent",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = colors.inputBg; }}
                        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: colors.textMuted, textAlign: "right" }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img src={coin.image} alt={coin.name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                            <div>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{coin.name}</span>
                              <span style={{ fontSize: "11px", color: colors.textMuted, marginLeft: "6px", textTransform: "uppercase" }}>{coin.symbol}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: colors.textPrimary, textAlign: "right" }}>
                          ${formatPrice(coin.current_price)}
                        </td>
                        {[coin.price_change_percentage_1h_in_currency, coin.price_change_percentage_24h, coin.price_change_percentage_7d_in_currency].map((pct, j) => (
                          <td key={j} style={{
                            padding: "12px 14px", fontSize: "12px", fontWeight: 600, textAlign: "right",
                            color: (pct ?? 0) >= 0 ? "#10b981" : "#ef4444",
                          }}>
                            {pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
                          </td>
                        ))}
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: colors.textPrimary, textAlign: "right" }}>
                          {formatMarketCap(coin.market_cap)}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: colors.textPrimary, textAlign: "right" }}>
                          {formatMarketCap(coin.total_volume)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {coin.sparkline_in_7d?.price && (
                            <Sparkline data={coin.sparkline_in_7d.price} positive={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
