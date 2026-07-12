import { Turnstile } from "@marsidev/react-turnstile";

// Cloudflare's published "always passes, invisible" test site key — pairs with the
// matching test secret key used as the server-side dev fallback
// (see server/lib/turnstile.ts). It verifies automatically with no visible
// widget, so none of Cloudflare's "for testing only" watermark ever renders.
// Override with VITE_TURNSTILE_SITE_KEY in production once a real Turnstile
// site is configured — real keys render the normal interactive checkbox
// with no watermark.
const DEV_SITE_KEY = "1x00000000000000000000BB";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export default function TurnstileWidget({ onVerify, onExpire, theme = "light" }: TurnstileWidgetProps) {
  const realSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const siteKey = realSiteKey ?? DEV_SITE_KEY;
  const size = realSiteKey ? "normal" : "invisible";

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{ theme, size }}
    />
  );
}
