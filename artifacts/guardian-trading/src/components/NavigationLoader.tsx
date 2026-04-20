import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/context/LoadingContext";

// Total time isLoading stays true per navigation.
// PageLoader's 200ms show-threshold means the spinner only appears if
// the route transition takes longer than 200ms — for instant navigations
// the user sees nothing. When the spinner does appear it stays visible
// for at least (MIN_LOADER_MS - 200) = 250ms before fading out, which
// is enough to avoid a distracting flash.
const MIN_LOADER_MS = 450;

export function NavigationLoader() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);
  const { startLoading, stopLoading } = useLoading();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    // Skip the very first render — not a real navigation.
    if (prevLocation.current === null) {
      prevLocation.current = location;
      return undefined;
    }

    if (prevLocation.current !== location) {
      prevLocation.current = location;

      if (timer.current) clearTimeout(timer.current);

      // Signal loading synchronously before the browser paints so
      // PageLoader can start its 200ms threshold timer immediately.
      startLoading();

      // Signal done after the minimum period.
      timer.current = setTimeout(() => stopLoading(), MIN_LOADER_MS);

      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }

    return undefined;
  }, [location, startLoading, stopLoading]);

  return null;
}
