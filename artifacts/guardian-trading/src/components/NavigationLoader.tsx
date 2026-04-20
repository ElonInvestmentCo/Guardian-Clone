import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/context/LoadingContext";

export function NavigationLoader() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);
  const { startLoading, stopLoading } = useLoading();

  useLayoutEffect(() => {
    if (prevLocation.current === null) {
      prevLocation.current = location;
      return undefined;
    }

    if (prevLocation.current !== location) {
      prevLocation.current = location;
      startLoading();
      const timer = setTimeout(() => stopLoading(), 600);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [location, startLoading, stopLoading]);

  return null;
}
