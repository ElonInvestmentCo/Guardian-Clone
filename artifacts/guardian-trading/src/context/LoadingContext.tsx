import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface LoadingContextValue {
  isLoading: boolean;
  showLoader: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  showLoader: false,
  startLoading: () => {},
  stopLoading: () => {},
});

const SHOW_DELAY_MS = 200;
const INITIAL_TIMEOUT_MS = 500;

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
  }, []);

  const startLoading = useCallback(() => {
    clearAllTimers();
    setIsLoading(true);
    showTimerRef.current = setTimeout(() => setShowLoader(true), SHOW_DELAY_MS);
  }, [clearAllTimers]);

  const stopLoading = useCallback(() => {
    clearAllTimers();
    setIsLoading(false);
    setShowLoader(false);
  }, [clearAllTimers]);

  useEffect(() => {
    showTimerRef.current = setTimeout(() => setShowLoader(true), SHOW_DELAY_MS);
    stopTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      setShowLoader(false);
    }, INITIAL_TIMEOUT_MS);

    return clearAllTimers;
  }, [clearAllTimers]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoader, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
