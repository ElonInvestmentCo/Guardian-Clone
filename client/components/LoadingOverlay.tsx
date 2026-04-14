import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";

interface LoadingOverlayProps {
  loading: boolean;
}

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  return (
    <div
      aria-hidden={!loading}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 50,
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? "all" : "none",
        transition: "opacity 250ms ease-in-out",
        borderRadius: "inherit",
      }}
    >
      <img
        src={loaderGif}
        alt="Loading"
        draggable={false}
        style={{ width: 80, height: 80, objectFit: "contain" }}
      />
    </div>
  );
}
