import { useState, useEffect, useCallback } from "react";
import { getFundRequests, approveFundRequest, rejectFundRequest, type FundRequest } from "@/lib/api";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  deposit:    { bg: "#d1fae5", color: "#065f46" },
  withdrawal: { bg: "#fef3c7", color: "#92400e" },
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#d1fae5", color: "#065f46" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

function Pill({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: "inline-block",
      background: style.bg,
      color: style.color,
      fontSize: "11px",
      fontWeight: 700,
      padding: "2px 10px",
      borderRadius: "999px",
      textTransform: "capitalize",
      letterSpacing: "0.03em",
    }}>{label}</span>
  );
}

export default function FundRequestsView() {
  const [requests, setRequests]           = useState<FundRequest[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filter, setFilter]               = useState<StatusFilter>("all");
  const [search, setSearch]               = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFundRequests(filter === "all" ? undefined : filter);
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load fund requests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveFundRequest(id);
      showToast("Fund request approved — user balance updated.", true);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Approval failed", false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await rejectFundRequest(id);
      showToast("Fund request rejected.", true);
      await load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Rejection failed", false);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.email.toLowerCase().includes(q) || (r.note ?? "").toLowerCase().includes(q);
  });

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.ok ? "#198754" : "#DC3545", color: "#fff",
          padding: "12px 20px", borderRadius: "10px", fontSize: "13px",
          fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}>
          <i className={`bi ${toast.ok ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} style={{ marginRight: "8px" }} />
          {toast.msg}
        </div>
      )}

      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
              Fund Requests
              {pendingCount > 0 && (
                <span style={{
                  background: "#FFC107", color: "#000",
                  fontSize: "11px", fontWeight: 700,
                  padding: "1px 8px", borderRadius: "999px",
                }}>
                  {pendingCount} pending
                </span>
              )}
            </h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {loading ? "Loading…" : `${filtered.length} of ${requests.length} requests`}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1" />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search by email or note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>
          <select
            className="form-select form-select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
            style={{ width: 150, fontSize: 12 }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
            <i className="bi bi-exclamation-triangle-fill" />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner-border text-primary" role="status" />
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 12 }}>Loading fund requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748B" }}>
            <i className="bi bi-cash-coin" style={{ fontSize: 40, display: "block", marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontWeight: 600, marginBottom: 4, color: "#1E293B" }}>No fund requests</p>
            <p style={{ fontSize: 13 }}>{search ? "No results match your search." : "No requests found for this status filter."}</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 16px" }}>User</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Type</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Amount</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Status</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Note</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Submitted</th>
                    <th style={{ color: "#64748B", fontWeight: 600, padding: "10px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#374151" }}>{r.email}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Pill label={r.type} style={TYPE_COLOR[r.type] ?? TYPE_COLOR.deposit} />
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        {r.currency} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <Pill label={r.status} style={STATUS_COLOR[r.status] ?? STATUS_COLOR.pending} />
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748B", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.note || <em style={{ opacity: 0.4 }}>—</em>}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                        <span title={r.createdAt}>{timeAgo(r.createdAt)}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {r.status === "pending" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-success btn-sm"
                              disabled={actionLoading === r.id}
                              onClick={() => handleApprove(r.id)}
                            >
                              {actionLoading === r.id
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : <><i className="bi bi-check-lg me-1" />Approve</>
                              }
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={actionLoading === r.id}
                              onClick={() => handleReject(r.id)}
                            >
                              {actionLoading === r.id
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : <><i className="bi bi-x-lg me-1" />Reject</>
                              }
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>
                            {r.reviewedAt ? `Reviewed ${timeAgo(r.reviewedAt)}` : "Reviewed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
