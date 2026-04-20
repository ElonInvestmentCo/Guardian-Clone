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
        backgroundColor: "rgba(6, 11, 20, 0.6)",
        zIndex: 50,
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? "all" : "none",
        transition: "opacity 220ms ease-out",
        borderRadius: "inherit",
      }}
    >
      <div className="gt-spinner gt-spinner-md" />
    </div>
  );
}
