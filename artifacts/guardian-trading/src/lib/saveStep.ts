const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function saveSignupStep(
  step: string,
  data: Record<string, unknown>
): Promise<void> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return;
  try {
    await fetch(`${BASE}/api/signup/save-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, step, data }),
    });
  } catch (err) {
    console.error(`[saveStep] Failed to save step "${step}":`, err);
  }
}
