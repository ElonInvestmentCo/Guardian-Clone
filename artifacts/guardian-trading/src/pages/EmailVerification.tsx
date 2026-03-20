import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

const RESEND_COOLDOWN = 30;

export default function EmailVerification() {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [devMode, setDevMode] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verificationEmail") || "";
    const pw = sessionStorage.getItem("verificationPassword") || "";
    const isDev = sessionStorage.getItem("verificationDevMode") === "1";
    setEmail(storedEmail);
    setStoredPassword(pw);
    setDevMode(isDev);
    if (!storedEmail) {
      navigate("/signup");
      return;
    }
    inputRef.current?.focus();
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    setError("");
    setResendSuccess(false);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error || "Failed to resend code. Please try again.");
        return;
      }
      const data = await res.json().catch(() => ({})) as { dev?: boolean };
      if (data.dev) {
        setDevMode(true);
        sessionStorage.setItem("verificationDevMode", "1");
      }
      setResendSuccess(true);
      setInputCode("");
      setCooldown(RESEND_COOLDOWN);
      inputRef.current?.focus();
      setTimeout(() => setResendSuccess(false), 4000);
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  const registerAndContinue = async () => {
    if (email && storedPassword) {
      try {
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        await fetch(`${base}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: storedPassword }),
        });
      } catch {
        // Non-fatal — proceed anyway
      }
    }
    sessionStorage.setItem("signupEmail", email);
    sessionStorage.removeItem("verificationEmail");
    sessionStorage.removeItem("verificationPassword");
    navigate("/general-details");
  };

  const handleBack = () => {
    navigate("/signup");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setError("Please enter the verification code");
      return;
    }
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: trimmed }),
      });

      if (res.ok) {
        await registerAndContinue();
        return;
      }

      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error || "Something went wrong. Please try again.");
    } catch {
      setError("Unable to verify. Please check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const maskedEmail = email
    ? (() => {
        const [user, domain] = email.split("@");
        if (!domain) return email;
        const visible = user.slice(0, Math.min(3, user.length));
        return `${visible}${"*".repeat(Math.max(0, user.length - visible.length))}@${domain}`;
      })()
    : "";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#f0f0f0" }}
    >
      <div className="w-full" style={{ maxWidth: "360px" }}>
        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: "4px",
            boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
            border: "1px solid #d0d0d0",
          }}
        >
          {/* Blue top stripe */}
          <div style={{ height: "5px", background: "#3a7bd5" }} />

          {/* Header row */}
          <div
            className="flex items-center px-4 py-3"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            <button
              onClick={handleBack}
              className="flex items-center justify-center rounded-full text-white flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ width: "30px", height: "30px", background: "#3a7bd5" }}
              aria-label="Go back"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="flex-1 text-center font-semibold"
              style={{ color: "#3a7bd5", fontSize: "17px", paddingRight: "30px" }}
            >
              Email Verification
            </h1>
          </div>

          {/* Body */}
          <div className="px-8 pt-8 pb-8">

            {/* Dev mode notice */}
            {devMode && (
              <div
                className="mb-6 px-3 py-3 rounded text-xs leading-relaxed"
                style={{ background: "#fffbea", border: "1px solid #f0c040", color: "#7a5c00" }}
              >
                <strong>Development mode:</strong> Email delivery is unavailable (domain not yet verified in Resend). Check the <strong>API server console</strong> for your verification code.
              </div>
            )}

            {/* Guardian Trading logo */}
            <div className="flex justify-center mb-7">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                style={{ height: "76px", width: "auto", objectFit: "contain" }}
              />
            </div>

            {/* Sent message */}
            <div
              className="text-center mb-6 px-2"
              style={{ borderBottom: "1px solid #eee", paddingBottom: "18px" }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: "40px", height: "40px", background: "#e8f0fb" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3a7bd5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#1c2e3e" }}>
                Verification code sent
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#666" }}>
                We sent a 6-digit code to<br />
                <span className="font-semibold" style={{ color: "#3a7bd5" }}>{maskedEmail}</span>
              </p>
            </div>

            {/* Resend success notice */}
            {resendSuccess && (
              <div
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded text-xs"
                style={{ background: "#e8f0fb", color: "#3a7bd5", border: "1px solid #c3d8f5" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                A new code has been sent to your email.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Code input */}
              <div className="mb-5">
                <label className="block text-xs mb-2 font-semibold" style={{ color: "#555", letterSpacing: "0.04em" }}>
                  ENTER VERIFICATION CODE
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={inputCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setInputCode(val);
                    if (error) setError("");
                  }}
                  placeholder="• • • • • •"
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full focus:outline-none text-center"
                  style={{
                    background: "#f2f2f2",
                    border: error ? "1px solid #e53e3e" : "1px solid #ccc",
                    borderBottom: error ? "2px solid #e53e3e" : "2px solid #3a7bd5",
                    borderRadius: "2px",
                    padding: "12px 12px",
                    color: "#1c2e3e",
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "0.3em",
                  }}
                />
                {error && (
                  <p className="mt-2 text-xs text-center flex items-center justify-center gap-1" style={{ color: "#e53e3e" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-center mb-5">
                <button
                  type="submit"
                  disabled={verifying}
                  className="text-white text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    background: "#3a7bd5",
                    borderRadius: "4px",
                    padding: "10px 44px",
                    border: "none",
                    cursor: verifying ? "not-allowed" : "pointer",
                    minWidth: "140px",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  {verifying ? (
                    <>
                      <Spinner />
                      Verifying…
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </div>
            </form>

            {/* Resend row */}
            <div className="text-center">
              {cooldown > 0 ? (
                <p className="text-xs" style={{ color: "#999" }}>
                  Resend available in{" "}
                  <span style={{ color: "#555", fontWeight: 600 }}>{cooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: "none",
                    border: "none",
                    color: resending ? "#999" : "#3a7bd5",
                    fontWeight: 600,
                    cursor: resending ? "not-allowed" : "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  {resending ? "Sending…" : "Resend Code"}
                </button>
              )}
            </div>

            {/* Expiry note */}
            <p className="text-center mt-4 text-xs" style={{ color: "#bbb" }}>
              Code expires in 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
