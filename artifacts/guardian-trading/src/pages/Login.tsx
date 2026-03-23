import { useState } from "react";
import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

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
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Blue top stripe */}
          <div className="h-[5px] bg-[#4a7fbd] w-full" />

          <div className="px-8 py-8">
            {/* Logo row */}
            <div className="flex items-center gap-3 mb-7">
              <img
                src={guardianLogo}
                alt="Guardian Trading Logo"
                className="h-14 w-auto object-contain flex-shrink-0"
              />
            </div>

            <h1 className="text-[22px] font-bold text-gray-900 mb-6">
              Client Portal Login
            </h1>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="mb-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
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
                    className="w-full px-4 py-3 pr-12 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9"
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
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {errors.submit && (
                <p className="mb-3 text-xs text-red-500">{errors.submit}</p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="mt-5 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[#4a7fbd] hover:underline"
              >
                Forgot Password ?
              </Link>
            </div>

            {/* Need an Account */}
            <div className="mt-3 text-center">
              <span className="text-sm text-gray-800 font-medium">Need An Account </span>
              <Link
                href="/signup"
                className="text-sm text-[#4a7fbd] hover:underline font-medium"
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
