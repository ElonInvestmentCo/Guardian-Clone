import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <style>{`
            @keyframes _pr_shimmer {
              0% { background-position: -400px 0; }
              100% { background-position: 400px 0; }
            }
            ._pr_bar {
              border-radius: 4px;
              background: linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%);
              background-size: 800px 100%;
              animation: _pr_shimmer 1.4s ease-in-out infinite;
            }
          `}</style>
          <div className="_pr_bar" style={{ width: "180px", height: "10px" }} />
          <div className="_pr_bar" style={{ width: "120px", height: "10px" }} />
          <div className="_pr_bar" style={{ width: "150px", height: "10px" }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
