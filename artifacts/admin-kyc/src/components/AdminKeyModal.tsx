import { useState } from "react";
import { login } from "@/lib/api";

export default function AdminLoginModal({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Username is required"); return; }
    if (!password)        { setError("Password is required"); return; }

    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#eef2f7",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "white",
          borderRadius: "10px",
          boxShadow: "0 6px 32px rgba(0,0,0,0.13)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ background: "#1e3a5f", padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            <div
              style={{
                width: "38px", height: "38px", borderRadius: "7px",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "16px", letterSpacing: "0.01em" }}>
                Guardian Admin
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "1px" }}>
                Secure KYC Dashboard Access
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "30px 28px" }}>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px", lineHeight: "1.5" }}>
            Sign in with your administrator credentials to access the KYC review dashboard.
          </p>

          <form onSubmit={handleSubmit} autoComplete="on">
            {/* Username */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}
              >
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter username"
                disabled={loading}
                style={{
                  width: "100%", padding: "9px 12px",
                  border: `1px solid ${error && !username ? "#e53e3e" : "#d1d5db"}`,
                  borderRadius: "5px", fontSize: "13px",
                  background: "#f9fafb", color: "#111",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  disabled={loading}
                  style={{
                    width: "100%", padding: "9px 40px 9px 12px",
                    border: `1px solid ${error && !password ? "#e53e3e" : "#d1d5db"}`,
                    borderRadius: "5px", fontSize: "13px",
                    background: "#f9fafb", color: "#111",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: "10px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", padding: "2px",
                    color: "#9ca3af",
                    display: "flex", alignItems: "center",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "5px", padding: "10px 12px",
                  marginBottom: "16px",
                  display: "flex", alignItems: "flex-start", gap: "8px",
                }}
              >
                <svg width="15" height="15" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "1px" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: "12px", color: "#dc2626", lineHeight: "1.4" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                borderRadius: "5px",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "white", border: "none",
                fontSize: "14px", fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>

          <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "20px", textAlign: "center" }}>
            This system is restricted to authorized personnel only.
            <br />All access is monitored and logged.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
