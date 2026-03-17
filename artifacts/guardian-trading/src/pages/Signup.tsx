import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const code = String(Math.floor(100 + Math.random() * 900));
      sessionStorage.setItem("verificationCode", code);
      sessionStorage.setItem("verificationEmail", email);
      navigate("/email-verification");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Blue top border stripe */}
          <div className="h-1.5 bg-blue-500 w-full" />

          {/* Header section */}
          <div className="px-8 pt-7 pb-5 text-center border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-blue-600 leading-tight">
              Begin an Online<br />Application
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-500 hover:text-blue-600 hover:underline"
                data-testid="link-sign-in"
              >
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
                  className="w-full px-4 py-3 bg-gray-100 border-0 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500" data-testid="error-email">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-0 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                  data-testid="input-promo-code"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500" data-testid="error-password">
                    {errors.password}
                  </p>
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
                    className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500" data-testid="error-confirm-password">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition-colors disabled:opacity-70 text-sm"
                  data-testid="button-submit"
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
