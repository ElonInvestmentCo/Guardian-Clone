import { useLoading } from "@/context/LoadingContext";
import { useEffect, useRef, useState } from "react";

export function PageLoader() {
  const { isLoading } = useLoading();

  const [visible, setVisible] = useState(isLoading);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setVisible(true);
    } else {
      hideTimer.current = setTimeout(() => setVisible(false), 280);
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
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: isLoading ? "none" : "opacity 260ms ease-out",
      }}
    >
      <div className="gt-spinner gt-spinner-md" />
    </div>
  );
}
