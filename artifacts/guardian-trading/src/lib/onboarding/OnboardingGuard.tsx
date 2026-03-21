import { useEffect } from "react";
import { useLocation } from "wouter";
import { STEP_CONFIG } from "./machine";
import { useOnboardingContext } from "./OnboardingContext";

interface OnboardingGuardProps {
  step: number;
  children: React.ReactNode;
}

/**
 * Route guard that enforces sequential onboarding flow.
 *
 * - If no signupEmail in sessionStorage → redirect to /signup
 * - If the required previous step is not completed → redirect to the
 *   highest step the user is allowed to access
 * - Otherwise → render children
 *
 * Because OnboardingContext loads state synchronously from localStorage,
 * there is no async flicker — the guard decision is made on the first render.
 */
export function OnboardingGuard({ step, children }: OnboardingGuardProps) {
  const [, navigate] = useLocation();
  const { canAccessStep, highestAccessibleStep } = useOnboardingContext();

  const email = sessionStorage.getItem("signupEmail");
  const allowed = !!email && canAccessStep(step);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }
    if (!canAccessStep(step)) {
      const target =
        STEP_CONFIG.find((s) => s.num === highestAccessibleStep)?.path ??
        "/general-details";
      navigate(target);
    }
  }, [email, step, canAccessStep, highestAccessibleStep, navigate]);

  if (!allowed) return null;

  return <>{children}</>;
}
