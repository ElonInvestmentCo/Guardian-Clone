import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/context/LoadingContext";

// Minimum time (ms) the loader is shown per navigation.
// Short enough to feel snappy, long enough to mask any content flash.
const MIN_LOADER_MS = 450;

export function NavigationLoader() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);
  const { startLoading, stopLoading } = useLoading();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    // Skip the very first render (not a navigation).
    if (prevLocation.current === null) {
      prevLocation.current = location;
      return undefined;
    }

    if (prevLocation.current !== location) {
      prevLocation.current = location;

      // Cancel any in-progress hide timer from a previous navigation.
      if (timer.current) clearTimeout(timer.current);

      // Show the loader immediately (synchronously before browser paint).
      startLoading();

      // Hide after the minimum visible duration.
      timer.current = setTimeout(() => stopLoading(), MIN_LOADER_MS);

      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    return undefined;
  }, [location, startLoading, stopLoading]);

  return null;
}
