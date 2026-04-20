import { useLoading } from "@/context/LoadingContext";
import { useEffect, useRef, useState } from "react";
import loaderGif from "@assets/Loading.gif";

const SHOW_THRESHOLD_MS = 200;
const FADE_OUT_MS = 280;

export function PageLoader() {
  const { isLoading } = useLoading();

  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const revealedRef = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setMounted(true);
      showTimer.current = setTimeout(() => {
        setRevealed(true);
        revealedRef.current = true;
      }, SHOW_THRESHOLD_MS);
    } else {
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      if (revealedRef.current) {
        setRevealed(false);
        revealedRef.current = false;
        hideTimer.current = setTimeout(() => setMounted(false), FADE_OUT_MS);
      } else {
        setMounted(false);
      }
    }
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, [isLoading]);

  useEffect(() => {
    document.body.style.overflow = mounted && revealed ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mounted, revealed]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!revealed}
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
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "all" : "none",
        transition: "opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)",
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
