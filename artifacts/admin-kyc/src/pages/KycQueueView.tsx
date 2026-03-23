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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>KYC Review Queue</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", marginTop: "1px" }}>
            {isLoading ? "Loading…" : `${data?.total ?? 0} applicants total`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            padding: "7px 16px", borderRadius: "5px",
            background: isFetching ? "#9CA3AF" : "#1E3A5F", color: "white",
            border: "none", fontSize: "12px", fontWeight: "600",
            cursor: isFetching ? "default" : "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { if (!isFetching) (e.currentTarget as HTMLElement).style.background = "#162D4A"; }}
          onMouseLeave={(e) => { if (!isFetching) (e.currentTarget as HTMLElement).style.background = "#1E3A5F"; }}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Filters (horizontally scrollable on mobile) ─────────────────── */}
      <div style={{
        padding: "10px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
        flexShrink: 0, overflowX: "auto",
      }}>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              style={{
                padding: "5px 11px", borderRadius: "4px",
                border: `1px solid ${statusFilter === value ? "#2563EB" : "#E5E7EB"}`,
                background: statusFilter === value ? "#EFF6FF" : "transparent",
                color: statusFilter === value ? "#2563EB" : "#6B7280",
                fontSize: "12px", fontWeight: statusFilter === value ? "700" : "400",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "11px", color: "#6B7280", whiteSpace: "nowrap" }}>Min risk</label>
          <select
            value={minRisk}
            onChange={(e) => { setMinRisk(Number(e.target.value)); setPage(1); }}
            style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid #E5E7EB", fontSize: "12px", color: "#374151", cursor: "pointer" }}
          >
            <option value={0}>All</option>
            <option value={25}>25+</option>
            <option value={50}>50+</option>
            <option value={75}>75+</option>
          </select>
        </div>
      </div>

      {/* ── Table + side panel ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* Table scroll area */}
        <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <Th label="Applicant"  sortable sKey="name"           sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                      <Th label="Status" />
                      <Th label="Risk"       sortable sKey="riskScore"      sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                      <Th label="Steps"      sortable sKey="completedSteps" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                      <Th label="Registered" sortable sKey="createdAt"      sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                      <Th label="" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((user) => (
                      <UserRow
                        key={user.email}
                        user={user}
                        isActive={selected?.email === user.email}
                        onClick={() => setSelected(selected?.email === user.email ? null : user)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="block sm:hidden p-4 space-y-3">
                {sorted.map((user) => (
                  <MobileUserCard
                    key={user.email}
                    user={user}
                    isActive={selected?.email === user.email}
                    onClick={() => setSelected(selected?.email === user.email ? null : user)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "16px", borderTop: "1px solid #E5E7EB" }}>
                  <PaginationBtn
                    label="← Prev"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  />
                  <span style={{ fontSize: "12px", color: "#6B7280" }}>Page {data.page} of {data.pages}</span>
                  <PaginationBtn
                    label="Next →"
                    disabled={page === data.pages}
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop side panel */}
        {selected && (
          <div className="hidden md:flex" style={{ width: "380px", flexShrink: 0, height: "100%" }}>
            <UserPanel user={selected} onClose={() => setSelected(null)} onAction={onAction} />
          </div>
        )}
      </div>

      {/* Mobile full-screen bottom sheet */}
      {selected && (
        <div className="fixed inset-0 z-40 md:hidden flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div
            className="relative bg-white rounded-t-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            <UserPanel user={selected} onClose={() => setSelected(null)} onAction={onAction} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────────────────────

function Th({
  label, sortable, sKey, sortKey, sortAsc, onSort,
}: {
  label: string; sortable?: boolean; sKey?: SortKey;
  sortKey?: SortKey; sortAsc?: boolean; onSort?: (k: SortKey) => void;
}) {
  const active = sortable && sKey && sortKey === sKey;
  return (
    <th
      onClick={sortable && sKey && onSort ? () => onSort(sKey) : undefined}
      style={{
        padding: "10px 14px", textAlign: "left",
        fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
        textTransform: "uppercase", color: "#6B7280",
        background: "#F9FAFB", borderBottom: "1px solid #E5E7EB",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none", whiteSpace: "nowrap",
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => { if (sortable) (e.currentTarget as HTMLElement).style.color = "#374151"; }}
      onMouseLeave={(e) => { if (sortable) (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
    >
      {label}
      {active && <span style={{ marginLeft: "4px", color: "#2563EB" }}>{sortAsc ? "↑" : "↓"}</span>}
    </th>
  );
}

function UserRow({ user, isActive, onClick }: { user: KycUser; isActive: boolean; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid #E5E7EB",
        background: isActive ? "#EFF6FF" : "white",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "white"; }}
    >
      <td style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: "600", color: "#111827", whiteSpace: "nowrap" }}>{user.name}</div>
        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{user.email}</div>
      </td>
      <td style={{ padding: "12px 14px" }}><StatusBadge status={user.status} /></td>
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
          <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "#E5E7EB", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stepsPercent(user.completedSteps, user.totalSteps)}%`, background: "#2563EB", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "11px", color: "#6B7280", whiteSpace: "nowrap" }}>{user.completedSteps}/{user.totalSteps}</span>
        </div>
      </td>
      <td style={{ padding: "12px 14px", color: "#6B7280", fontSize: "12px", whiteSpace: "nowrap" }}>
        {formatDateShort(user.createdAt)}
      </td>
      <td style={{ padding: "12px 14px", textAlign: "right" }}>
        <span style={{ fontSize: "11px", color: isActive ? "#2563EB" : "#9CA3AF", fontWeight: "600", whiteSpace: "nowrap" }}>
          {isActive ? "Hide ←" : "Review →"}
        </span>
      </td>
    </tr>
  );
}

function MobileUserCard({ user, isActive, onClick }: { user: KycUser; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", gap: "12px", alignItems: "flex-start",
        width: "100%", padding: "14px 16px", borderRadius: "8px",
        background: isActive ? "#EFF6FF" : "white",
        border: `1px solid ${isActive ? "#93C5FD" : "#E5E7EB"}`,
        cursor: "pointer", textAlign: "left", transition: "all 0.12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{user.name}</div>
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "8px" }}>{user.email}</div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          <StatusBadge status={user.status} />
          <RiskBadge level={user.riskLevel} score={user.riskScore} />
        </div>
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "80px", height: "4px", borderRadius: "2px", background: "#E5E7EB", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${stepsPercent(user.completedSteps, user.totalSteps)}%`, background: "#2563EB", borderRadius: "2px" }} />
          </div>
          <span style={{ fontSize: "10px", color: "#6B7280" }}>{user.completedSteps}/{user.totalSteps} steps</span>
        </div>
      </div>
      <span style={{ fontSize: "11px", color: isActive ? "#2563EB" : "#9CA3AF", fontWeight: "600", flexShrink: 0 }}>
        {isActive ? "Hide" : "Review →"}
      </span>
    </button>
  );
}

function PaginationBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "5px 12px", borderRadius: "4px",
        border: "1px solid #E5E7EB",
        background: disabled ? "#F9FAFB" : "white",
        color: disabled ? "#9CA3AF" : "#374151",
        fontSize: "12px", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "white"; }}
    >
      {label}
    </button>
  );
}

// ── Shared state views ─────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Loading KYC queue…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>Failed to load KYC queue.</p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: "5px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>✓</div>
      <p style={{ color: "#374151", fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>No applicants match the current filter.</p>
      <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>Try changing the status filter or minimum risk score.</p>
    </div>
  );
}
