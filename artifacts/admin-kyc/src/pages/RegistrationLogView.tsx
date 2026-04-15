import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { getRegistrationLog, type RegistrationLogEntry } from "@/lib/api";
import { useAdminRealtime } from "@/hooks/useAdminRealtime";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(d);
  } catch { return iso; }
}

function downloadCSV(entries: RegistrationLogEntry[]) {
  const headers = ["ID", "Email", "Display Name", "Referrer", "Product", "Registration Type", "IP Address", "Registered At"];
  const rows = entries.map(e => [
    e.id,
    e.email,
    e.display_name ?? "",
    e.referrer ?? "",
    e.product ?? "",
    e.registration_type ?? "",
    e.ip_address ?? "",
    formatDate(e.registered_at),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RegistrationLogView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [newCount, setNewCount] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-log"],
    queryFn: () => getRegistrationLog(),
    staleTime: 60_000,
  });

  const handleNewRegistration = useCallback(() => {
    setNewCount(c => c + 1);
    queryClient.invalidateQueries({ queryKey: ["registration-log"] });
  }, [queryClient]);

  const { status } = useAdminRealtime({ onNewRegistration: handleNewRegistration });

  const entries = data?.entries ?? [];
  const filtered = search
    ? entries.filter(e =>
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.referrer ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (e.product ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B" }}>
          Registration Log
        </h5>

        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: status === "connected" ? "#F0FDF4" : "#F9FAFB",
          color: status === "connected" ? "#16A34A" : "#9CA3AF",
          border: `1px solid ${status === "connected" ? "#BBF7D0" : "#E5E7EB"}`,
          borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: status === "connected" ? "#16A34A" : "#D1D5DB",
            animation: status === "connected" ? "pulse 2s infinite" : "none",
          }} />
          {status === "connected" ? "Live" : status === "connecting" ? "Connecting..." : "Disconnected"}
        </span>

        {newCount > 0 && (
          <span style={{
            background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
            borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
          }}>
            +{newCount} new since page load
          </span>
        )}

        <div style={{ flex: 1 }} />

        <input
          type="text"
          placeholder="Search by email, referrer, product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 6, border: "1px solid #E2E8F0",
            fontSize: 13, minWidth: 220, background: "#fff",
          }}
        />

        <button
          onClick={() => downloadCSV(filtered)}
          disabled={filtered.length === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: "#0D6EFD", color: "#fff", border: "none", cursor: "pointer",
            opacity: filtered.length === 0 ? 0.5 : 1,
          }}
        >
          <i className="bi bi-download" />
          Export CSV
        </button>
      </div>

      <div className="card-safee">
        <div className="card-header">
          <span>All Registrations</span>
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
              <div className="spinner-border spinner-border-sm" />
              <div style={{ marginTop: 8, fontSize: 13 }}>Loading registrations...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 48, color: "#DC2626", fontSize: 13 }}>
              Failed to load registrations
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8", fontSize: 13 }}>
              {search ? "No matching registrations" : "No registrations yet"}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-safee">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Registered At</th>
                    <th>Email</th>
                    <th>Display Name</th>
                    <th>Referrer</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr key={entry.id ?? i}>
                      <td style={{ color: "#9CA3AF", fontSize: 12 }}>{entry.id}</td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "#374151", fontWeight: 500 }}>
                        {formatDate(entry.registered_at)}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{entry.email}</td>
                      <td style={{ fontSize: 13, color: "#374151" }}>{entry.display_name || "—"}</td>
                      <td style={{ fontSize: 13, color: "#374151" }}>{entry.referrer || "—"}</td>
                      <td style={{ fontSize: 13, color: "#374151" }}>{entry.product || "—"}</td>
                      <td style={{ fontSize: 13, color: "#374151" }}>{entry.registration_type || "—"}</td>
                      <td style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>
                        {entry.ip_address || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
