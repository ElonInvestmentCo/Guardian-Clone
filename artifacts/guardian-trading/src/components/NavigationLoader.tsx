import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useLoading } from "@/context/LoadingContext";

export function NavigationLoader() {
  const [location] = useLocation();
  const prevLocation = useRef<string | null>(null);
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (prevLocation.current === null) {
      prevLocation.current = location;
      return;
    }

    if (prevLocation.current !== location) {
      prevLocation.current = location;
      startLoading();
      const timer = setTimeout(() => stopLoading(), 500);
      return () => clearTimeout(timer);
    }
  }, [location, startLoading, stopLoading]);

  return null;
}
