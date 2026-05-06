import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import TradingViewChart, { type ChartSymbol } from "@/components/TradingViewChart";
import Sparkline from "@/components/Sparkline";
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
const KNOWN_TV: ChartSymbol[] = [
  "BINANCE:BTCUSDT", "BINANCE:ETHUSDT",
  "FX:EURUSD", "OANDA:XAUUSD", "FOREXCOM:NSXUSD",
];

function readSymbolFromUrl(): ChartSymbol | null {
  try {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (!raw) return null;
    const decoded = decodeURIComponent(raw) as ChartSymbol;
    return KNOWN_TV.includes(decoded) ? decoded : null;
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

  const [coins, setCoins]           = useState<CoinData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [sparklinesLoading, setSparklinesLoading] = useState(true);

  const [chartSymbol, setChartSymbol] = useState<ChartSymbol>(
    () => readSymbolFromUrl() ?? "BINANCE:BTCUSDT"
  );
  const [activeRow, setActiveRow] = useState<string>(() => {
    const fromUrl = readSymbolFromUrl();
    if (!fromUrl) return "btc";
    const entry = Object.entries(COIN_TO_TV).find(([, v]) => v === fromUrl);
    return entry ? entry[0] : "btc";
  });

  const chartCardRef = useRef<HTMLDivElement>(null);

  /* ── Fetch markets ─────────────────────────────────────────────── */
  const fetchMarkets = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/markets`)
      .then((r) => { if (!r.ok) throw new Error("Failed to fetch market data"); return r.json(); })
      .then((data: CoinData[]) => { setCoins(data); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to fetch market data."); setLoading(false); });
  }, []);

  /* ── Fetch sparklines (once; 5-min server cache) ───────────────── */
  const fetchSparklines = useCallback(() => {
    setSparklinesLoading(true);
    fetch(`${API}/api/markets/sparklines`)
      .then((r) => { if (!r.ok) throw new Error("Sparklines unavailable"); return r.json(); })
      .then((data: Record<string, number[]>) => { setSparklines(data); setSparklinesLoading(false); })
      .catch(() => setSparklinesLoading(false));
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchSparklines();
    const marketsInterval   = setInterval(fetchMarkets,    30_000);
    const sparklineInterval = setInterval(fetchSparklines, 5 * 60_000);
    return () => { clearInterval(marketsInterval); clearInterval(sparklineInterval); };
  }, [fetchMarkets, fetchSparklines]);

  /* ── Row click ─────────────────────────────────────────────────── */
  const handleRowClick = useCallback((coin: CoinData) => {
    const tvSym = coinToTVSymbol(coin.symbol);
    if (!tvSym) return;
    const coinKey = coin.symbol.toLowerCase().replace(/usdt?$/, "");
    setActiveRow(coinKey);
    setChartSymbol(tvSym);
    pushSymbolToUrl(tvSym);
    chartCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── Chart toolbar sync ────────────────────────────────────────── */
  const handleChartSymbolChange = (sym: ChartSymbol) => {
    setChartSymbol(sym);
    pushSymbolToUrl(sym);
    const entry = Object.entries(COIN_TO_TV).find(([, v]) => v === sym);
    if (entry) setActiveRow(entry[0]);
  };

  /* ── Active coin ───────────────────────────────────────────────── */
  const activeCoin = coins.find(c =>
    c.symbol.toLowerCase().replace(/usdt?$/, "") === activeRow ||
    c.symbol.toLowerCase() === activeRow
  );

  return (
    <DashboardLayout>
      <div style={{ padding: "24px" }}>

        {/* ── Page header ──────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Markets</h1>
            <p style={{ fontSize: "13px", color: colors.textMuted, margin: "4px 0 0" }}>
              Click any row to view its chart · 7-day sparklines · RSI · MACD · BB · Volume
            </p>
          </div>
          <button
            onClick={() => { fetchMarkets(); fetchSparklines(); }}
            style={{
              padding: "8px 14px", borderRadius: "8px", border: `1px solid ${colors.inputBorder}`,
              background: colors.inputBg, color: colors.textSub, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px", fontSize: "13px",
            }}
          >
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
          <TradingViewChart symbol={chartSymbol} height={520} onSymbolChange={handleChartSymbolChange} />
        </div>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <div style={{ padding: "14px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "16px", color: "#DC2626", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* ── Coins table ──────────────────────────────────────────── */}
        <div style={{ position: "relative", minHeight: "200px" }}>
          <LoadingOverlay loading={loading} />
          <div style={{ background: colors.card, border: `1px solid ${colors.inputBorder}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.inputBorder}` }}>
                    {[
                      { label: "Coin",       width: undefined },
                      { label: "Price",      width: "120px"   },
                      { label: "24h",        width: "90px"    },
                      { label: "7d Trend",   width: "100px"   },
                      { label: "Market Cap", width: "120px"   },
                      { label: "Volume",     width: "110px"   },
                      { label: "",           width: "80px"    },
                    ].map(({ label, width }) => (
                      <th
                        key={label}
                        style={{
                          padding: "11px 14px",
                          fontSize: "11px", fontWeight: 600,
                          color: colors.textMuted, textAlign: "left",
                          width, whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => {
                    const tvSym     = coinToTVSymbol(coin.symbol);
                    const coinKey   = coin.symbol.toLowerCase().replace(/usdt?$/, "");
                    const isActive  = coinKey === activeRow || coin.symbol.toLowerCase() === activeRow;
                    const isClickable = !!tvSym;
                    const positive  = coin.percent_change_24h >= 0;

                    // Sparkline: try coinKey, then full symbol, then symbol without "usdt"
                    const sparkPts  =
                      sparklines[coinKey] ??
                      sparklines[coin.symbol.toLowerCase()] ??
                      [];
                    const hasSparkline = sparkPts.length >= 2;

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
                        }}
                        onMouseEnter={e => {
                          if (!isActive)
                            (e.currentTarget as HTMLElement).style.background =
                              colors.tableRowHoverBg ?? "rgba(255,255,255,0.04)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background =
                            isActive ? `${colors.accent}10` : "transparent";
                        }}
                      >
                        {/* Coin name */}
                        <td style={{ padding: "11px 14px 11px 11px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{
                              fontSize: "14px", fontWeight: isActive ? 700 : 600,
                              color: isActive ? colors.accent : colors.textPrimary,
                            }}>
                              {coin.name}
                            </span>
                            <span style={{ fontSize: "11px", color: colors.textMuted }}>
                              {coin.symbol.toUpperCase()}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td style={{ padding: "11px 14px", fontSize: "14px", color: colors.textPrimary, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                          {formatPrice(coin.price)}
                        </td>

                        {/* 24h change */}
                        <td style={{ padding: "11px 14px", fontSize: "13px", whiteSpace: "nowrap" }}>
                          <span style={{ color: positive ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {positive ? "+" : ""}{coin.percent_change_24h.toFixed(2)}%
                          </span>
                        </td>

                        {/* 7-day sparkline */}
                        <td style={{ padding: "8px 14px" }}>
                          {sparklinesLoading && !hasSparkline ? (
                            <div style={{
                              width: 80, height: 34, borderRadius: "4px",
                              background: colors.filterBar ?? "rgba(255,255,255,0.04)",
                              animation: "pulse 1.5s ease-in-out infinite",
                            }} />
                          ) : hasSparkline ? (
                            <Sparkline points={sparkPts} positive={positive} width={80} height={34} />
                          ) : (
                            <span style={{ fontSize: "11px", color: colors.textMuted }}>—</span>
                          )}
                        </td>

                        {/* Market cap */}
                        <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textPrimary, whiteSpace: "nowrap" }}>
                          {formatMarketCap(coin.market_cap)}
                        </td>

                        {/* Volume */}
                        <td style={{ padding: "11px 14px", fontSize: "13px", color: colors.textPrimary, whiteSpace: "nowrap" }}>
                          {formatVolume(coin.volume_24h)}
                        </td>

                        {/* Chart indicator */}
                        <td style={{ padding: "11px 14px", textAlign: "right" }}>
                          {isClickable && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              fontSize: "11px", fontWeight: 600,
                              color: isActive ? colors.accent : colors.textMuted,
                              opacity: isActive ? 1 : 0.45,
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
