import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { type StepNum, getStepByNum } from "./machine";
import { useOnboardingContext } from "./OnboardingContext";
import { enqueueRetry } from "./retryQueue";

import { getApiBase } from "../api";
const BASE = getApiBase();

interface CompleteStepResponse {
  success?: boolean;
  errors?: Record<string, string>;
  completedSteps?: number[];
  error?: string;
}

export interface UseOnboardingStepReturn {
  savedData: Record<string, unknown>;
  submit: (data: Record<string, unknown>) => Promise<void>;
  goBack: () => void;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
  globalError: string | null;
}

/**
 * Unified step controller hook. Every onboarding form calls this — no form
 * contains its own save/navigate/validation logic.
 *
 * Flow: submit(data) → POST /api/signup/complete-step → on success dispatch
 *       COMPLETE_STEP + navigate forward; on 422 surface field errors; on
 *       network failure enqueue to retry queue and navigate anyway so the user
 *       is never blocked.
 */
export function useOnboardingStep(stepNum: StepNum): UseOnboardingStepReturn {
  const [, navigate] = useLocation();
  const { state, dispatch, getSavedData } = useOnboardingContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const config = getStepByNum(stepNum);
  const savedData = getSavedData(config.key);

  const submit = useCallback(
    async (data: Record<string, unknown>) => {
      setIsSubmitting(true);
      setValidationErrors({});
      setGlobalError(null);

      const email =
        state.email ?? sessionStorage.getItem("signupEmail") ?? null;
      if (!email) {
        setGlobalError(
          "No session found. Please return to the beginning and try again."
        );
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch(`${BASE}/api/signup/complete-step`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            stepNumber: stepNum,
            stepKey: config.key,
            data,
          }),
        });

        const body = (await res
          .json()
          .catch(() => ({}))) as CompleteStepResponse;

        // Field-level validation errors from server
        if (res.status === 422 && body.errors) {
          setValidationErrors(body.errors);
          setIsSubmitting(false);
          return;
        }

        if (!res.ok || !body.success) {
          throw new Error(body.error ?? "Server error. Please try again.");
        }

        // Update state machine
        dispatch({
          type: "COMPLETE_STEP",
          stepNum,
          stepKey: config.key,
          data,
        });

        navigate(config.nextPath);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Network error occurred.";

        // Queue locally so data is not lost
        enqueueRetry({
          email,
          stepNum,
          stepKey: config.key,
          data,
        });

        setGlobalError(
          `${message} Your progress has been saved locally and will sync automatically.`
        );

        // Still advance the flow — never block the user on a network error
        dispatch({
          type: "COMPLETE_STEP",
          stepNum,
          stepKey: config.key,
          data,
        });

        navigate(config.nextPath);
      } finally {
        setIsSubmitting(false);
      }
    },
    [stepNum, config, state.email, dispatch, navigate]
  );

  const goBack = useCallback(() => {
    if (config.prevPath) navigate(config.prevPath);
  }, [config, navigate]);

  return {
    savedData,
    submit,
    goBack,
    isSubmitting,
    validationErrors,
    globalError,
  };
}
