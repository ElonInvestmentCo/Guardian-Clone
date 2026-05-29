import { Turnstile } from "@marsidev/react-turnstile";

const DEV_SITE_KEY = "1x00000000000000000000AA";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
}

export default function TurnstileWidget({ onVerify, onExpire, theme = "light" }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined ?? DEV_SITE_KEY;

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onVerify}
      onExpire={onExpire}
      options={{ theme, size: "normal" }}
    />
  );
}
