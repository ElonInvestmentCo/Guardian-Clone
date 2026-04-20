import { cn } from "@/lib/utils";
import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";

function Spinner({ className, style, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      src={loaderGif}
      role="status"
      aria-label="Loading"
      alt=""
      draggable={false}
      className={cn("size-4", className)}
      style={{ objectFit: "contain", ...style }}
      {...props}
    />
  );
}

export { Spinner };
