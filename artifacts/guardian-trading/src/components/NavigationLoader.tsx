import { useLayoutEffect, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/context/LoadingContext";

const MIN_LOADER_MS = 450;

export function NavigationLoader() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);
  const { startLoading, stopLoading } = useLoading();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flag set by popstate (browser back/forward). Because popstate fires
  // before Wouter updates the location, this ref is already true by the
  // time useLayoutEffect runs for that navigation.
  const isPopNavigation = useRef(false);

  useEffect(() => {
    const handlePop = () => {
      isPopNavigation.current = true;
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useLayoutEffect(() => {
    // Skip the very first render — not a real navigation.
    if (prevLocation.current === null) {
      prevLocation.current = location;
      return undefined;
    }

    if (prevLocation.current !== location) {
      prevLocation.current = location;

      if (isPopNavigation.current) {
        // Back/forward navigation — skip the loader entirely.
        isPopNavigation.current = false;
        return undefined;
      }

      if (timer.current) clearTimeout(timer.current);
      startLoading();
      timer.current = setTimeout(() => stopLoading(), MIN_LOADER_MS);

      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    return undefined;
  }, [location, startLoading, stopLoading]);

  return null;
}
