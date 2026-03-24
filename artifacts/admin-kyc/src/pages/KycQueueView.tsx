import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getKycQueue, type KycUser } from "@/lib/api";
import { formatDateShort, stepsPercent } from "@/lib/utils";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import UserPanel from "@/components/UserPanel";

const STATUS_FILTERS = [
  { value: "",          label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "approved",  label: "Approved" },
  { value: "rejected",  label: "Rejected" },
  { value: "resubmit",  label: "Resubmit" },
  { value: "suspended", label: "Suspended" },
  { value: "banned",    label: "Banned" },
];

const PAGE_SIZE = 25;
type SortKey = "riskScore" | "completedSteps" | "createdAt" | "name";

export default function KycQueueView() {
  const [statusFilter, setStatusFilter] = useState("");
  const [minRisk,      setMinRisk]      = useState(0);
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState<KycUser | null>(null);
  const [sortKey,      setSortKey]      = useState<SortKey>("riskScore");
  const [sortAsc,      setSortAsc]      = useState(false);

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>KYC Review Queue</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${data?.total ?? 0} applicants total`}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            <i className="bi bi-arrow-clockwise me-1" />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <div className="btn-group btn-group-sm">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                className={`btn ${statusFilter === value ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => { setStatusFilter(value); setPage(1); }}
                style={{ fontSize: 12 }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 11, color: "#64748B" }}>Min risk</label>
            <select
              className="form-select form-select-sm"
              value={minRisk}
              onChange={(e) => { setMinRisk(Number(e.target.value)); setPage(1); }}
              style={{ width: 80, fontSize: 12 }}
            >
              <option value={0}>All</option>
              <option value={25}>25+</option>
              <option value={50}>50+</option>
              <option value={75}>75+</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <table className="table-safee">
                <thead>
                  <tr>
                    <ThSort label="Applicant" sKey="name" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <th>Status</th>
                    <ThSort label="Risk" sKey="riskScore" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <ThSort label="Steps" sKey="completedSteps" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <ThSort label="Registered" sKey="createdAt" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((user) => (
                    <tr
                      key={user.email}
                      onClick={() => setSelected(selected?.email === user.email ? null : user)}
                      style={{
                        cursor: "pointer",
                        background: selected?.email === user.email ? "#EFF6FF" : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{user.email}</div>
                      </td>
                      <td><StatusBadge status={user.status} /></td>
                      <td>
                        <RiskBadge level={user.riskLevel} score={user.riskScore} />
                        {user.flagCount > 0 && (
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                            {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 4, borderRadius: 2, background: "#E5E7EB", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${stepsPercent(user.completedSteps, user.totalSteps)}%`, background: "#0D6EFD", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{user.completedSteps}/{user.totalSteps}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#64748B" }}>{formatDateShort(user.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: selected?.email === user.email ? "#0D6EFD" : "#94A3B8", fontWeight: 600 }}>
                          {selected?.email === user.email ? "Hide ←" : "Review →"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data && data.pages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: 16, borderTop: "1px solid #e5e7eb" }}>
                  <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Prev
                  </button>
                  <span style={{ fontSize: 12, color: "#64748B" }}>Page {data.page} of {data.pages}</span>
                  <button className="btn btn-outline-secondary btn-sm" disabled={page === data.pages} onClick={() => setPage((p) => Math.min(data.pages, p + 1))}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selected && (
          <div className="d-none d-lg-flex" style={{ width: 380, flexShrink: 0, height: "100%" }}>
            <UserPanel user={selected} onClose={() => setSelected(null)} onAction={onAction} />
          </div>
        )}
      </div>

      {selected && (
        <div
          className="d-lg-none"
          style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: "16px 16px 0 0", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <UserPanel user={selected} onClose={() => setSelected(null)} onAction={onAction} />
          </div>
        </div>
      )}
    </div>
  );
}

function ThSort({ label, sKey, sortKey, sortAsc, onSort }: {
  label: string; sKey: SortKey; sortKey: SortKey; sortAsc: boolean; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === sKey;
  return (
    <th onClick={() => onSort(sKey)} style={{ cursor: "pointer" }}>
      {label}
      {active && <span style={{ marginLeft: 4, color: "#0D6EFD" }}>{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 12 }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Loading KYC queue…</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 32 }} />
      <p style={{ color: "#DC3545", fontSize: 13, margin: "12px 0" }}>Failed to load KYC queue.</p>
      <button className="btn btn-outline-primary btn-sm" onClick={onRetry}>Try Again</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <i className="bi bi-check-circle text-success" style={{ fontSize: 40 }} />
      <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>No applicants match the current filter.</p>
      <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Try changing the status filter or minimum risk score.</p>
    </div>
  );
}
