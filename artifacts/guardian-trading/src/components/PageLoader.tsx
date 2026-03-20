import { useLoading } from "@/context/LoadingContext";

export function PageLoader() {
  const { isLoading } = useLoading();

  return (
    <div
      aria-hidden={!isLoading}
      style={{
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: "opacity 200ms ease-in-out",
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3">
        <svg
          className="size-10 sm:size-12 animate-spin"
          viewBox="0 0 48 48"
          fill="none"
          aria-label="Loading"
          role="status"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            className="text-white/10"
          />
          <path
            d="M24 4a20 20 0 0 1 20 20"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-primary"
          />
        </svg>
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground select-none">
          Loading
        </span>
      </div>
    </div>
  );
}
