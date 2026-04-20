import { useState } from "react";
import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/GuardianLogo.svg";
import { getApiBase } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
          } else if (statusData.status === "not_found") {
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
        setErrors({ submit: (data as { error?: string }).error || "Invalid email or password." });
      }
    } catch {
      setLoading(false);
      setErrors({ submit: "Unable to connect. Please check your connection and try again." });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f5f5f5" }}
    >
      <div className="w-full" style={{ maxWidth: "560px" }}>
        {/* Card */}
        <div
          className="bg-white overflow-hidden"
          style={{
            border: "1px solid #d8dde6",
            borderRadius: "4px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          {/* Blue top accent bar */}
          <div style={{ height: "5px", background: "#3a7bd5", width: "100%" }} />

          {/* Card body */}
          <div className="px-10 py-8 sm:px-14 sm:py-10">

            {/* Logo */}
            <div className="flex items-center justify-center mb-7">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                style={{
                  width: "100%",
                  maxWidth: "320px",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {/* Title */}
            <h1
              className="text-center mb-6"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#333",
                letterSpacing: "0.01em",
                fontFamily: "inherit",
              }}
            >
              Client Portal Login
            </h1>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-3">
                <input
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "14px",
                    color: "#444",
                    background: "#ebebeb",
                    border: "1px solid #dde3ea",
                    borderRadius: "3px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#3a7bd5"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#dde3ea"; }}
                />
                {errors.email && (
                  <p className="mt-1" style={{ fontSize: "12px", color: "#e53e3e" }}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 48px 12px 14px",
                      fontSize: "14px",
                      color: "#444",
                      background: "#ebebeb",
                      border: "1px solid #dde3ea",
                      borderRadius: "3px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#3a7bd5"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#dde3ea"; }}
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowPassword((v) => !v); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "#666",
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1" style={{ fontSize: "12px", color: "#e53e3e" }}>{errors.password}</p>
                )}
              </div>

              {/* Submit error */}
              {errors.submit && (
                <p className="mb-3" style={{ fontSize: "12px", color: "#e53e3e" }}>{errors.submit}</p>
              )}

              {/* Login button + Forgot Password row */}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "9px 28px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#fff",
                    background: loading ? "#7aaee8" : "#3a7bd5",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 6px rgba(58,123,213,0.35)",
                    transition: "background 0.15s",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#2f6bc4"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#3a7bd5"; }}
                >
                  {loading ? "Logging in…" : "Login"}
                </button>

                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: "13px",
                    color: "#3a7bd5",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
                >
                  Forgot Password ?
                </Link>
              </div>
            </form>

            {/* Need an account */}
            <div className="mt-5 flex items-center justify-center gap-1">
              <span style={{ fontSize: "13.5px", color: "#444" }}>Need An Account</span>
              <Link
                href="/signup"
                style={{
                  fontSize: "13.5px",
                  color: "#3a7bd5",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
              >
                Open Now →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
