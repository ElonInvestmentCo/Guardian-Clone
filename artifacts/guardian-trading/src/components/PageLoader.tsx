import { useLoading } from "@/context/LoadingContext";
import { useEffect, useRef, useState } from "react";

// How long loading must be ongoing before the spinner becomes visible.
// Keeps sub-200ms loads completely invisible to prevent flashing.
const SHOW_THRESHOLD_MS = 200;

// How long the fade-out transition takes (must match CSS transition below).
const FADE_OUT_MS = 280;

export function PageLoader() {
  const { isLoading } = useLoading();

  // `mounted`  — keeps the DOM node alive during the fade-out animation.
  // `revealed` — drives the opacity; only true after SHOW_THRESHOLD_MS.
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Ref mirrors `revealed` so the isLoading=false branch can read the
  // current value without going stale inside the effect closure.
  const revealedRef = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Cancel any in-flight unmount from a previous cycle.
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      // Mount the overlay immediately (opacity 0) so it's ready to
      // reveal without a layout jump, but only make it visible after
      // the threshold — if loading finishes first the user sees nothing.
      setMounted(true);
      showTimer.current = setTimeout(() => {
        setRevealed(true);
        revealedRef.current = true;
      }, SHOW_THRESHOLD_MS);
    } else {
      // Loading finished — cancel the pending reveal if it hasn't fired.
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
      }

      if (revealedRef.current) {
        // Spinner was already visible: fade it out, then unmount.
        setRevealed(false);
        revealedRef.current = false;
        hideTimer.current = setTimeout(() => {
          setMounted(false);
        }, FADE_OUT_MS);
      } else {
        // Spinner never became visible (fast load): unmount silently.
        setMounted(false);
      }
    }

    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, [isLoading]);

  // Only lock scroll while the overlay is actually visible to the user.
  useEffect(() => {
    document.body.style.overflow = mounted && revealed ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
        // Appear instantly once revealed; always transition out smoothly.
        opacity: revealed ? 1 : 0,
        pointerEvents: revealed ? "all" : "none",
        transition: "opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="gt-spinner gt-spinner-md" />
    </div>
  );
}
