/**
 * Returns the base URL for all API calls.
 *
 * Priority:
 *  1. VITE_API_URL env var — set this in Netlify/Vercel/etc. when the
 *     backend is deployed separately (e.g. "https://api.guardiiantrading.com")
 *  2. Relative path — works when Express serves both frontend + API from the
 *     same origin (Replit deployment, or via the Vite dev proxy).
 */
export function getApiBase(): string {
  const explicit = import.meta.env["VITE_API_URL"] as string | undefined;
  if (explicit) return explicit.replace(/\/$/, "");
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}
