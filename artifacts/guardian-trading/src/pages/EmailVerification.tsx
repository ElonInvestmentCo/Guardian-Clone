import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

export default function EmailVerification() {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("verificationEmail") || "";
    setEmail(storedEmail);
    if (!storedEmail) {
      navigate("/signup");
    }
  }, [navigate]);

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
        sessionStorage.removeItem("verificationCode");
        sessionStorage.removeItem("verificationEmail");
        navigate("/general-details");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 400 && data.error?.toLowerCase().includes("expired")) {
        setError("Your code has expired. Please go back and request a new one.");
      } else if (res.status === 400) {
        const localCode = sessionStorage.getItem("verificationCode") || "";
        if (localCode && trimmed === localCode) {
          sessionStorage.removeItem("verificationCode");
          sessionStorage.removeItem("verificationEmail");
          navigate("/general-details");
          return;
        }
        setError("Invalid verification code. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      const localCode = sessionStorage.getItem("verificationCode") || "";
      if (localCode && inputCode.trim() === localCode) {
        sessionStorage.removeItem("verificationCode");
        sessionStorage.removeItem("verificationEmail");
        navigate("/general-details");
        return;
      }
      setError("Unable to verify. Please check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2}).*(@.*)$/, (_, a, b) => `${a}${"*".repeat(Math.max(0, email.indexOf("@") - 2))}${b}`)
    : "";

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
            boxShadow: "0 2px 18px rgba(0,0,0,0.18)",
            border: "1px solid #ddd",
          }}
        >
          {/* Blue top stripe */}
          <div style={{ height: "4px", background: "#3a7bd5" }} />

          {/* Header */}
          <div
            className="flex items-center px-5 py-4"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ background: "#3a7bd5" }}
              aria-label="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="flex-1 text-center font-semibold pr-8"
              style={{ color: "#3a7bd5", fontSize: "18px" }}
            >
              Email Authentication
            </h1>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Confirmation message */}
            <div className="text-center mb-6">
              <p className="text-sm mb-1" style={{ color: "#555" }}>
                A verification code was sent to
              </p>
              <p className="text-sm font-semibold" style={{ color: "#3a7bd5" }}>
                {maskedEmail || email}
              </p>
              <p className="text-xs mt-2" style={{ color: "#999" }}>
                Enter the code below to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
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
                  className="w-full text-sm focus:outline-none text-center tracking-widest"
                  style={{
                    background: "#f2f2f2",
                    border: "none",
                    borderBottom: "2px solid #3a7bd5",
                    borderRadius: "3px 3px 0 0",
                    padding: "12px 12px",
                    color: "#333",
                    fontSize: "16px",
                    letterSpacing: "0.2em",
                  }}
                />
                {error && (
                  <p className="mt-2 text-xs text-center" style={{ color: "#e53e3e" }}>{error}</p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={verifying}
                  className="text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
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
