import { useState } from "react";
import { login } from "@/lib/api";
import { useLoading } from "@/context/LoadingContext";

export default function AdminLoginModal({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { startLoading, stopLoading } = useLoading();

  const basePath = import.meta.env.BASE_URL || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Username is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    startLoading();
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="safee-login">
      <div className="login-card">
        <div className="login-header">
          <img src={`${basePath}logo-white.png`} alt="Guardiian Trading" style={{ height: 32, filter: "brightness(0)" }} />
          <h5 style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", marginTop: 8, marginBottom: 4 }}>
            Guardiian Trading Admin
          </h5>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Sign in to your admin account
          </p>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit} autoComplete="on">
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <i className="bi bi-person" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 15 }} />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Enter username"
                  disabled={loading}
                  className="form-control"
                  style={{
                    paddingLeft: 38,
                    fontSize: 13,
                    borderColor: error && !username ? "#DC3545" : "#dee2e6",
                    borderRadius: 6,
                    height: 42,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <i className="bi bi-lock" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 15 }} />
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  disabled={loading}
                  className="form-control"
                  style={{
                    paddingLeft: 38,
                    paddingRight: 42,
                    fontSize: 13,
                    borderColor: error && !password ? "#DC3545" : "#dee2e6",
                    borderRadius: 6,
                    height: 42,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8",
                  }}
                >
                  <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2" style={{ fontSize: 12, padding: "10px 14px", marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-100"
              style={{
                background: loading ? "#93c5fd" : "#0D6EFD",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                height: 44,
                borderRadius: 6,
                border: "none",
              }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Signing in...
                </span>
              ) : (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-box-arrow-in-right" />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 24, textAlign: "center", lineHeight: 1.5 }}>
            This system is restricted to authorized personnel only.
            <br />All access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
