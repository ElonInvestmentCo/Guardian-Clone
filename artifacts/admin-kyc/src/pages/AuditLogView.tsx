import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGlobalAudit, type AuditEntry } from "@/lib/api";
import { formatDate, actionTypeLabel, actionTypeColor } from "@/lib/utils";

const ACTION_FILTERS = [
  { value: "",          label: "All Actions" },
  { value: "APPROVE",   label: "Approvals" },
  { value: "REJECT",    label: "Rejections" },
  { value: "SUSPEND",   label: "Suspensions" },
  { value: "BAN",       label: "Bans" },
  { value: "RESUBMIT",  label: "Resubmissions" },
  { value: "DELETE",    label: "Deletions" },
  { value: "ROLE",      label: "Role Changes" },
  { value: "BALANCE",   label: "Balance Updates" },
];

interface FlatEntry extends AuditEntry { _userEmail: string; }

export default function AuditLogView() {
  const [search,     setSearch]     = useState("");
  const [actionType, setActionType] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["global-audit"],
    queryFn: () => getGlobalAudit(200),
    staleTime: 30_000,
  });

  const allEntries: FlatEntry[] = useMemo(() => {
    return (data?.entries ?? []).map((item) => ({
      ...item.entry,
      _userEmail: item.email,
      email: item.entry.email ?? item.email,
    }));
  }, [data?.entries]);

  const filtered = useMemo(() => {
    const q    = search.trim().toLowerCase();
    const type = actionType.toUpperCase();
    return allEntries.filter((e) => {
      const matchType   = !type || (e.actionType ?? "").includes(type);
      const matchSearch = !q
        || (e.actionType ?? "").toLowerCase().includes(q)
        || (e.actor ?? "").toLowerCase().includes(q)
        || (e._userEmail ?? "").toLowerCase().includes(q)
        || (e.note  ?? "").toLowerCase().includes(q)
        || (e.reason ?? "").toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [allEntries, search, actionType]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Audit Log</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${filtered.length} of ${allEntries.length} events`}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            <i className="bi bi-arrow-clockwise me-1" />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 13 }} />
            <input
              type="text"
              placeholder="Search by action, actor, email, note…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-sm"
              style={{ paddingLeft: 32, fontSize: 12 }}
            />
          </div>
          <select
            className="form-select form-select-sm"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            style={{ width: 160, fontSize: 12 }}
          >
            {ACTION_FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner-border text-primary" role="status" />
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 12 }}>Loading audit log…</p>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 32 }} />
            <p style={{ color: "#DC3545", fontSize: 13, margin: "12px 0" }}>Failed to load audit log.</p>
            <button className="btn btn-outline-primary btn-sm" onClick={() => refetch()}>Try Again</button>
          </div>
        ) : allEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-journal-text text-muted" style={{ fontSize: 40 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>No audit events yet</p>
            <p style={{ color: "#94A3B8", fontSize: 12 }}>Admin actions will appear here as they are performed.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-search text-muted" style={{ fontSize: 40 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>No matching events</p>
            <p style={{ color: "#94A3B8", fontSize: 12 }}>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div>
            <div className="d-flex gap-2 flex-wrap mb-3 p-3 card-safee">
              {[
                { key: "APPROVE",  label: "Approved",  color: "#198754" },
                { key: "REJECT",   label: "Rejected",  color: "#DC3545" },
                { key: "SUSPEND",  label: "Suspended", color: "#FD7E14" },
                { key: "BAN",      label: "Banned",    color: "#6F42C1" },
              ].map(({ key, label, color }) => {
                const count = allEntries.filter((e) => (e.actionType ?? "").includes(key)).length;
                return (
                  <span key={key} className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40`, fontSize: 11, fontWeight: 600, padding: "4px 10px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", marginRight: 6 }} />
                    {label} {count}
                  </span>
                );
              })}
            </div>

            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#E5E7EB", borderRadius: 1 }} />
              {filtered.map((entry, i) => (
                <AuditRow key={i} entry={entry} userEmail={entry._userEmail} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditRow({ entry, userEmail }: { entry: AuditEntry; userEmail: string }) {
  const [expanded, setExpanded] = useState(false);
  const c = actionTypeColor(entry.actionType ?? "");
  const hasExtra = !!(entry.note || entry.reason || (entry.fields && entry.fields.length > 0) || entry.meta);

  return (
    <div style={{ position: "relative", marginBottom: 10, paddingLeft: 20 }}>
      <div style={{
        position: "absolute", left: -23, top: 10,
        width: 10, height: 10, borderRadius: "50%",
        background: c.dot, border: "2px solid white",
        boxShadow: `0 0 0 2px ${c.dot}40`,
      }} />

      <div
        onClick={() => hasExtra && setExpanded((x) => !x)}
        className="card-safee"
        style={{ padding: "10px 14px", cursor: hasExtra ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: c.text }}>
                {actionTypeLabel(entry.actionType ?? "")}
              </span>
              <span style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>{userEmail}</span>
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span>{formatDate(entry.timestamp)}</span>
              <span>· by {entry.actor}</span>
            </div>
          </div>
          {hasExtra && (
            <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0, marginTop: 2 }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </div>

        {expanded && hasExtra && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0", display: "flex", flexDirection: "column", gap: 4 }}>
            {entry.reason && <div style={{ fontSize: 11, color: "#3C4858" }}><span style={{ color: "#94A3B8" }}>Reason:</span> {entry.reason}</div>}
            {entry.note && <div style={{ fontSize: 11, color: "#3C4858" }}><span style={{ color: "#94A3B8" }}>Note:</span> {entry.note}</div>}
            {entry.fields && entry.fields.length > 0 && <div style={{ fontSize: 11, color: "#3C4858" }}><span style={{ color: "#94A3B8" }}>Fields:</span> {entry.fields.join(", ")}</div>}
            {entry.meta && Object.keys(entry.meta).length > 0 && (
              <div style={{ fontSize: 11, color: "#3C4858" }}>
                {Object.entries(entry.meta).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 10 }}><span style={{ color: "#94A3B8" }}>{k}:</span> {String(v)}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
