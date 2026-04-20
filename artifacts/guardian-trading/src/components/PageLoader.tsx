import { useLoading } from "@/context/LoadingContext";
import { useEffect, useRef, useState } from "react";
import loaderGif from "@assets/Loading.gif";

export function PageLoader() {
  const { isLoading } = useLoading();

  // Track whether we are in the "hiding" phase so we can keep the DOM
  // mounted during the fade-out animation.
  const [visible, setVisible] = useState(isLoading);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Show instantly: cancel any in-progress hide and immediately mount.
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setVisible(true);
    } else {
      // Wait for the CSS fade-out to finish before unmounting.
      hideTimer.current = setTimeout(() => setVisible(false), 350);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isLoading]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  if (!visible) return null;

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
        backgroundColor: "#060b14",
        // Appear instantly; fade out smoothly.
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: isLoading ? "none" : "opacity 320ms ease-in-out",
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
