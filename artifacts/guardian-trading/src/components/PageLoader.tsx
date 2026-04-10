import { useLoading } from "@/context/LoadingContext";
import { useEffect } from "react";
import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";

export function PageLoader() {
  const { isLoading } = useLoading();

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isLoading]);

  return (
    <div
      aria-hidden={!isLoading}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: "opacity 250ms ease-in-out",
      }}
    >
      <img
        src={loaderGif}
        alt="Loading"
        draggable={false}
        style={{ width: 100, height: 100, objectFit: "contain" }}
      />
    </div>
  );
}
