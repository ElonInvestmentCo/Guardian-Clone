import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export default function TurnstileWidget({ onVerify, onExpire, theme = "light" }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  if (!siteKey) {
    console.error("[Turnstile] VITE_TURNSTILE_SITE_KEY is not configured — verification widget cannot render.");
    return (
      <div className="text-xs text-red-500 border border-red-200 bg-red-50 rounded px-3 py-2">
        Human verification is unavailable right now. Please try again later.
      </div>
    );
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{ theme, size: "normal" }}
    />
  );
}
