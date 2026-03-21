import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  STEP_CONFIG,
  type OnboardingAction,
  type OnboardingState,
  type StepKey,
  canAccessStep,
  getHighestAccessibleStep,
  loadPersistedState,
  onboardingReducer,
  persistState,
} from "./machine";
import { flushRetryQueue } from "./retryQueue";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ProgressResponse {
  completedSteps?: string[];
  stepData?: Record<string, Record<string, unknown>>;
  completedStepNumbers?: number[];
}

export interface OnboardingContextValue {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  canAccessStep: (stepNum: number) => boolean;
  highestAccessibleStep: number;
  getSavedData: (stepKey: StepKey) => Record<string, unknown>;
  setEmail: (email: string) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load synchronously from localStorage so forms get pre-populated data
  // on first render with no flicker
  const [state, dispatch] = useReducer(
    onboardingReducer,
    undefined,
    loadPersistedState
  );

  // Persist every state change to localStorage
  useEffect(() => {
    persistState(state);
  }, [state]);

  // On mount: sync email + async restore from server + flush retry queue
  useEffect(() => {
    const email = sessionStorage.getItem("signupEmail");

    if (email && email !== state.email) {
      dispatch({ type: "SET_EMAIL", email });
    }

    if (email) {
      // Async restore — reconciles localStorage with server truth
      fetch(
        `${BASE}/api/signup/get-progress?email=${encodeURIComponent(email)}`
      )
        .then((r) => r.json())
        .then((body: ProgressResponse) => {
          // Prefer the new completedStepNumbers field; fall back to mapping keys
          let nums: number[] =
            body.completedStepNumbers ??
            (body.completedSteps ?? [])
              .map((k: string) => {
                const found = STEP_CONFIG.find((s) => s.key === k);
                return found ? found.num : -1;
              })
              .filter((n: number) => n >= 0);

          dispatch({
            type: "RESTORE",
            payload: {
              email,
              completedSteps: nums,
              stepData: body.stepData ?? {},
            },
          });
        })
        .catch(() => {
          // Server unreachable — localStorage is the source of truth
        });
    }

    // Flush any queued offline saves
    flushRetryQueue(BASE).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-flush queue on reconnect or window focus
  useEffect(() => {
    const flush = () => flushRetryQueue(BASE).catch(() => {});
    window.addEventListener("focus", flush);
    window.addEventListener("online", flush);
    return () => {
      window.removeEventListener("focus", flush);
      window.removeEventListener("online", flush);
    };
  }, []);

  const can = useCallback(
    (stepNum: number) => canAccessStep(state.completedSteps, stepNum),
    [state.completedSteps]
  );

  const highestAccessibleStep = getHighestAccessibleStep(state.completedSteps);

  const getSavedData = useCallback(
    (key: StepKey): Record<string, unknown> => state.stepData[key] ?? {},
    [state.stepData]
  );

  const setEmail = useCallback(
    (email: string) => dispatch({ type: "SET_EMAIL", email }),
    []
  );

  return (
    <OnboardingContext.Provider
      value={{
        state,
        dispatch,
        canAccessStep: can,
        highestAccessibleStep,
        getSavedData,
        setEmail,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error(
      "useOnboardingContext must be used within <OnboardingProvider>"
    );
  return ctx;
}
