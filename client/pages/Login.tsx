import { useState } from "react";
import { useLocation } from "wouter";
import { getApiBase } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Required";
    if (!password) newErrors.password = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      if (res.ok) {
        const userEmail = (data as { email?: string }).email || email;
        sessionStorage.setItem("signupEmail", userEmail);
        try {
          const statusRes = await fetch(`${base}/api/user/me?email=${encodeURIComponent(userEmail)}`);
          const statusData = await statusRes.json() as { status?: string; kycComplete?: boolean; completedSteps?: number[] };
          if (statusData.status === "approved") {
            setLoading(false);
            navigate("/dashboard");
          } else if (statusData.status === "verified" || statusData.status === "pending") {
            if (statusData.kycComplete) {
              setLoading(false);
              navigate("/application-pending");
            } else {
              const completedSteps = statusData.completedSteps ?? [];
              const nextStep = completedSteps.length;
              const stepPaths = [
                "/general-details", "/personal-details", "/professional-details",
                "/id-information", "/income-details", "/risk-tolerance",
                "/financial-situation", "/investment-experience", "/id-proof-upload",
                "/funding-details", "/disclosures", "/signatures",
              ];
              setLoading(false);
              navigate(stepPaths[nextStep] ?? "/general-details");
            }
          } else if (statusData.status === "rejected") {
            setLoading(false);
            setErrors({ submit: "Your account application has been rejected. Please contact support." });
          } else if (statusData.status === "resubmit") {
            setLoading(false);
            navigate("/general-details");
          } else {
            setLoading(false);
            navigate("/general-details");
          }
        } catch {
          setLoading(false);
          setErrors({ submit: "Unable to verify account status. Please try again." });
        }
      } else {
        setLoading(false);
        setErrors({ submit: (data as { error?: string }).error || "Invalid credentials." });
      }
    } catch {
      setLoading(false);
      setErrors({ submit: "Unable to connect. Please try again." });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "440px",
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.13)",
          overflow: "hidden",
          border: "1px solid #e8e8e8",
        }}
      >
        {/* Blue top accent bar */}
        <div style={{ height: "4px", backgroundColor: "#2f6fbe" }} />

        <div style={{ padding: "28px 32px 24px 32px" }}>
          {/* Logo row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <img
              src="/assets/GuardianLogo.svg"
              alt="Guardian Trading"
              style={{ height: "72px", width: "auto", display: "block" }}
            />
          </div>

          {/* Title */}
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: "22px",
              fontWeight: "700",
              color: "#1a1a2e",
              letterSpacing: "0",
              lineHeight: "1.2",
            }}
          >
            Client Portal Login
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email input */}
            <div style={{ marginBottom: "12px" }}>
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "44px",
                  padding: "0 14px",
                  fontSize: "14px",
                  color: "#333333",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Password input */}
            <div style={{ marginBottom: "16px", position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  height: "44px",
                  padding: "0 42px 0 14px",
                  fontSize: "14px",
                  color: "#333333",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  color: "#666666",
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {errors.submit && (
              <p
                style={{
                  color: "#cc0000",
                  fontSize: "12px",
                  margin: "0 0 12px 0",
                  padding: 0,
                }}
              >
                {errors.submit}
              </p>
            )}

            {/* Login button row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#337ab8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "inherit",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  fontSize: "20px",
                  color: "#337ab8",
                  textDecoration: "none",
                }}
              >
                Forgot Password ?
              </a>
            </div>

            {/* Need an account */}
            <p
              style={{
                textAlign: "center",
                fontSize: "20px",
                color: "#333333",
                margin: 0,
                padding: 0,
              }}
            >
              Need An Account{" "}
              <a
                href="/signup"
                onClick={(e) => { e.preventDefault(); navigate("/general-details"); }}
                style={{
                  color: "#337ab8",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Open Now →
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
