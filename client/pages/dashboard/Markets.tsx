import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import TradingViewChart, { type ChartSymbol } from "@/components/TradingViewChart";
import { getApiBase } from "@/lib/api";

const API = getApiBase();

/* ─── Types ──────────────────────────────────────────────────────── */

interface CoinData {
  name: string;
  symbol: string;
  price: number;
  percent_change_24h: number;
  market_cap: number;
  volume_24h: number;
}

/* ─── Symbol mapping: API coin symbol → TradingView symbol ────────── */

const COIN_TO_TV: Record<string, ChartSymbol> = {
  btc:      "BINANCE:BTCUSDT",
  bitcoin:  "BINANCE:BTCUSDT",
  eth:      "BINANCE:ETHUSDT",
  ethereum: "BINANCE:ETHUSDT",
  eur:      "FX:EURUSD",
  eurusd:   "FX:EURUSD",
  xau:      "OANDA:XAUUSD",
  gold:     "OANDA:XAUUSD",
  nas100:   "FOREXCOM:NSXUSD",
  ndx:      "FOREXCOM:NSXUSD",
};

function coinToTVSymbol(coinSymbol: string): ChartSymbol | null {
  const key = coinSymbol.toLowerCase().replace(/usdt?$/, "");
  return COIN_TO_TV[key] ?? COIN_TO_TV[coinSymbol.toLowerCase()] ?? null;
}

/* ─── URL helpers ─────────────────────────────────────────────────── */

const URL_PARAM = "symbol";

function readSymbolFromUrl(): ChartSymbol | null {
  try {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (!raw) return null;
    // Validate it's one of the known TV symbols
    const known: ChartSymbol[] = [
      "BINANCE:BTCUSDT", "BINANCE:ETHUSDT",
      "FX:EURUSD", "OANDA:XAUUSD", "FOREXCOM:NSXUSD",
    ];
    const decoded = decodeURIComponent(raw) as ChartSymbol;
    return known.includes(decoded) ? decoded : null;
  } catch { return null; }
}

function pushSymbolToUrl(tvSymbol: ChartSymbol) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, tvSymbol);
    history.replaceState(null, "", url.toString());
  } catch { /* ignore */ }
}

