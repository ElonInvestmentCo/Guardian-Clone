import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const API_URL = "/api/stocks/quotes";
const POLL_MS = 60_000;

const BG = "#080d14";
const BORDER_BOTTOM = "rgba(58, 123, 213, 0.25)";
const SEPARATOR = "rgba(58, 123, 213, 0.15)";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function QuoteItem({ q }: { q: Quote }) {
  const up = q.change > 0;
  const down = q.change < 0;
  const color = up ? "#22c55e" : down ? "#ef4444" : "#64748b";
  const sign = up ? "+" : "";

  return (
    <span
      className="inline-flex items-center gap-[10px] flex-shrink-0"
      style={{ padding: "0 28px", borderRight: `1px solid ${SEPARATOR}` }}
    >
      {/* Symbol + company name */}
      <span className="flex flex-col leading-tight">
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.06em" }}>
          {q.symbol}
        </span>
        <span
          className="hidden sm:block"
          style={{ fontSize: "10px", color: "#5baad4", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {q.name}
        </span>
      </span>

      {/* Price */}
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
        ${fmt(q.price)}
      </span>

      {/* Change */}
      <span className="flex items-center gap-[3px]" style={{ fontSize: "12px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
        {up ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : down ? <TrendingDown className="w-3 h-3 flex-shrink-0" /> : <Minus className="w-3 h-3 flex-shrink-0" />}
        <span>{sign}{fmt(q.change)}</span>
        <span style={{ color: `${color}cc` }}>({sign}{fmt(q.changePercent)}%)</span>
      </span>
    </span>
  );
}

export function StockTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  async function load() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("bad response");
      const json = await res.json();
      if (json.quotes?.length) {
        setQuotes(json.quotes);
        setError(false);
      }
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!quotes.length || !trackRef.current) return;

    const track = trackRef.current;
    let speed = 0.45;
    let paused = false;

    const step = () => {
      if (!paused) {
        posRef.current -= speed;
        const half = track.scrollWidth / 2;
        if (Math.abs(posRef.current) >= half) {
          posRef.current = 0;
        }
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(step);
    };

    const pause = () => { paused = true; };
    const resume = () => { paused = false; };

    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, [quotes]);

  if (error && !quotes.length) return null;
  if (!quotes.length) {
    return (
      <div style={{ height: "36px", backgroundColor: BG, borderBottom: `1px solid ${BORDER_BOTTOM}` }} />
    );
  }

  const doubled = [...quotes, ...quotes];

  return (
    <div
      style={{
        height: "36px",
        backgroundColor: BG,
        borderBottom: `1px solid ${BORDER_BOTTOM}`,
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
      }}
    >
      {/* Left fade */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: "48px", zIndex: 2,
          background: `linear-gradient(to right, ${BG}, transparent)`,
          pointerEvents: "none",
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "48px", zIndex: 2,
          background: `linear-gradient(to left, ${BG}, transparent)`,
          pointerEvents: "none",
        }}
      />

      <div
        ref={trackRef}
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: "100%",
          willChange: "transform",
          whiteSpace: "nowrap",
        }}
      >
        {doubled.map((q, i) => (
          <QuoteItem key={`${q.symbol}-${i}`} q={q} />
        ))}
      </div>
    </div>
  );
}
