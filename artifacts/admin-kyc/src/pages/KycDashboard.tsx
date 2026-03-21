import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getKycQueue, type KycUser, type UserStatus } from "@/lib/api";
import { formatDateShort, stepsPercent } from "@/lib/utils";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import UserPanel from "@/components/UserPanel";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "",          label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
  { value: "resubmit",  label: "Resubmit" },
];

const PAGE_SIZE = 25;

type SortKey = "riskScore" | "completedSteps" | "createdAt" | "name";

export default function KycDashboard() {
  const [statusFilter, setStatusFilter] = useState("");
  const [minRisk,      setMinRisk]      = useState(0);
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState<KycUser | null>(null);
  const [sortKey,      setSortKey]      = useState<SortKey>("riskScore");
  const [sortAsc,      setSortAsc]      = useState(false);

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["kyc-queue", page, statusFilter, minRisk],
    queryFn: () => getKycQueue({ page, limit: PAGE_SIZE, status: statusFilter || undefined, minRisk: minRisk || undefined }),
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = (data?.users ?? []).slice().sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "riskScore":      cmp = a.riskScore - b.riskScore; break;
      case "completedSteps": cmp = a.completedSteps - b.completedSteps; break;
      case "createdAt":      cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(); break;
      case "name":           cmp = a.name.localeCompare(b.name); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const onAction = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["kyc-queue"] });
    qc.invalidateQueries({ queryKey: ["user-details"] });
  }, [qc]);

  const Th = ({ label, sortable, sKey }: { label: string; sortable?: boolean; sKey?: SortKey }) => (
    <th
      onClick={sortable && sKey ? () => handleSort(sKey) : undefined}
      style={{
        padding: "10px 14px",
        textAlign: "left",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#6B7280",
        background: "#F9FAFB",
        borderBottom: "1px solid #E5E7EB",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {sortable && sKey && sortKey === sKey && (
        <span style={{ marginLeft: "4px", color: "#2563EB" }}>{sortAsc ? "↑" : "↓"}</span>
      )}
    </th>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", background: "#F0F4F8" }}>

      {/* ── Sidebar nav ───────────────────────────────────────────────── */}
      <div style={{ width: "220px", background: "#1E3A5F", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Guardian</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", letterSpacing: "0.05em" }}>ADMIN CONSOLE</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px 12px", flex: 1 }}>
          {[
            { icon: "⊞", label: "KYC Queue", active: true },
            { icon: "⚠", label: "Risk Events", active: false },
            { icon: "📋", label: "Audit Log", active: false },
          ].map(({ icon, label, active }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "8px 10px", borderRadius: "6px", marginBottom: "2px",
              background: active ? "rgba(255,255,255,0.15)" : "transparent",
              color: active ? "white" : "rgba(255,255,255,0.55)",
              cursor: "pointer", fontSize: "13px",
            }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => { localStorage.removeItem("guardianAdminKey"); window.location.reload(); }}
            style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>KYC Review Queue</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>
              {data ? `${data.total} applicants total` : "Loading…"}
            </p>
          </div>
          <button onClick={() => refetch()} style={{
            padding: "7px 16px", borderRadius: "5px",
            background: "#2563EB", color: "white",
            border: "none", fontSize: "13px", fontWeight: "600",
            cursor: "pointer",
          }}>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: "12px 24px", background: "white", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {/* Status tabs */}
          <div style={{ display: "flex", gap: "4px" }}>
            {STATUS_FILTERS.map(({ value, label }) => (
              <button key={value} onClick={() => { setStatusFilter(value); setPage(1); }} style={{
                padding: "5px 12px", borderRadius: "4px",
                border: `1px solid ${statusFilter === value ? "#2563EB" : "#E5E7EB"}`,
                background: statusFilter === value ? "#EFF6FF" : "transparent",
                color: statusFilter === value ? "#2563EB" : "#6B7280",
                fontSize: "12px", fontWeight: statusFilter === value ? "700" : "400",
                cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "12px", color: "#6B7280" }}>Min risk score</label>
            <select
              value={minRisk}
              onChange={(e) => { setMinRisk(Number(e.target.value)); setPage(1); }}
              style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151" }}
            >
              <option value={0}>All</option>
              <option value={25}>25+</option>
              <option value={50}>50+</option>
              <option value={75}>75+</option>
            </select>
          </div>
        </div>

        {/* Queue table + side panel */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* Table */}
          <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                  <p style={{ color: "#6B7280", fontSize: "13px" }}>Loading KYC queue…</p>
                </div>
              </div>
            ) : isError ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ color: "#DC2626", fontSize: "13px" }}>
                  Failed to load KYC queue. Check your admin key or API server.
                </p>
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
                <p style={{ color: "#6B7280", fontSize: "14px" }}>No applicants match the current filter.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <Th label="Applicant" sortable sKey="name" />
                    <Th label="Status" />
                    <Th label="Risk" sortable sKey="riskScore" />
                    <Th label="Steps" sortable sKey="completedSteps" />
                    <Th label="Registered" sortable sKey="createdAt" />
                    <Th label="" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((user) => {
                    const isActive = selected?.email === user.email;
                    return (
                      <tr
                        key={user.email}
                        onClick={() => setSelected(isActive ? null : user)}
                        style={{
                          borderBottom: "1px solid #E5E7EB",
                          background: isActive ? "#EFF6FF" : "white",
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "white"; }}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: "600", color: "#111827" }}>{user.name}</div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{user.email}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <StatusBadge status={user.status} />
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <RiskBadge level={user.riskLevel} score={user.riskScore} />
                            {user.flagCount > 0 && (
                              <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "64px", height: "4px", borderRadius: "2px", background: "#E5E7EB", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${stepsPercent(user.completedSteps, user.totalSteps)}%`, background: "#2563EB", borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "11px", color: "#6B7280" }}>{user.completedSteps}/{user.totalSteps}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: "12px" }}>
                          {formatDateShort(user.createdAt)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <span style={{ fontSize: "11px", color: isActive ? "#2563EB" : "#9CA3AF", fontWeight: "600" }}>
                            {isActive ? "Hide ←" : "Review →"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "16px", borderTop: "1px solid #E5E7EB" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid #E5E7EB", background: page === 1 ? "#F9FAFB" : "white", color: page === 1 ? "#9CA3AF" : "#374151", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer" }}
                >← Prev</button>
                <span style={{ fontSize: "12px", color: "#6B7280" }}>Page {data.page} of {data.pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid #E5E7EB", background: page === data.pages ? "#F9FAFB" : "white", color: page === data.pages ? "#9CA3AF" : "#374151", fontSize: "12px", cursor: page === data.pages ? "not-allowed" : "pointer" }}
                >Next →</button>
              </div>
            )}
          </div>

          {/* Side panel */}
          {selected && (
            <UserPanel
              user={selected}
              onClose={() => setSelected(null)}
              onAction={onAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}