/* ─── Formatters ──────────────────────────────────────────────────── */

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: price < 1 ? 6 : 2,
    maximumFractionDigits: price < 1 ? 6 : 2,
  }).format(price);
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9)  return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6)  return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function Markets() {
  const { colors } = useTheme();
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialise from URL first, then fall back to BTC
  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>(
    () => readSymbolFromUrl() ?? "BINANCE:BTCUSDT"
  );
  // Track the currently-active coin symbol key (e.g. "btc")
  const [activeRow, setActiveRow] = useState<string>(() => {
    const fromUrl = readSymbolFromUrl();
    if (!fromUrl) return "btc";
    // Reverse-map TV symbol → coin key
    const entry = Object.entries(COIN_TO_TV).find(([, v]) => v === fromUrl);
    return entry ? entry[0] : "btc";
  });

  const chartCardRef = useRef<HTMLDivElement>(null);

  /* ── Data fetching ─────────────────────────────────────────────── */
  const fetchMarkets = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/markets`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch market data");
        return r.json();
      })
      .then((data: CoinData[]) => { setCoins(data); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to fetch market data."); setLoading(false); });
  }, []);

  useEffect(() => {
    fetchMarkets();
    const id = setInterval(fetchMarkets, 30000);
    return () => clearInterval(id);
  }, [fetchMarkets]);

  /* ── Row click ─────────────────────────────────────────────────── */
  const handleRowClick = useCallback((coin: CoinData) => {
    const tvSym = coinToTVSymbol(coin.symbol);
    if (!tvSym) return;

    const coinKey = coin.symbol.toLowerCase().replace(/usdt?$/, "");
    setActiveRow(coinKey);
    setChartSymbol(tvSym);
    pushSymbolToUrl(tvSym);

    // Smooth-scroll the chart into view on mobile
    chartCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── Chart toolbar symbol change (keep row highlight in sync) ──── */
  const handleChartSymbolChange = (sym: ChartSymbol) => {
    setChartSymbol(sym);
    pushSymbolToUrl(sym);
    const entry = Object.entries(COIN_TO_TV).find(([, v]) => v === sym);
    if (entry) setActiveRow(entry[0]);
  };

  /* ── Active coin display name for chart header ─────────────────── */
  const activeCoin = coins.find(c =>
    c.symbol.toLowerCase().replace(/usdt?$/, "") === activeRow ||
    c.symbol.toLowerCase() === activeRow
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>

        {/* ── Page header ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Markets</h1>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 0" }}>
              Click any coin row to view its chart · RSI · MACD · BB · Volume
            </p>
          </div>
          <button onClick={fetchMarkets} style={{
            padding: "8px 14px", borderRadius: "8px", border: `1px solid ${colors.inputBorder}`,
            background: colors.inputBg, color: colors.textSub, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px", fontSize: "13px",
          }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* ── Advanced chart ──────────────────────────────────────── */}
        <div
          ref={chartCardRef}
          className="rounded-xl mb-6"
          style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px 20px 20px", overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                  {activeCoin ? activeCoin.name : "Advanced Market"} Chart
                </p>
                {activeCoin && (
                  <span style={{
                    padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                    background: activeCoin.percent_change_24h >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                    color: activeCoin.percent_change_24h >= 0 ? "#10b981" : "#ef4444",
                    border: `1px solid ${activeCoin.percent_change_24h >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}>
                    {activeCoin.percent_change_24h >= 0 ? "+" : ""}{activeCoin.percent_change_24h.toFixed(2)}%
                  </span>
                )}
              </div>
              <p style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
                {activeCoin ? formatPrice(activeCoin.price) + " · " : ""}Select any coin below to switch the chart
              </p>
            </div>
          </div>
          <TradingViewChart
            symbol={chartSymbol}
            height={520}
            onSymbolChange={handleChartSymbolChange}
          />
        </div>

        {/* ── Error banner ────────────────────────────────────────── */}
        {error && (
          <div style={{ padding: "14px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "16px", color: "#DC2626", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* ── Coins table ─────────────────────────────────────────── */}
        <div style={{ position: "relative", minHeight: "200px" }}>
          <LoadingOverlay loading={loading} />
          <div style={{ background: colors.card, border: `1px solid ${colors.inputBorder}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.inputBorder}` }}>
                    {["Coin", "Price", "24h Change", "Market Cap", "Volume (24h)", ""].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textAlign: "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => {
                    const tvSym = coinToTVSymbol(coin.symbol);
                    const coinKey = coin.symbol.toLowerCase().replace(/usdt?$/, "");
                    const isActive = coinKey === activeRow || coin.symbol.toLowerCase() === activeRow;
                    const isClickable = !!tvSym;

                    return (
                      <tr
                        key={coin.symbol}
                        onClick={() => isClickable && handleRowClick(coin)}
                        style={{
                          borderBottom: index < coins.length - 1 ? `1px solid ${colors.inputBorder}` : "none",
                          cursor: isClickable ? "pointer" : "default",
                          transition: "background 0.1s",
                          background: isActive ? `${colors.accent}10` : "transparent",
                          borderLeft: isActive ? `3px solid ${colors.accent}` : "3px solid transparent",
                          position: "relative",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) (e.currentTarget as HTMLElement).style.background = colors.tableRowHoverBg ?? "rgba(255,255,255,0.04)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = isActive ? `${colors.accent}10` : "transparent";
                        }}
                      >
                        {/* Coin name */}
                        <td style={{ padding: "12px 14px 12px 11px", fontSize: "14px", color: colors.textPrimary }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: isActive ? 700 : 600, color: isActive ? colors.accent : colors.textPrimary }}>
                                {coin.name}
                              </span>
                              <span style={{ fontSize: "11px", color: colors.textMuted }}>{coin.symbol.toUpperCase()}</span>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary, fontWeight: isActive ? 600 : 400 }}>
                          {formatPrice(coin.price)}
                        </td>

                        {/* 24h change */}
                        <td style={{ padding: "12px 14px", fontSize: "14px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "3px",
                            color: coin.percent_change_24h >= 0 ? "#10b981" : "#ef4444",
                            fontWeight: 600,
                          }}>
                            {coin.percent_change_24h >= 0 ? "+" : ""}{coin.percent_change_24h.toFixed(2)}%
                          </span>
                        </td>

                        {/* Market cap */}
                        <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary }}>
                          {formatMarketCap(coin.market_cap)}
                        </td>

                        {/* Volume */}
                        <td style={{ padding: "12px 14px", fontSize: "14px", color: colors.textPrimary }}>
                          {formatVolume(coin.volume_24h)}
                        </td>

                        {/* Chart indicator */}
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {isClickable && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              fontSize: "11px", fontWeight: 600,
                              color: isActive ? colors.accent : colors.textMuted,
                              opacity: isActive ? 1 : 0.5,
                            }}>
                              <TrendingUp size={12} />
                              {isActive ? "Viewing" : "Chart"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
