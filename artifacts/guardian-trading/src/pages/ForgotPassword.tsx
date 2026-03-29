import { useState } from "react";
import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";
import { getApiBase } from "@/lib/api";

type Step = "email" | "reset" | "done";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const base = getApiBase();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/send-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setErrors({ submit: data.error || "Failed to send reset code. Please try again." });
      } else {
        setStep("reset");
      }
    } catch {
      setErrors({ submit: "Unable to connect. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Verification code is required";
    if (!newPassword) errs.newPassword = "New password is required";
    else if (newPassword.length < 8) errs.newPassword = "Password must be at least 8 characters";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your new password";
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), newPassword }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setErrors({ submit: data.error || "Failed to reset password. Please try again." });
      } else {
        setStep("done");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setErrors({ submit: "Unable to connect. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode("");
    setErrors({});
    setStep("email");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          <div className="h-[5px] bg-[#4a7fbd] w-full" />

          <div className="flex items-center px-5 py-4 border-b border-gray-200">
            <Link
              href="/login"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4a7fbd] text-white flex-shrink-0 hover:bg-[#3d6fad] transition-colors"
              aria-label="Back to login"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-[#4a7fbd] flex-1 text-center pr-8">
              {step === "done" ? "Password Reset" : "Forgot Password"}
            </h1>
          </div>

          <div className="px-8 py-7">
            <div className="flex justify-center mb-6">
              <img src={guardianLogo} alt="Guardian Trading" className="h-12 w-auto object-contain" />
            </div>

            {step === "email" && (
              <form onSubmit={handleSendCode} noValidate>
                <p className="text-sm text-gray-500 mb-5 text-center leading-relaxed">
                  Enter your account email and we'll send you a 6-digit reset code.
                </p>
                <div className="mb-5">
                  <div className="gt-input-wrap">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                {errors.submit && <p className="mb-3 text-xs text-red-500 text-center">{errors.submit}</p>}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors disabled:opacity-70"
                  >
                    {loading ? "Sending…" : "Send Reset Code"}
                  </button>
                </div>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPassword} noValidate>
                <p className="text-sm text-gray-500 mb-5 text-center leading-relaxed">
                  A 6-digit code was sent to{" "}
                  <strong className="text-gray-700">{email}</strong>.
                  Enter it below with your new password.
                </p>

                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Verification Code</label>
                  <div className="gt-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="· · · · · ·"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setErrors({}); }}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm text-center tracking-[0.35em] font-bold focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                    />
                  </div>
                  {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">New Password</label>
                  <div className="gt-input-wrap">
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                        className="w-full px-4 py-3 pr-11 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <EyeIcon open={showNew} />
                      </button>
                    </div>
                  </div>
                  {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
                </div>

                <div className="mb-5">
                  <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
                  <div className="gt-input-wrap">
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
                        className="w-full px-4 py-3 pr-11 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>

                {errors.submit && <p className="mb-3 text-xs text-red-500 text-center">{errors.submit}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors disabled:opacity-70 mb-3"
                >
                  {loading ? "Saving…" : "Set New Password"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  className="w-full text-xs text-[#4a7fbd] hover:underline text-center py-1"
                >
                  Didn't receive the code? Try again
                </button>
              </form>
            )}

            {step === "done" && (
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">Password Updated!</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Your password has been reset successfully. Redirecting you to login in a moment…
                </p>
                <Link
                  href="/login"
                  className="inline-block px-8 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
