import { useMemo, useCallback, useState, useRef, memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, type TooltipProps,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  coinName?: string;
  coinSymbol?: string;
  currentPrice?: number;
  priceChange?: number;
  coinImage?: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  spinnerImg?: string;
}

const TIMEFRAMES = [
  { label: "1D", days: "1" },
  { label: "1W", days: "7" },
  { label: "1M", days: "30" },
  { label: "3M", days: "90" },
  { label: "1Y", days: "365" },
];

function formatCurrency(n: number): string {
  if (n >= 1) return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function formatAxisPrice(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  if (v >= 1) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(4)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

function ChartTooltipContent({ active, payload, label }: TooltipProps<number, string>) {
  const { colors } = useTheme();
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as ChartDataPoint | undefined;
  if (!point) return null;

  const isPositive = point.close >= point.open;

  return (
    <div style={{
      background: colors.sidebar,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: "8px",
      padding: "12px 16px",
      minWidth: "180px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "8px", fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "18px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.02em" }}>
          {formatCurrency(point.close)}
        </span>
        <span style={{
          fontSize: "12px", fontWeight: 600,
          color: isPositive ? "#10b981" : "#ef4444",
        }}>
          {isPositive ? "+" : ""}{((point.close - point.open) / point.open * 100).toFixed(2)}%
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: "11px" }}>
        <span style={{ color: colors.textMuted }}>Open</span>
        <span style={{ color: colors.textSub, textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.open)}</span>
        <span style={{ color: colors.textMuted }}>High</span>
        <span style={{ color: "#10b981", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.high)}</span>
        <span style={{ color: colors.textMuted }}>Low</span>
        <span style={{ color: "#ef4444", textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(point.low)}</span>
        {point.volume != null && (
          <>
            <span style={{ color: colors.textMuted }}>Volume</span>
            <span style={{ color: colors.textSub, textAlign: "right", fontWeight: 500 }}>{formatVolume(point.volume)}</span>
          </>
        )}
      </div>
    </div>
  );
}

const MAX_CHART_POINTS = 500;

function decimateData(data: ChartDataPoint[]): ChartDataPoint[] {
  if (data.length <= MAX_CHART_POINTS) return data;
  const step = data.length / MAX_CHART_POINTS;
  const result: ChartDataPoint[] = [data[0]!];
  for (let i = 1; i < MAX_CHART_POINTS - 1; i++) {
    const idx = Math.round(i * step);
    const segment = data.slice(Math.max(0, idx - 1), idx + 2);
    let best = segment[0]!;
    for (const pt of segment) {
      if (pt.high > best.high || pt.low < best.low) best = pt;
    }
    result.push(best);
  }
  result.push(data[data.length - 1]!);
  return result;
}

function TradingChartInner({
  data, loading, coinName, coinSymbol, currentPrice,
  priceChange, coinImage, timeframe, onTimeframeChange, spinnerImg,
}: TradingChartProps) {
  const { colors } = useTheme();
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const lastHoverRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const chartData = useMemo(() => decimateData(data), [data]);

  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true;
    return chartData[chartData.length - 1]!.close >= chartData[0]!.open;
  }, [chartData]);

  const accentColor = isPositive ? "#10b981" : "#ef4444";
  const gradientId = isPositive ? "tradingGradGreen" : "tradingGradRed";

  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0 };
    let min = Infinity, max = -Infinity;
    for (const d of chartData) {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    }
    const pad = (max - min) * 0.05;
    return { minPrice: min - pad, maxPrice: max + pad };
  }, [chartData]);

  const displayPrice = hoveredPrice ?? currentPrice ?? (chartData.length > 0 ? chartData[chartData.length - 1]!.close : 0);

  const handleMouseMove = useCallback((e: { activePayload?: Array<{ payload: ChartDataPoint }> }) => {
    const price = e?.activePayload?.[0]?.payload?.close;
    if (price == null || price === lastHoverRef.current) return;
    lastHoverRef.current = price;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setHoveredPrice(price));
  }, []);

  const handleMouseLeave = useCallback(() => {
    lastHoverRef.current = null;
    cancelAnimationFrame(rafRef.current);
    setHoveredPrice(null);
  }, []);

  return (
    <div style={{
      background: colors.card,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px", marginBottom: "4px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {coinImage && (
              <img src={coinImage} alt={coinName} style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
            )}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>{coinName}</span>
                {coinSymbol && (
                  <span style={{ fontSize: "12px", color: colors.textMuted, textTransform: "uppercase", fontWeight: 500 }}>{coinSymbol}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", gap: "2px", padding: "3px",
            background: colors.filterBar, borderRadius: "8px",
          }}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.days}
                onClick={() => onTimeframeChange(tf.days)}
                style={{
                  padding: "5px 12px", borderRadius: "6px", fontSize: "11px",
                  fontWeight: 600, cursor: "pointer", border: "none",
                  transition: "all 0.15s ease",
                  background: timeframe === tf.days ? colors.accent : "transparent",
                  color: timeframe === tf.days ? "#fff" : colors.filterInactiveText,
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px", marginTop: "8px" }}>
          <span style={{
            fontSize: "32px", fontWeight: 800, color: colors.textPrimary,
            letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums",
          }}>
            {formatCurrency(displayPrice)}
          </span>
          {priceChange != null && (
            <span style={{
              fontSize: "14px", fontWeight: 600,
              color: priceChange >= 0 ? "#10b981" : "#ef4444",
              display: "flex", alignItems: "center", gap: "4px",
            }}>
              {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}%
            </span>
          )}
          {hoveredPrice !== null && (
            <span style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500 }}>
              (hover)
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "0 8px 16px 0" }}>
        {loading ? (
          <div style={{ height: "320px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {spinnerImg ? (
              <img src={spinnerImg} alt="Loading" className="spinner-img-rotate" style={{ width: 28, height: 28 }} />
            ) : (
              <span style={{ color: colors.textMuted, fontSize: "13px" }}>Loading chart...</span>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={accentColor} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.divider}
                vertical={false}
                opacity={0.4}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: colors.textMuted, fontWeight: 400 }}
                axisLine={{ stroke: colors.divider, strokeWidth: 1 }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 10, fill: colors.textMuted, fontWeight: 400 }}
                axisLine={false}
                tickLine={false}
                width={65}
                tickFormatter={formatAxisPrice}
                tickCount={6}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{
                  stroke: colors.textMuted,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  opacity: 0.5,
                }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={accentColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: accentColor,
                  stroke: colors.card,
                  strokeWidth: 2,
                }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const TradingChart = memo(TradingChartInner);
export default TradingChart;
export { type ChartDataPoint, formatCurrency, formatVolume };
