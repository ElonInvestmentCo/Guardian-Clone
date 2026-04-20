import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface LoadingContextValue {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: true,
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsLoading(true);
  }, []);

  // Debounce stop so a burst of quick start/stop pairs don't flicker.
  const stopLoading = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsLoading(false), 150);
  }, []);

  // Initial page load: stop as soon as the browser fires `load` (all
  // resources ready), or immediately if the page is already complete.
  // PageLoader's own 200ms threshold decides whether the spinner ever
  // becomes visible — so here we just signal "done" as accurately as
  // possible rather than using an arbitrary fixed delay.
  useEffect(() => {
    const done = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Tiny buffer so React finishes its own paint before hiding.
      timerRef.current = setTimeout(() => setIsLoading(false), 80);
    };

    if (document.readyState === "complete") {
      // Already loaded (hot-reload, bfcache, fast connection).
      done();
    } else {
      window.addEventListener("load", done, { once: true });
      // Hard safety cap — never block the user indefinitely.
      timerRef.current = setTimeout(() => setIsLoading(false), 8000);
    }

    return () => {
      window.removeEventListener("load", done);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
