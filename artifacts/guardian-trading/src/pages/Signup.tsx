import { useState } from "react";
import { Link, useLocation } from "wouter";
import eyeOpen from "@assets/eye_open_transparent.png";
import eyeClosed from "@assets/eye_closed_transparent.png";

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Blue top stripe */}
          <div className="h-[5px] bg-[#4a7fbd] w-full" />

          {/* Header */}
          <div className="px-8 pt-7 pb-5 text-center border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-[#4a7fbd] leading-snug">
              Begin an Online<br />Application
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#4a7fbd] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                />
              </div>

              {/* Create Password */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="w-full px-4 py-3.5 pr-14 bg-gray-100 border-0 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showPassword ? eyeClosed : eyeOpen}
                      alt=""
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[83px] object-cover"
                      style={{ filter: "contrast(50) brightness(0.1)" }}
                    />
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label className="block text-sm text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className="w-full px-4 py-3.5 pr-14 bg-gray-100 border-0 rounded text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showConfirmPassword ? eyeClosed : eyeOpen}
                      alt=""
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[83px] object-cover"
                      style={{ filter: "contrast(50) brightness(0.1)" }}
                    />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.submit && (
                <p className="mb-3 text-xs text-red-500 text-center">{errors.submit}</p>
              )}

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors disabled:opacity-70"
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
