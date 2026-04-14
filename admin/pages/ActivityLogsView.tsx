import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGlobalAudit } from "@/lib/api";
import { formatDate, actionTypeLabel, actionTypeColor } from "@/lib/utils";

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "",         label: "All Actions" },
  { value: "APPROVE",  label: "Approvals" },
  { value: "REJECT",   label: "Rejections" },
  { value: "SUSPEND",  label: "Suspensions" },
  { value: "BAN",      label: "Bans" },
  { value: "REACTIVATE", label: "Reactivations" },
  { value: "RESUBMIT", label: "Resubmissions" },
  { value: "BALANCE",  label: "Balance Changes" },
  { value: "ROLE",     label: "Role Changes" },
  { value: "CREATE",   label: "User Created" },
  { value: "DELETE",   label: "Deletions" },
  { value: "FLAG",     label: "Flags" },
  { value: "PASSWORD", label: "Password Resets" },
];

interface Props {
  onOpenProfile: (email: string) => void;
}

export default function ActivityLogsView({ onOpenProfile }: Props) {
  const [search,       setSearch]       = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["global-audit"],
    queryFn: () => getGlobalAudit(500),
  });

  const filtered = useMemo(() => {
    const entries = data?.entries ?? [];
    const q = search.toLowerCase();
    return entries.filter((item) => {
      const entry = item.entry;
      const matchSearch = !q
        || item.email.toLowerCase().includes(q)
        || (entry.actionType ?? "").toLowerCase().includes(q)
        || (entry.note ?? "").toLowerCase().includes(q)
        || (entry.reason ?? "").toLowerCase().includes(q);
      const matchAction = !actionFilter || (entry.actionType ?? "").includes(actionFilter);
      return matchSearch && matchAction;
    });
  }, [data?.entries, search, actionFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Activity Logs</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${filtered.length} of ${data?.total ?? 0} events`}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            <i className="bi bi-arrow-clockwise me-1" />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "0 1 240px" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search by email, action, note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>
          <select
            className="form-select form-select-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ width: 160, fontSize: 12 }}
          >
            {ACTION_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner-border text-primary" role="status" />
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 12 }}>Loading activity logs…</p>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 32 }} />
            <p style={{ color: "#DC3545", fontSize: 13, margin: "12px 0" }}>Failed to load activity logs.</p>
            <button className="btn btn-outline-primary btn-sm" onClick={() => refetch()}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-journal-text text-muted" style={{ fontSize: 40 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>No activity found.</p>
            <p style={{ color: "#94A3B8", fontSize: 12 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="table-safee">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const entry = item.entry;
                const colors = actionTypeColor(entry.actionType ?? "");
                return (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 12, color: "#3C4858", fontFamily: "monospace" }}>
                        {formatDate(entry.timestamp).split(",")[0]}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        {formatDate(entry.timestamp).split(",").slice(1).join(",").trim()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>
                        {item.email.split("@")[0]}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>
                        {item.email.split("@")[1] ? `@${item.email.split("@")[1]}` : ""}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{actionTypeLabel(entry.actionType ?? "")}</span>
                      </span>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, paddingLeft: 13 }}>by {entry.actor}</div>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      {entry.note && <div style={{ fontSize: 12, color: "#3C4858" }}><span style={{ color: "#94A3B8" }}>Note: </span>{entry.note}</div>}
                      {entry.reason && <div style={{ fontSize: 12, color: "#3C4858" }}><span style={{ color: "#94A3B8" }}>Reason: </span>{entry.reason}</div>}
                      {entry.meta && Object.keys(entry.meta).length > 0 && (
                        <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{JSON.stringify(entry.meta)}</div>
                      )}
                      {!entry.note && !entry.reason && (!entry.meta || Object.keys(entry.meta).length === 0) && (
                        <span style={{ fontSize: 12, color: "#D1D5DB" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-outline-primary btn-sm" style={{ fontSize: 11 }} onClick={() => onOpenProfile(item.email)}>
                        View User →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
