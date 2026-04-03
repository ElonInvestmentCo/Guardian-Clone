import { useState, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { getApiBase } from "@/lib/api";
import spinnerImg from "@assets/spinner-clean.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    submit?: string;
  }>({});
  const [, navigate] = useLocation();
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckedEmail = useRef("");

  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) return;
    if (emailToCheck === lastCheckedEmail.current) return;
    lastCheckedEmail.current = emailToCheck;
    setEmailChecking(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const data = await res.json() as { available?: boolean };
      if (!data.available) {
        setErrors((p) => ({ ...p, email: "An account with this email already exists. Please log in instead." }));
      }
    } catch { /* network error — will be caught on submit */ }
    finally { setEmailChecking(false); }
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
    lastCheckedEmail.current = "";
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      emailCheckTimer.current = setTimeout(() => checkEmailAvailability(value), 600);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const res = await fetch(`${base}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setErrors({ submit: data.error || "Failed to send verification email. Please try again." });
        return;
      }
      sessionStorage.setItem("verificationEmail", email);
      sessionStorage.setItem("verificationPassword", password);
      setSent(true);
      setTimeout(() => navigate("/email-verification"), 600);
    } catch {
      setErrors({ submit: "Unable to connect. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#f0f0f0" }}
    >
      <div className="w-full" style={{ maxWidth: "620px" }}>
        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: "4px",
            boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
            border: "1px solid #d0d0d0",
          }}
        >
          <div style={{ height: "5px", background: "#3a7bd5" }} />

          <div
            className="text-center px-10 pt-7 pb-6"
            style={{ borderBottom: "1px solid #e0e0e0" }}
          >
            <h1
              className="font-semibold leading-snug"
              style={{ color: "#3a7bd5", fontSize: "24px" }}
            >
              Begin an Online Application
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#555" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#3a7bd5" }} className="hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="px-10 py-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "#e8f0fb" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a7bd5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm text-center" style={{ color: "#444" }}>
                  Verification code sent to<br />
                  <span className="font-semibold" style={{ color: "#3a7bd5" }}>{email}</span>
                </p>
                <p className="text-xs" style={{ color: "#999" }}>Redirecting…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>

                <div className="mb-5">
                  <label className="block text-sm mb-[6px]" style={{ color: "#333" }}>
                    Email <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div className="gt-input-wrap">
                    <input
                      type="email"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => checkEmailAvailability(email)}
                      className="w-full text-sm focus:outline-none"
                      style={{
                        background: "#e8e8e8",
                        border: "none",
                        borderRadius: "3px",
                        padding: "13px 14px",
                        color: "#333",
                        height: "46px",
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.email}</p>
                  )}
                </div>

                <div className="mb-5">
                  <label className="block text-sm mb-[6px]" style={{ color: "#333" }}>
                    Promo Code
                  </label>
                  <div className="gt-input-wrap">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full text-sm focus:outline-none"
                      style={{
                        background: "#e8e8e8",
                        border: "none",
                        borderRadius: "3px",
                        padding: "13px 14px",
                        color: "#333",
                        height: "46px",
                      }}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm mb-[6px]" style={{ color: "#333" }}>
                    Create Password <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div className="gt-input-wrap">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                        }}
                        className="w-full text-sm focus:outline-none"
                        style={{
                          background: "#e8e8e8",
                          border: "none",
                          borderRadius: "3px",
                          padding: "13px 52px 13px 14px",
                          color: "#333",
                          height: "46px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-0 top-0 h-full flex items-center justify-center"
                        style={{ width: "48px" }}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <img
                          src={showPassword ? "/eye-open-clean.png" : "/eye-closed-clean.png"}
                          alt=""
                          style={{
                            width: "35px",
                            height: "35px",
                            objectFit: "contain",
                            filter: "brightness(0) opacity(0.85)",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.password}</p>
                  )}
                </div>

                <div className="mb-8">
                  <label className="block text-sm mb-[6px]" style={{ color: "#333" }}>
                    Confirm Password <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div className="gt-input-wrap">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword)
                            setErrors((p) => ({ ...p, confirmPassword: undefined }));
                        }}
                        className="w-full text-sm focus:outline-none"
                        style={{
                          background: "#e8e8e8",
                          border: "none",
                          borderRadius: "3px",
                          padding: "13px 52px 13px 14px",
                          color: "#333",
                          height: "46px",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-0 top-0 h-full flex items-center justify-center"
                        style={{ width: "48px" }}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        <img
                          src={showConfirmPassword ? "/eye-open-clean.png" : "/eye-closed-clean.png"}
                          alt=""
                          style={{
                            width: "35px",
                            height: "35px",
                            objectFit: "contain",
                            filter: "brightness(0) opacity(0.85)",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.confirmPassword}</p>
                  )}
                </div>

                {errors.submit && (
                  <p className="mb-4 text-xs text-center" style={{ color: "#e53e3e" }}>{errors.submit}</p>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-white text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{
                      background: "#3a7bd5",
                      borderRadius: "4px",
                      padding: "10px 44px",
                      border: "none",
                      cursor: loading ? "not-allowed" : "pointer",
                      minWidth: "120px",
                      justifyContent: "center",
                      fontSize: "15px",
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Sending…
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <img src={spinnerImg} alt="" className="spinner-img-rotate" style={{ width: 14, height: 14 }} />;
}
