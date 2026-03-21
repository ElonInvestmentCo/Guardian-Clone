import { useState } from "react";
import { saveAdminKey } from "@/lib/api";

export default function AdminKeyModal({ onSaved }: { onSaved: () => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) { setError("Please enter an admin key"); return; }
    saveAdminKey(key.trim());
    onSaved();
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f4f8" }}>
      <div style={{
        width: "400px",
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "#1e3a5f", padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "6px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>Guardian Admin</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px" }}>KYC Dashboard</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "28px" }}>
          <p style={{ fontSize: "13px", color: "#555", marginBottom: "20px" }}>
            Enter your admin API key to access the KYC review queue. If no key is configured, leave blank.
          </p>
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: "12px", color: "#444", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Admin Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(""); }}
              placeholder="sk_admin_…"
              style={{
                width: "100%", padding: "9px 12px",
                border: `1px solid ${error ? "#e53e3e" : "#ccd3da"}`,
                borderRadius: "4px", fontSize: "13px",
                background: "#f8fafc", color: "#333",
                outline: "none", boxSizing: "border-box",
              }}
            />
            {error && <p style={{ color: "#e53e3e", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
            <button
              type="submit"
              style={{
                marginTop: "16px", width: "100%",
                padding: "10px", borderRadius: "4px",
                background: "#2563eb", color: "white",
                border: "none", fontSize: "14px",
                fontWeight: "600", cursor: "pointer",
              }}
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
