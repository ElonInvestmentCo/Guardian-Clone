import { cn } from "@/lib/utils"
import spinnerImg from "@assets/bazaart-image_(1)_1775255690400.png";

function Spinner({ className, ...props }: React.ComponentProps<"img">) {
  return (
    <img
      src={spinnerImg}
      role="status"
      aria-label="Loading"
      alt=""
      draggable={false}
      className={cn("size-4 spinner-img-rotate", className)}
      {...props}
    />
  )
}

export { Spinner }
