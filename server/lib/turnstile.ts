const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEV_SECRET = "1x0000000000000000000000000000000AA";

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.TURNSTILE_SECRET_KEY ?? DEV_SECRET;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = await res.json() as { success: boolean; "error-codes"?: string[] };

    if (!data.success) {
      console.warn("[Turnstile] Verification failed:", data["error-codes"]);
    }
    return data.success;
  } catch (err) {
    console.error("[Turnstile] Fetch error:", err);
    return false;
  }
}
