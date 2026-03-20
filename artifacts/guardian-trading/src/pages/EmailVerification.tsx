import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

const COUNTDOWN_START = 180;

export default function EmailVerification() {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [storedCode, setStoredCode] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [, navigate] = useLocation();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verificationEmail") || "";
    const code = sessionStorage.getItem("verificationCode") || "";
    const pw = sessionStorage.getItem("verificationPassword") || "";
    setEmail(storedEmail);
    setStoredCode(code);
    setStoredPassword(pw);
    if (!storedEmail) {
      navigate("/signup");
    }
  }, [navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.code) {
          sessionStorage.setItem("verificationCode", data.code);
          setStoredCode(data.code);
        }
      } else {
        const newCode = String(Math.floor(100 + Math.random() * 900));
        sessionStorage.setItem("verificationCode", newCode);
        setStoredCode(newCode);
      }
    } catch {
      const newCode = String(Math.floor(100 + Math.random() * 900));
      sessionStorage.setItem("verificationCode", newCode);
      setStoredCode(newCode);
    } finally {
      setResending(false);
      setCountdown(COUNTDOWN_START);
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
      }
    }
    sessionStorage.setItem("signupEmail", email);
    sessionStorage.removeItem("verificationCode");
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

      const data = await res.json().catch(() => ({}));

      if (res.status === 400 && data.error?.toLowerCase().includes("expired")) {
        setError("Your code has expired. Please go back and request a new one.");
      } else if (res.status === 400) {
        if (storedCode && trimmed === storedCode) {
          await registerAndContinue();
          return;
        }
        setError("Invalid verification code. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      if (storedCode && inputCode.trim() === storedCode) {
        await registerAndContinue();
        return;
      }
      setError("Unable to verify. Please check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#f0f0f0" }}
    >
      <div className="w-full" style={{ maxWidth: "340px" }}>
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
              Email Authentication
            </h1>
          </div>

          {/* Body */}
          <div className="px-8 pt-10 pb-8">

            {/* Guardian Trading logo — large and centered */}
            <div className="flex justify-center mb-10">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                style={{ height: "90px", width: "auto", objectFit: "contain" }}
              />
            </div>

            {/* Countdown timer / Resend */}
            <div className="text-center mb-5">
              {countdown > 0 ? (
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#888" }}>
                  {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3a7bd5",
                    fontSize: "13px",
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

            <form onSubmit={handleSubmit} noValidate>
              {/* Input with blue bottom border */}
              <div className="mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Verification Code"
                  maxLength={6}
                  className="w-full text-sm focus:outline-none"
                  style={{
                    background: "#f2f2f2",
                    border: "1px solid #ccc",
                    borderBottom: "2px solid #3a7bd5",
                    borderRadius: "2px",
                    padding: "10px 12px",
                    color: "#333",
                    fontSize: "14px",
                  }}
                />
                {error && (
                  <p className="mt-2 text-xs text-center" style={{ color: "#e53e3e" }}>{error}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={verifying}
                  className="text-white text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{
                    background: "#3a7bd5",
                    borderRadius: "4px",
                    padding: "9px 36px",
                    border: "none",
                    cursor: verifying ? "not-allowed" : "pointer",
                    minWidth: "110px",
                    justifyContent: "center",
                  }}
                >
                  {verifying ? (
                    <>
                      <Spinner />
                      Verifying…
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
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
