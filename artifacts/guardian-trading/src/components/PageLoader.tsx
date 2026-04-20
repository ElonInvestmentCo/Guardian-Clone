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
    /* Dimmed + blurred backdrop */
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
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "all" : "none",
        transition: "opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Floating card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "0",
          padding: "36px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)",
          minWidth: "180px",
          outline: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <img
          src={loaderGif}
          alt=""
          draggable={false}
          style={{
            width: 48,
            height: 48,
            objectFit: "contain",
            display: "block",
            userSelect: "none",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#444",
            letterSpacing: "0.01em",
            userSelect: "none",
          }}
        >
          Loading…
        </span>
      </div>
    </div>
  );
}
