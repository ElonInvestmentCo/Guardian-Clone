import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { getApiBase } from "@/lib/api";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";

export default function KycReviewing() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<string>("reviewing");
  const [elapsed, setElapsed] = useState(0);

  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";

  const pollStatus = useCallback(async () => {
    if (!email) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/user/kyc-status/${encodeURIComponent(email)}`);
      const data = await res.json() as { status: string };
      setStatus(data.status);

      if (data.status === "approved") {
        setTimeout(() => navigate("/dashboard"), 1500);
      } else if (data.status === "resubmit_required" || data.status === "resubmit") {
        navigate("/kyc/resubmit");
      } else if (data.status === "rejected") {
        navigate("/application-pending");
      }
    } catch {
    }
  }, [email, navigate]);

  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    pollStatus();
    const interval = setInterval(pollStatus, 8000);
    return () => clearInterval(interval);
  }, [email, pollStatus]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("signupEmail");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>
      <div className="flex items-center justify-end px-4 sm:px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/></svg>
          844-963-1512
        </a>
      </div>

      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-[54px]">
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "34px", width: "auto" }} /></Link>
          <button
            onClick={handleLogout}
            className="text-white font-medium px-4 sm:px-5 py-1.5 border hover:bg-white/10"
            style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-8 flex items-start justify-center">
        <div className="bg-white w-full max-w-2xl" style={{ borderRadius: "3px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9" }}>
          <div className="px-5 sm:px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <p style={{ fontSize: "15px", color: "#3a7bd5", fontWeight: 600 }}>Verification Status</p>
          </div>

          <div className="px-5 sm:px-8 py-10 sm:py-14 flex flex-col items-center">
            {status === "approved" ? (
              <>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%", background: "#E8F5E9",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px",
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#28a745", marginBottom: "8px" }}>
                  Your Account Has Been Verified!
                </h2>
                <p style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                  Congratulations! You now have full access to Guardian Trading.
                </p>
                <p style={{ fontSize: "13px", color: "#999" }}>Redirecting to your dashboard...</p>
              </>
            ) : (
              <>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%", background: "#E3F2FD",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px",
                  position: "relative",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a7bd5" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <div style={{
                    position: "absolute", top: "-2px", right: "-2px",
                    width: "14px", height: "14px", borderRadius: "50%",
                    background: "#3a7bd5", animation: "pulse 2s infinite",
                  }} />
                </div>

                <span style={{
                  display: "inline-block", padding: "6px 16px", borderRadius: "20px",
                  background: "#E3F2FD", color: "#1565C0", fontSize: "12px", fontWeight: 700,
                  marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  Under Review
                </span>

                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#333", marginBottom: "12px", textAlign: "center" }}>
                  Your Information is Currently Being Reviewed
                </h2>

                <p style={{ fontSize: "14px", color: "#666", textAlign: "center", maxWidth: "460px", lineHeight: 1.7, marginBottom: "24px" }}>
                  Your updated information has been submitted successfully. Our compliance team is now reviewing your application. This page will automatically update once a decision has been made.
                </p>

                <div style={{
                  display: "flex", gap: "24px", padding: "16px 32px",
                  background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: "8px",
                  marginBottom: "24px",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Status</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#3a7bd5" }}>In Review</div>
                  </div>
                  <div style={{ width: "1px", background: "#E5E7EB" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Checking</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#666" }}>
                      Every {elapsed > 0 ? "8" : "..."} seconds
                    </div>
                  </div>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 16px", background: "#F0F4FF", border: "1px solid #C7D2FE",
                  borderRadius: "4px",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B7FFF" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <p style={{ fontSize: "12px", color: "#4338CA" }}>
                    Typical review time: 1–2 business days. You'll be redirected automatically once approved.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
