const BAR_COUNT = 12;

export default function SpinnerIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  const bars = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const angle = (360 / BAR_COUNT) * i;
    const opacity = 1 - (i / BAR_COUNT) * 0.75;
    bars.push(
      <rect
        key={i}
        x={size / 2 - size * 0.055}
        y={size * 0.1}
        width={size * 0.11}
        height={size * 0.26}
        rx={size * 0.055}
        ry={size * 0.055}
        fill="#999"
        opacity={opacity}
        transform={`rotate(${angle} ${size / 2} ${size / 2})`}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`spinner-img-rotate ${className}`}
      role="status"
      aria-label="Loading"
    >
      {bars}
    </svg>
  );
}
