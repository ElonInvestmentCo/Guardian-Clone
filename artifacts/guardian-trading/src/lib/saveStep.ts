const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * Save a completed onboarding step to the server.
 * Writes are async and non-blocking — errors are logged but do not throw.
 */
export async function saveSignupStep(
  step: string,
  data: Record<string, unknown>
): Promise<void> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return;
  try {
    const res = await fetch(`${BASE}/api/signup/save-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, step, data }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[saveStep] Server error saving "${step}":`, body);
    }
  } catch (err) {
    console.error(`[saveStep] Failed to save step "${step}":`, err);
  }
}

/**
 * Retrieve all saved progress steps for the current session user.
 */
export async function getProgress(): Promise<{
  steps: Record<string, unknown>;
  completedSteps: string[];
}> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return { steps: {}, completedSteps: [] };
  try {
    const res = await fetch(
      `${BASE}/api/signup/get-progress?email=${encodeURIComponent(email)}`
    );
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      steps: (body["steps"] as Record<string, unknown>) ?? {},
      completedSteps: (body["completedSteps"] as string[]) ?? [],
    };
  } catch {
    return { steps: {}, completedSteps: [] };
  }
}

/**
 * Trigger account verification for the current session user.
 * Updates status to "verified" and fires the confirmation email.
 */
export async function verifyAccount(): Promise<{ success: boolean; error?: string }> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return { success: false, error: "No session email found" };
  try {
    const res = await fetch(`${BASE}/api/signup/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    return res.ok ? { success: true } : { success: false, error: (body["error"] as string) ?? "Verification failed" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Poll the current user's application status from the server.
 */
export async function checkApplicationStatus(): Promise<{ status: string; verifiedAt?: string | null }> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return { status: "pending" };
  try {
    const res = await fetch(`${BASE}/api/signup/status?email=${encodeURIComponent(email)}`);
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    return {
      status: (body["status"] as string) ?? "pending",
      verifiedAt: body["verifiedAt"] as string | null | undefined,
    };
  } catch {
    return { status: "pending" };
  }
}

export type UploadResult =
  | { success: true; path: string; fileName: string }
  | { success: false; error: string };

/**
 * Upload a document file to the server immediately after selection.
 * Saved to data/users/{email}/documents/{role}.{ext}
 *
 * @param file  The File object from the input element
 * @param role  A descriptive name for the slot, e.g. "id_front", "id_back"
 */
export async function uploadDocument(
  file: File,
  role: string
): Promise<UploadResult> {
  const email = sessionStorage.getItem("signupEmail");
  if (!email) return { success: false, error: "No session email found" };

  const formData = new FormData();
  formData.append("email", email);
  formData.append("role", role);
  formData.append("file", file);

  try {
    const res = await fetch(`${BASE}/api/signup/upload-document`, {
      method: "POST",
      body: formData,
    });
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok) {
      return { success: false, error: (body["error"] as string) ?? "Upload failed" };
    }
    return {
      success: true,
      path: body["path"] as string,
      fileName: body["fileName"] as string,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
