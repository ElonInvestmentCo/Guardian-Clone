import { memo, useState, useCallback, useRef } from "react";

/* ─── Formatter ───────────────────────────────────────────────────── */

function fmt(vol: number): string {
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(2)}T`;
  if (vol >= 1e9)  return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6)  return `$${(vol / 1e6).toFixed(2)}M`;
  return `$${vol.toLocaleString()}`;
}

function fmtExact(vol: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(vol);
}

/* ─── Types ──────────────────────────────────────────────────────── */

interface VolumeBarProps {
  volume: number;
  maxVolume: number;
}

/* ─── Tooltip ────────────────────────────────────────────────────── */

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
}

/* ─────────────────────────────────────────────────────────────────── */

const VolumeBar = memo(function VolumeBar({ volume, maxVolume }: VolumeBarProps) {
  const pct      = maxVolume > 0 ? Math.max(2, (volume / maxVolume) * 100) : 0;
  const pctLabel = maxVolume > 0 ? ((volume / maxVolume) * 100).toFixed(1) : "0.0";
  const formatted = fmt(volume);

  const [tip, setTip] = useState<TooltipState>({ visible: false, x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const onMouseLeave = useCallback(() => {
    setTip(t => ({ ...t, visible: false }));
  }, []);

  return (
    <div
      ref={cellRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ position: "relative", minWidth: "110px", maxWidth: "180px" }}
    >
      {/* ── Track ── */}
      <div style={{
        width: "100%",
        height: "6px",
        borderRadius: "99px",
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        marginBottom: "5px",
      }}>
        {/* ── Fill ── */}
        <div style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: "99px",
          background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
          boxShadow: "0 0 6px rgba(139,92,246,0.35)",
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* ── Label ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "inherit", fontVariantNumeric: "tabular-nums" }}>
          {formatted}
        </span>
        <span style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "rgba(139,92,246,0.8)",
          flexShrink: 0,
        }}>
          {pctLabel}%
        </span>
      </div>

      {/* ── Tooltip ── */}
      {tip.visible && (
        <div
          style={{
            position: "fixed",
            pointerEvents: "none",
            zIndex: 9999,
            left: `${tip.x + (cellRef.current?.getBoundingClientRect().left ?? 0) + 12}px`,
            top:  `${tip.y + (cellRef.current?.getBoundingClientRect().top  ?? 0) - 56}px`,
            background: "rgba(10,10,20,0.92)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "8px",
            padding: "8px 12px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#e2e8f0", marginBottom: "3px" }}>
            24h Volume
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
            {fmtExact(volume)}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(139,92,246,0.9)" }}>
            {pctLabel}% of highest-volume asset
          </div>
        </div>
      )}
    </div>
  );
});

export default VolumeBar;
