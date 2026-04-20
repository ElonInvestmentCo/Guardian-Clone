import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md";
}

function Spinner({ className, size = "sm" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "gt-spinner",
        size === "sm" ? "gt-spinner-sm" : "gt-spinner-md",
        className
      )}
    />
  );
}

export { Spinner };
