export const STEP_CONFIG = [
  { num: 0,  key: "general",              path: "/general-details",       prevPath: null,                      nextPath: "/personal-details"       },
  { num: 1,  key: "personal",             path: "/personal-details",      prevPath: "/general-details",        nextPath: "/professional-details"   },
  { num: 2,  key: "professional",         path: "/professional-details",  prevPath: "/personal-details",       nextPath: "/id-information"         },
  { num: 3,  key: "idInformation",        path: "/id-information",        prevPath: "/professional-details",   nextPath: "/income-details"         },
  { num: 4,  key: "income",               path: "/income-details",        prevPath: "/id-information",         nextPath: "/risk-tolerance"         },
  { num: 5,  key: "riskTolerance",        path: "/risk-tolerance",        prevPath: "/income-details",         nextPath: "/financial-situation"    },
  { num: 6,  key: "financialSituation",   path: "/financial-situation",   prevPath: "/risk-tolerance",         nextPath: "/investment-experience"  },
  { num: 7,  key: "investmentExperience", path: "/investment-experience", prevPath: "/financial-situation",    nextPath: "/id-proof-upload"        },
  { num: 8,  key: "idProofUpload",        path: "/id-proof-upload",       prevPath: "/investment-experience",  nextPath: "/funding-details"        },
  { num: 9,  key: "fundingDetails",       path: "/funding-details",       prevPath: "/id-proof-upload",        nextPath: "/disclosures"            },
  { num: 10, key: "disclosures",          path: "/disclosures",           prevPath: "/funding-details",        nextPath: "/signatures"             },
  { num: 11, key: "signatures",           path: "/signatures",            prevPath: "/disclosures",            nextPath: "/application-submitted"  },
] as const;

export type StepConfig = (typeof STEP_CONFIG)[number];
export type StepKey = StepConfig["key"];
export type StepNum = StepConfig["num"];

export interface AuditEntry {
  stepKey: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

export interface OnboardingState {
  sessionId: string;
  email: string | null;
  completedSteps: number[];
  stepData: Record<string, Record<string, unknown>>;
}

export type OnboardingAction =
  | { type: "SET_EMAIL"; email: string }
  | { type: "COMPLETE_STEP"; stepNum: number; stepKey: string; data: Record<string, unknown> }
  | { type: "RESTORE"; payload: Partial<OnboardingState> }
  | { type: "RESET" };

const STORAGE_KEY = "gt_onboarding_v2";

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const DEFAULT_STATE: OnboardingState = {
  sessionId: generateSessionId(),
  email: null,
  completedSteps: [],
  stepData: {},
};

export function loadPersistedState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, sessionId: generateSessionId() };
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return { ...DEFAULT_STATE, sessionId: generateSessionId() };
  }
}

export function persistState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.email };

    case "COMPLETE_STEP": {
      const already = state.completedSteps.includes(action.stepNum);
      return {
        ...state,
        completedSteps: already
          ? state.completedSteps
          : [...state.completedSteps, action.stepNum].sort((a, b) => a - b),
        stepData: {
          ...state.stepData,
          [action.stepKey]: action.data,
        },
      };
    }

    case "RESTORE":
      return {
        ...state,
        ...(action.payload.email ? { email: action.payload.email } : {}),
        completedSteps: [
          ...new Set([
            ...state.completedSteps,
            ...(action.payload.completedSteps ?? []),
          ]),
        ].sort((a, b) => a - b),
        stepData: {
          ...state.stepData,
          ...(action.payload.stepData ?? {}),
        },
      };

    case "RESET":
      return { ...DEFAULT_STATE, sessionId: generateSessionId() };

    default:
      return state;
  }
}

export function canAccessStep(completedSteps: number[], stepNum: number): boolean {
  if (stepNum === 0) return true;
  return completedSteps.includes(stepNum - 1);
}

export function getHighestAccessibleStep(completedSteps: number[]): number {
  if (completedSteps.length === 0) return 0;
  return Math.min(Math.max(...completedSteps) + 1, 11);
}

export function getStepByNum(num: number): StepConfig {
  const found = STEP_CONFIG.find((s) => s.num === num);
  if (!found) throw new Error(`No step config for num=${num}`);
  return found as StepConfig;
}
