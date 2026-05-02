import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFundRequests,
  approveFundRequest,
  rejectFundRequest,
  type FundRequest,
  type FundRequestStatus,
} from "@/lib/api";
import { toast } from "@/lib/guardian-toast";

function formatAmount(amount: string): string {
  const n = parseFloat(amount);
  return isNaN(n) ? amount : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function TypeBadge({ type }: { type: "deposit" | "withdrawal" }) {
  const isDeposit = type === "deposit";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: isDeposit ? "rgba(25,135,84,0.1)" : "rgba(220,53,69,0.1)",
      color: isDeposit ? "#198754" : "#DC3545",
      border: `1px solid ${isDeposit ? "rgba(25,135,84,0.2)" : "rgba(220,53,69,0.2)"}`,
    }}>
      <i className={`bi ${isDeposit ? "bi-arrow-down-circle-fill" : "bi-arrow-up-circle-fill"}`} style={{ fontSize: 11 }} />
      {isDeposit ? "Deposit" : "Withdrawal"}
    </span>
  );
}

function StatusBadge({ status }: { status: FundRequestStatus }) {
  const map: Record<FundRequestStatus, { bg: string; color: string; border: string; label: string }> = {
    pending:  { bg: "rgba(255,193,7,0.1)",  color: "#997404", border: "rgba(255,193,7,0.25)",   label: "Pending" },
    approved: { bg: "rgba(25,135,84,0.1)",  color: "#198754", border: "rgba(25,135,84,0.2)",    label: "Approved" },
    rejected: { bg: "rgba(220,53,69,0.1)",  color: "#DC3545", border: "rgba(220,53,69,0.2)",    label: "Rejected" },
  };
  const s = map[status];
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 600, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

type FilterTab = "all" | FundRequestStatus;

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

interface ActionModalProps {
  request: FundRequest;
  mode: "approve" | "reject";
  onClose: () => void;
  onConfirm: (adminNote: string) => void;
  isPending: boolean;
}

function ActionModal({ request, mode, onClose, onConfirm, isPending }: ActionModalProps) {
  const [note, setNote] = useState("");
  const isApprove = mode === "approve";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--card-bg, #fff)", borderRadius: 16, width: "100%", maxWidth: 460,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden",
      }}>
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border-color, #e5e7eb)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: isApprove ? "rgba(25,135,84,0.12)" : "rgba(220,53,69,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isApprove ? "#198754" : "#DC3545", fontSize: 16,
            }}>
              <i className={`bi ${isApprove ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary, #1a202c)" }}>
                {isApprove ? "Approve" : "Reject"} Request
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #64748B)", marginTop: 1 }}>
                {request.email}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted, #64748B)", fontSize: 18, lineHeight: 1,
            padding: 4,
          }}>
            <i className="bi bi-x" />
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{
            background: "var(--table-hover, #f8f9fc)", borderRadius: 10,
            padding: "14px 16px", marginBottom: 18,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #64748B)", fontWeight: 500, marginBottom: 2 }}>TYPE</div>
              <TypeBadge type={request.type} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted, #64748B)", fontWeight: 500, marginBottom: 2 }}>AMOUNT</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary, #1a202c)" }}>
                {formatAmount(request.amount)}
              </div>
            </div>
            {request.note && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted, #64748B)", fontWeight: 500, marginBottom: 2 }}>USER NOTE</div>
                <div style={{ fontSize: 13, color: "var(--text-primary, #1a202c)" }}>{request.note}</div>
              </div>
            )}
          </div>

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary, #1a202c)", marginBottom: 6 }}>
            Admin Note <span style={{ color: "var(--text-muted, #64748B)", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={isApprove ? "Reason for approval..." : "Reason for rejection..."}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: 8, padding: "10px 12px",
              fontSize: 13, resize: "vertical",
              background: "var(--input-bg, #fff)",
              color: "var(--text-primary, #1a202c)",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border-color, #e5e7eb)",
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note.trim())}
            disabled={isPending}
            className={`btn btn-sm ${isApprove ? "btn-success" : "btn-danger"}`}
            style={{ minWidth: 110 }}
          >
            {isPending ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                {isApprove ? "Approving..." : "Rejecting..."}
              </span>
            ) : (
              <>
                <i className={`bi ${isApprove ? "bi-check-lg" : "bi-x-lg"}`} />
                {" "}{isApprove ? "Confirm Approve" : "Confirm Reject"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FundRequestsView() {
  const [filterTab, setFilterTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ request: FundRequest; mode: "approve" | "reject" } | null>(null);
  const qc = useQueryClient();

  const statusParam = filterTab === "all" ? undefined : filterTab;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["fund-requests", filterTab],
    queryFn: () => getFundRequests(statusParam),
    staleTime: 20_000,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => approveFundRequest(id, note || undefined),
    onSuccess: () => {
      toast.success("Fund request approved", "Balance updated and user notified");
      qc.invalidateQueries({ queryKey: ["fund-requests"] });
      setModal(null);
    },
    onError: (e: Error) => toast.error("Approval failed", e.message),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => rejectFundRequest(id, note || undefined),
    onSuccess: () => {
      toast.info("Fund request rejected", "User has been notified");
      qc.invalidateQueries({ queryKey: ["fund-requests"] });
      setModal(null);
    },
    onError: (e: Error) => toast.error("Rejection failed", e.message),
  });

  const requests = data?.requests ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return requests;
    return requests.filter(r =>
      r.email.toLowerCase().includes(q) ||
      r.type.includes(q) ||
      r.note?.toLowerCase().includes(q) ||
      r.adminNote?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const approvedTotal = requests.filter(r => r.status === "approved").reduce((s, r) => s + parseFloat(r.amount), 0);
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  const handleConfirm = (adminNote: string) => {
    if (!modal) return;
    const payload = { id: modal.request.id, note: adminNote };
    if (modal.mode === "approve") approveMut.mutate(payload);
    else rejectMut.mutate(payload);
  };

  const isModalPending = approveMut.isPending || rejectMut.isPending;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1a202c)", margin: 0 }}>
            Fund Requests
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted, #64748B)", margin: "4px 0 0" }}>
            Review and action deposit and withdrawal requests
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <i className={`bi bi-arrow-clockwise${isFetching ? " spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Pending",         value: pendingCount,  color: "#997404", bg: "rgba(255,193,7,0.08)", icon: "bi-hourglass-split" },
          { label: "Approved Volume", value: `$${approvedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#198754", bg: "rgba(25,135,84,0.08)", icon: "bi-check-circle" },
          { label: "Rejected",        value: rejectedCount, color: "#DC3545", bg: "rgba(220,53,69,0.08)", icon: "bi-x-circle" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "14px 18px", borderRadius: 12,
            background: s.bg, border: `1px solid ${s.color}22`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 20, color: s.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary, #1a202c)", lineHeight: 1.2, marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Filter tabs */}
        <div style={{
          display: "flex", background: "var(--table-hover, #f1f2f7)",
          borderRadius: 8, padding: 3, gap: 2,
        }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterTab(tab.value)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                background: filterTab === tab.value ? "var(--card-bg, #fff)" : "transparent",
                color: filterTab === tab.value ? "var(--text-primary, #1a202c)" : "var(--text-muted, #64748B)",
                boxShadow: filterTab === tab.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <i className="bi bi-search" style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted, #94A3B8)", fontSize: 13, pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Search by email or note..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", paddingLeft: 30, paddingRight: 10,
              padding: "7px 10px 7px 30px",
              border: "1px solid var(--border-color, #e5e7eb)",
              borderRadius: 8, fontSize: 13,
              background: "var(--input-bg, #fff)",
              color: "var(--text-primary, #1a202c)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted, #64748B)", fontWeight: 500 }}>
          {filtered.length} {filtered.length === 1 ? "request" : "requests"}
        </div>
      </div>

      {/* Table */}
      <div className="card-safee" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted, #94A3B8)" }}>
            <div className="spinner-border" style={{ width: 28, height: 28 }} role="status" />
            <div style={{ marginTop: 12, fontSize: 13 }}>Loading requests...</div>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-exclamation-circle" style={{ fontSize: 32, color: "#DC3545", display: "block", marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: "var(--text-muted, #64748B)", marginBottom: 14 }}>Failed to load fund requests</div>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-inbox" style={{ fontSize: 36, color: "var(--text-muted, #94A3B8)", display: "block", marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: "var(--text-muted, #64748B)" }}>
              {search ? "No requests match your search" : filterTab === "pending" ? "No pending requests — all clear!" : `No ${filterTab === "all" ? "" : filterTab + " "}requests found`}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-safee">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>User Note</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Reviewed</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td><TypeBadge type={r.type} /></td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary, #1a202c)" }}>
                        {r.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 14, color: r.type === "deposit" ? "#198754" : "#DC3545" }}>
                        {r.type === "withdrawal" ? "−" : "+"}{formatAmount(r.amount)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      {r.note ? (
                        <span style={{
                          fontSize: 12, color: "var(--text-muted, #64748B)",
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }} title={r.note}>
                          {r.note}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted, #94A3B8)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <StatusBadge status={r.status} />
                        {r.adminNote && (
                          <span style={{
                            fontSize: 11, color: "var(--text-muted, #64748B)",
                            fontStyle: "italic", maxWidth: 160,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            display: "block",
                          }} title={r.adminNote}>
                            {r.adminNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted, #64748B)", whiteSpace: "nowrap" }}>
                      {formatDate(r.createdAt)}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted, #64748B)", whiteSpace: "nowrap" }}>
                      {r.reviewedAt ? formatDate(r.reviewedAt) : "—"}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {r.status === "pending" ? (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setModal({ request: r, mode: "approve" })}
                            style={{ display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <i className="bi bi-check-lg" />
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setModal({ request: r, mode: "reject" })}
                            style={{ display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <i className="bi bi-x-lg" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted, #94A3B8)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve/Reject Modal */}
      {modal && (
        <ActionModal
          request={modal.request}
          mode={modal.mode}
          onClose={() => !isModalPending && setModal(null)}
          onConfirm={handleConfirm}
          isPending={isModalPending}
        />
      )}
    </div>
  );
}
