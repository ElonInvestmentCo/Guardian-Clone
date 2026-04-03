import { useLoading } from "@/context/LoadingContext";
import { useEffect } from "react";
import spinnerImg from "@assets/spinner-clean.png";

export function PageLoader() {
  const { isLoading } = useLoading();

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  return (
    <div
      aria-hidden={!isLoading}
      style={{
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "all" : "none",
        transition: "opacity 250ms ease-in-out",
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <img
          src={spinnerImg}
          alt="Loading"
          className="spinner-img-rotate"
          style={{ width: 48, height: 48 }}
          draggable={false}
        />
      </div>
    </div>
  );
}
