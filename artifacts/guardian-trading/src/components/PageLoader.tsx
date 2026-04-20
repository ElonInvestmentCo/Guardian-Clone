import { useLoading } from "@/context/LoadingContext";
import { useEffect } from "react";

export function PageLoader() {
  const { isLoading, showLoader } = useLoading();

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  return (
    <>
      <style>{`
        @keyframes gt-spin {
          to { transform: rotate(360deg); }
        }
        .gt-spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2.5px solid rgba(118, 208, 244, 0.15);
          border-top-color: #76D0F4;
          animation: gt-spin 0.75s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
      <div
        aria-hidden={!showLoader}
        role="status"
        aria-label="Loading"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(6, 11, 20, 0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: showLoader ? 1 : 0,
          pointerEvents: isLoading ? "all" : "none",
          transition: "opacity 250ms ease-in-out",
        }}
      >
        <div className="gt-spinner" />
      </div>
    </>
  );
}
