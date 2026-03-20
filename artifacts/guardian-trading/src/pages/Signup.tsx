import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    submit?: string;
  }>({});
  const [, navigate] = useLocation();

  const validate = () => {
    const newErrors: typeof errors = {};
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
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("verificationCode", data.code);
        sessionStorage.setItem("verificationEmail", email);
        navigate("/email-verification");
      } else {
        const code = String(Math.floor(100 + Math.random() * 900));
        sessionStorage.setItem("verificationCode", code);
        sessionStorage.setItem("verificationEmail", email);
        navigate("/email-verification");
      }
    } catch {
      const code = String(Math.floor(100 + Math.random() * 900));
      sessionStorage.setItem("verificationCode", code);
      sessionStorage.setItem("verificationEmail", email);
      navigate("/email-verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#f0f0f0" }}
    >
      <div className="w-full" style={{ maxWidth: "340px" }}>
        {/* Card */}
        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: "4px",
            boxShadow: "0 2px 18px rgba(0,0,0,0.18)",
            border: "1px solid #ddd",
          }}
        >
          {/* Blue top stripe */}
          <div style={{ height: "4px", background: "#3a7bd5" }} />

          {/* Header */}
          <div
            className="text-center px-8 pt-6 pb-5"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            <h1
              className="font-semibold leading-snug"
              style={{ color: "#3a7bd5", fontSize: "22px" }}
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

          {/* Form body */}
          <div className="px-7 py-6">
            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm mb-1" style={{ color: "#444" }}>
                  Email <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className="w-full text-sm focus:outline-none"
                  style={{
                    background: "#ebebeb",
                    border: "none",
                    borderRadius: "3px",
                    padding: "10px 12px",
                    color: "#333",
                  }}
                />
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.email}</p>
                )}
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                <label className="block text-sm mb-1" style={{ color: "#444" }}>
                  Promo Code
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full text-sm focus:outline-none"
                  style={{
                    background: "#ebebeb",
                    border: "none",
                    borderRadius: "3px",
                    padding: "10px 12px",
                    color: "#333",
                  }}
                />
              </div>

              {/* Create Password */}
              <div className="mb-4">
                <label className="block text-sm mb-1" style={{ color: "#444" }}>
                  Create Password <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className="w-full text-sm focus:outline-none"
                    style={{
                      background: "#ebebeb",
                      border: "none",
                      borderRadius: "3px",
                      padding: "10px 44px 10px 12px",
                      color: "#333",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ width: "42px" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm mb-1" style={{ color: "#444" }}>
                  Confirm Password <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }}
                    className="w-full text-sm focus:outline-none"
                    style={{
                      background: "#ebebeb",
                      border: "none",
                      borderRadius: "3px",
                      padding: "10px 44px 10px 12px",
                      color: "#333",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full flex items-center justify-center transition-opacity hover:opacity-70"
                    style={{ width: "42px" }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.confirmPassword}</p>
                )}
              </div>

              {errors.submit && (
                <p className="mb-3 text-xs text-center" style={{ color: "#e53e3e" }}>{errors.submit}</p>
              )}

              {/* Submit */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    background: "#3a7bd5",
                    borderRadius: "4px",
                    padding: "9px 36px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
