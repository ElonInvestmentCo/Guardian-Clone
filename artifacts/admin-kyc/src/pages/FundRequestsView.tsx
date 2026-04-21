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

export default function FundRequestsView() {
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

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
      showToast("Fund request approved and balance updated.", true);
      load();
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
      load();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Rejection failed", false);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    return r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.note ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const pending = requests.filter(r => r.status === "pending").length;

  return (
    <div className="safee-page-content">
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.ok ? "#198754" : "#DC3545", color: "#fff",
          padding: "12px 20px", borderRadius: "10px", fontSize: "13px",
          fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          transition: "opacity 0.3s",
        }}>
          <i className={`bi ${toast.ok ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} style={{ marginRight: "8px" }} />
          {toast.msg}
        </div>
      )}

      <div className="safee-page-header">
        <div className="header-left">
          <h1 className="safee-page-title">Fund Requests</h1>
          <p className="safee-page-subtitle">
            Review and action user deposit &amp; withdrawal requests
            {pending > 0 && <span className="safee-badge ms-2" style={{ background: "#FFC107", color: "#000" }}>{pending} pending</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="safee-btn safee-btn-outline" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="safee-filters-bar">
        <input
          className="safee-search"
          placeholder="Search by email or note..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="safee-filter-tabs">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`safee-filter-tab${filter === f ? " active" : ""}`} style={{ textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="safee-alert safee-alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
        </div>
      )}

      {loading ? (
        <div className="safee-loading-state">
          <div className="safee-spinner" />
          <p>Loading fund requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="safee-empty-state">
          <i className="bi bi-cash-coin" />
          <h3>No fund requests</h3>
          <p>{search ? "No results match your search." : "No fund requests found for this filter."}</p>
        </div>
      ) : (
        <div className="safee-table-wrapper">
          <table className="safee-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Note</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="safee-mono" style={{ fontSize: "12px" }}>{r.email}</span>
                  </td>
                  <td>
                    <span className={`safee-badge ${r.type === "deposit" ? "badge-success" : "badge-warning"}`}>
                      <i className={`bi ${r.type === "deposit" ? "bi-arrow-down-circle" : "bi-arrow-up-circle"} me-1`} />
                      {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>
                      {r.currency} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td>
                    <span className={`safee-badge ${r.status === "pending" ? "badge-warning" : r.status === "approved" ? "badge-success" : "badge-danger"}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "var(--safee-text-sub)" }}>
                      {r.note || <em style={{ opacity: 0.5 }}>—</em>}
                    </span>
                  </td>
                  <td>
                    <span title={r.createdAt} style={{ fontSize: "12px", color: "var(--safee-text-sub)" }}>
                      {timeAgo(r.createdAt)}
                    </span>
                  </td>
                  <td>
                    {r.status === "pending" ? (
                      <div className="d-flex gap-2">
                        <button
                          className="safee-btn safee-btn-sm safee-btn-success"
                          disabled={actionLoading === r.id}
                          onClick={() => handleApprove(r.id)}
                        >
                          {actionLoading === r.id ? <span className="safee-spinner-sm" /> : <i className="bi bi-check-lg me-1" />}
                          Approve
                        </button>
                        <button
                          className="safee-btn safee-btn-sm safee-btn-danger"
                          disabled={actionLoading === r.id}
                          onClick={() => handleReject(r.id)}
                        >
                          {actionLoading === r.id ? <span className="safee-spinner-sm" /> : <i className="bi bi-x-lg me-1" />}
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "var(--safee-text-muted)" }}>
                        {r.reviewedAt ? `Reviewed ${timeAgo(r.reviewedAt)}` : "Reviewed"}
                        {r.reviewedBy && <span> by {r.reviewedBy}</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
