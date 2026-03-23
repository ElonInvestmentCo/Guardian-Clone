import { useLoading } from "@/context/LoadingContext";
import { useEffect } from "react";

const BAR_COUNT = 12;

function SpinnerBars({ size = 40 }: { size?: number }) {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const angle = (360 / BAR_COUNT) * i;
    const opacity = 1 - (i / BAR_COUNT) * 0.75;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${size * 0.12}px`,
          height: `${size * 0.32}px`,
          borderRadius: `${size * 0.06}px`,
          backgroundColor: "#555",
          opacity,
          transform: `rotate(${angle}deg) translateY(-${size * 0.36}px)`,
          transformOrigin: "50% 0%",
        }}
      />
    );
  });

  return (
    <div
      className="spinner-bars-rotate"
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
      }}
      role="status"
      aria-label="Loading"
    >
      {bars}
    </div>
  );
}

export function PageLoader() {
  const { isLoading } = useLoading();

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  return (
    <div
      aria-hidden={!isLoading}
      style={{
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: "opacity 250ms ease-in-out",
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <SpinnerBars size={44} />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#555",
            letterSpacing: "0.01em",
            userSelect: "none",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          }}
        >
          Loading...
        </span>
      </div>
    </div>
  );
}
