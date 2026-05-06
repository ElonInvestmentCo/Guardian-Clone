interface SparklineProps {
  points: number[];
  positive: boolean;
  width?: number;
  height?: number;
}

export default function Sparkline({ points, positive, width = 80, height = 34 }: SparklineProps) {
  if (!points || points.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2}
          stroke={positive ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pad = 2;
  const W = width;
  const H = height;

  // Map data → SVG coords
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (v - min) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });

  // Smooth polyline using cubic bezier control points
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }

  // Closed fill path
  const last = coords[coords.length - 1];
  const first = coords[0];
  const fill = `${d} L ${last[0]},${H} L ${first[0]},${H} Z`;

  const color  = positive ? "#10b981" : "#ef4444";
  const fillId = `sf-${positive ? "g" : "r"}-${width}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill */}
      <path d={fill} fill={`url(#${fillId})`} />
      {/* Line */}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
