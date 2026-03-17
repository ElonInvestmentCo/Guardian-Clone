import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      alert("Login submitted successfully!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Blue top border stripe */}
          <div className="h-1.5 bg-blue-500 w-full" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                className="h-14 w-auto object-contain"
                data-testid="img-login-logo"
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Client Portal Login
            </h1>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="w-full px-4 py-3 bg-gray-100 border-0 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                  data-testid="input-email"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500" data-testid="error-email">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
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

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition-colors disabled:opacity-70 text-sm"
                data-testid="button-login"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="mt-6 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                data-testid="link-forgot-password"
              >
                Forgot Password ?
              </Link>
            </div>

            {/* Need an Account */}
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-700 font-medium">Need An Account </span>
              <Link
                href="/signup"
                className="text-sm text-blue-500 hover:text-blue-600 hover:underline font-medium"
                data-testid="link-open-now"
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
