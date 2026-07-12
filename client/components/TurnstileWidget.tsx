import { Turnstile } from "@marsidev/react-turnstile";

// Cloudflare's published "always passes" test site key — pairs with the
// matching test secret key used as the server-side dev fallback
// (see server/lib/turnstile.ts). Override with VITE_TURNSTILE_SITE_KEY in
// production once a real Turnstile site is configured.
const DEV_SITE_KEY = "1x00000000000000000000AA";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export default function TurnstileWidget({ onVerify, onExpire, theme = "light" }: TurnstileWidgetProps) {
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? DEV_SITE_KEY;

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{ theme, size: "normal" }}
    />
  );
}
