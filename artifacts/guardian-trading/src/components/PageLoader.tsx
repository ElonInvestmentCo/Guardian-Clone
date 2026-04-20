import { useLoading } from "@/context/LoadingContext";
import { useEffect } from "react";
import loaderGif from "@assets/Loading.gif";

export function PageLoader() {
  const { isLoading } = useLoading();

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isLoading]);

  return (
    <div
      aria-hidden={!isLoading}
      role="status"
      aria-label="Loading"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(6, 11, 20, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: "opacity 300ms ease-in-out",
      }}
    >
      <img
        src={loaderGif}
        alt=""
        draggable={false}
        style={{
          width: 96,
          height: "auto",
          maxWidth: 96,
          objectFit: "contain",
          imageRendering: "auto",
          display: "block",
          userSelect: "none",
        }}
      />
    </div>
  );
}
