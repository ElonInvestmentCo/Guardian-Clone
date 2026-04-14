import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createUser } from "@/lib/api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = ["user", "vip", "restricted", "admin"];

export default function CreateUserModal({ onClose, onCreated }: Props) {
  const [email,       setEmail]       = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role,        setRole]        = useState("user");
  const [errorMsg,    setErrorMsg]    = useState("");

  const createMut = useMutation({
    mutationFn: () => createUser(email.trim(), displayName.trim(), role),
    onSuccess: () => {
      onCreated();
    },
    onError: (e: Error) => setErrorMsg(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim() || !displayName.trim()) {
      setErrorMsg("Email and display name are required.");
      return;
    }
    createMut.mutate();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
    }}>
      <div style={{
        background: "white", borderRadius: "10px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#FAFAFA",
        }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#111827" }}>Create New User</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "18px", lineHeight: 1, padding: "2px 4px" }}>×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 10px", border: "1px solid #E5E7EB",
                  borderRadius: "5px", fontSize: "13px", color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Smith"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 10px", border: "1px solid #E5E7EB",
                  borderRadius: "5px", fontSize: "13px", color: "#111827",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "8px 10px", border: "1px solid #E5E7EB",
                  borderRadius: "5px", fontSize: "13px", color: "#111827",
                  cursor: "pointer",
                }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r}</option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <div style={{
                padding: "8px 12px", borderRadius: "4px", fontSize: "12px",
                background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "9px",
                  background: "#F3F4F6", color: "#374151",
                  border: "1px solid #E5E7EB", borderRadius: "5px",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMut.isPending}
                style={{
                  flex: 1, padding: "9px",
                  background: createMut.isPending ? "#9CA3AF" : "#1E3A5F", color: "white",
                  border: "none", borderRadius: "5px",
                  fontSize: "13px", fontWeight: "700",
                  cursor: createMut.isPending ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!createMut.isPending) (e.currentTarget as HTMLElement).style.background = "#162D4A"; }}
                onMouseLeave={(e) => { if (!createMut.isPending) (e.currentTarget as HTMLElement).style.background = "#1E3A5F"; }}
              >
                {createMut.isPending ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
