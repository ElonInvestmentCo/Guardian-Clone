import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

/* ─── Types ──────────────────────────────────────────────────────── */

export type ChartSymbol = "BINANCE:BTCUSDT" | "BINANCE:ETHUSDT" | "FX:EURUSD" | "OANDA:XAUUSD" | "FOREXCOM:NSXUSD";
export type ChartInterval = "1" | "5" | "15" | "60" | "240" | "D" | "W";

export interface ChartPrefs {
  symbol: ChartSymbol;
  interval: ChartInterval;
}

const PREFS_KEY = "guardian_chart_prefs";

const SYMBOLS: { value: ChartSymbol; label: string; sub: string }[] = [
  { value: "BINANCE:BTCUSDT", label: "BTC/USDT",  sub: "Bitcoin"     },
  { value: "BINANCE:ETHUSDT", label: "ETH/USDT",  sub: "Ethereum"    },
  { value: "FX:EURUSD",       label: "EUR/USD",    sub: "Forex"       },
  { value: "OANDA:XAUUSD",    label: "XAU/USD",    sub: "Gold"        },
  { value: "FOREXCOM:NSXUSD", label: "NAS100",     sub: "NASDAQ 100"  },
];

const INTERVALS: { value: ChartInterval; label: string }[] = [
  { value: "1",   label: "1m"  },
  { value: "5",   label: "5m"  },
  { value: "15",  label: "15m" },
  { value: "60",  label: "1H"  },
  { value: "240", label: "4H"  },
  { value: "D",   label: "1D"  },
  { value: "W",   label: "1W"  },
];

const STUDIES = [
  "RSI@tv-basicstudies",
  "MACD@tv-basicstudies",
  "BB@tv-basicstudies",
  "Volume@tv-basicstudies",
];

/* ─── Persistence ────────────────────────────────────────────────── */

function loadPrefs(): ChartPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPrefs();
}

function savePrefs(prefs: ChartPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

function defaultPrefs(): ChartPrefs {
  return { symbol: "BINANCE:BTCUSDT", interval: "15" };
}

/* ─── Props ──────────────────────────────────────────────────────── */

interface Props {
  /** Override the symbol (controlled). If omitted, uses persisted pref. */
  symbol?: ChartSymbol;
  /** Override the interval (controlled). If omitted, uses persisted pref. */
  interval?: ChartInterval;
  /** Height of the chart area in px. Default 520. */
  height?: number;
  /** Hide the symbol/interval toolbar (embed-only mode). Default false. */
  compact?: boolean;
  /** Called when user picks a new symbol */
  onSymbolChange?: (s: ChartSymbol) => void;
  /** Called when user picks a new interval */
  onIntervalChange?: (i: ChartInterval) => void;
}

/* ─── Component ──────────────────────────────────────────────────── */

export default function TradingViewChart({
  symbol: symbolProp,
  interval: intervalProp,
  height = 520,
  compact = false,
  onSymbolChange,
  onIntervalChange,
}: Props) {
  const { colors, theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const [prefs, setPrefs] = useState<ChartPrefs>(loadPrefs);

  const activeSymbol   = symbolProp   ?? prefs.symbol;
  const activeInterval = intervalProp ?? prefs.interval;

  /* ── Build & inject the widget ──────────────────────────────────── */
  const buildWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.cssText = "height:100%;width:100%;";

    const config = {
      autosize: true,
      symbol: activeSymbol,
      interval: activeInterval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#000000",
      gridColor: "rgba(255,255,255,0.04)",
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      allow_symbol_change: false,
      save_image: true,
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      studies: STUDIES,
      show_popup_button: false,
      popup_width: "1000",
      popup_height: "650",
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify(config);

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [activeSymbol, activeInterval]);

  useEffect(() => {
    mountedRef.current = true;
    buildWidget();
    return () => {
      mountedRef.current = false;
      const container = containerRef.current;
      if (container) while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [buildWidget]);

  /* ── Handlers ───────────────────────────────────────────────────── */
  const handleSymbol = (s: ChartSymbol) => {
    const next = { ...prefs, symbol: s };
    setPrefs(next);
    savePrefs(next);
    onSymbolChange?.(s);
  };

  const handleInterval = (i: ChartInterval) => {
    const next = { ...prefs, interval: i };
    setPrefs(next);
    savePrefs(next);
    onIntervalChange?.(i);
  };

  /* ── Toolbar styles ─────────────────────────────────────────────── */
  const pillBase: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${colors.cardBorder}`,
    background: "transparent",
    color: colors.textMuted,
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: `${colors.accent}18`,
    color: colors.accent,
    border: `1px solid ${colors.accent}40`,
  };

  const activeSym  = SYMBOLS.find(s => s.value === activeSymbol)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      {!compact && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          padding: "12px 0 14px",
        }}>
          {/* Symbol picker */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: "2px" }}>
              Market
            </span>
            {SYMBOLS.map(s => (
              <button
                key={s.value}
                onClick={() => handleSymbol(s.value)}
                style={activeSymbol === s.value ? pillActive : pillBase}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Interval picker */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginRight: "2px" }}>
              TF
            </span>
            {INTERVALS.map(i => (
              <button
                key={i.value}
                onClick={() => handleInterval(i.value)}
                style={activeInterval === i.value ? pillActive : pillBase}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Indicators badge row ─────────────────────────────────────── */}
      {!compact && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {["RSI", "MACD", "Bollinger Bands", "Volume"].map(ind => (
            <span key={ind} style={{
              padding: "2px 8px",
              borderRadius: "20px",
              fontSize: "10px",
              fontWeight: 600,
              background: "rgba(139,92,246,0.12)",
              color: "#8b5cf6",
              border: "1px solid rgba(139,92,246,0.2)",
            }}>
              {ind}
            </span>
          ))}
        </div>
      )}

      {/* ── Chart container ──────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          height: `${height}px`,
          minHeight: `${height}px`,
          borderRadius: "10px",
          overflow: "hidden",
          background: "#000",
        }}
      >
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: "100%", width: "100%" }}
        />
      </div>

      {/* ── Caption ─────────────────────────────────────────────────── */}
      {!compact && (
        <p style={{ fontSize: "10px", color: colors.textMuted, marginTop: "8px", textAlign: "right" }}>
          Powered by{" "}
          <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: "none" }}>
            TradingView
          </a>
          {" · "}
          {activeSym.label} · {INTERVALS.find(i => i.value === activeInterval)?.label} · RSI · MACD · BB · Vol
        </p>
      )}
    </div>
  );
}
