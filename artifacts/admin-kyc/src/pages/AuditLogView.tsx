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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ padding: "16px 20px", background: "white", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>Audit Log</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", marginTop: "1px" }}>
            {isLoading ? "Loading…" : `${filtered.length} of ${allEntries.length} events`}
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

      {/* Search + filter bar (responsive) */}
      <div style={{ padding: "12px 20px", background: "white", borderBottom: "1px solid #E5E7EB", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", flexShrink: 0, overflowX: "auto" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <svg
            width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by action, actor, email, note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px 8px 32px",
              border: "1px solid #E5E7EB", borderRadius: "6px",
              fontSize: "12px", color: "#374151",
              outline: "none", fontFamily: "inherit",
            }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#2563EB"; }}
            onBlur={(e)  => { (e.target as HTMLElement).style.borderColor = "#E5E7EB"; }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "16px", lineHeight: 1, padding: "2px" }}
            >
              ×
            </button>
          )}
        </div>

        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          style={{
            padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: "6px",
            fontSize: "12px", color: "#374151", background: "white",
            cursor: "pointer", outline: "none", fontFamily: "inherit",
          }}
        >
          {ACTION_FILTERS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : allEntries.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No audit events yet"
            sub="Admin actions will appear here as they are performed."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matching events"
            sub="Try adjusting your search or filter."
          />
        ) : (
          <div>
            {/* Summary strip */}
            <div style={{
              display: "flex", gap: "6px", flexWrap: "wrap",
              marginBottom: "20px", padding: "12px 14px",
              background: "white", borderRadius: "8px",
              border: "1px solid #E5E7EB",
            }}>
              {[
                { key: "APPROVE",  label: "Approved",  color: "#16A34A" },
                { key: "REJECT",   label: "Rejected",  color: "#DC2626" },
                { key: "SUSPEND",  label: "Suspended", color: "#EA580C" },
                { key: "BAN",      label: "Banned",    color: "#9333EA" },
              ].map(({ key, label, color }) => {
                const count = allEntries.filter((e) => (e.actionType ?? "").includes(key)).length;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>{label}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Timeline entries */}
            <div style={{ position: "relative", paddingLeft: "24px" }}>
              <div style={{
                position: "absolute", left: "7px", top: "8px", bottom: "8px",
                width: "2px", background: "#E5E7EB", borderRadius: "1px",
              }} />
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

// ── Audit row component ────────────────────────────────────────────────────────
function AuditRow({ entry, userEmail }: { entry: AuditEntry; userEmail: string }) {
  const [expanded, setExpanded] = useState(false);
  const c = actionTypeColor(entry.actionType ?? "");
  const hasExtra = !!(entry.note || entry.reason || (entry.fields && entry.fields.length > 0) || entry.meta);

  return (
    <div style={{ position: "relative", marginBottom: "10px", paddingLeft: "20px" }}>
      <div style={{
        position: "absolute", left: "-23px", top: "10px",
        width: "10px", height: "10px", borderRadius: "50%",
        background: c.dot, border: "2px solid white",
        boxShadow: `0 0 0 2px ${c.dot}40`,
      }} />

      <div
        onClick={() => hasExtra && setExpanded((x) => !x)}
        style={{
          background: "white", border: "1px solid #E5E7EB",
          borderRadius: "6px", padding: "10px 14px",
          cursor: hasExtra ? "pointer" : "default",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { if (hasExtra) (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
        onMouseLeave={(e) => { if (hasExtra) (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: "700", fontSize: "12px", color: c.text }}>
                {actionTypeLabel(entry.actionType ?? "")}
              </span>
              <span style={{ fontSize: "11px", color: "#6B7280", fontFamily: "monospace" }}>
                {userEmail}
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "3px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span>{formatDate(entry.timestamp)}</span>
              <span>· by {entry.actor}</span>
            </div>
          </div>
          {hasExtra && (
            <span style={{ fontSize: "10px", color: "#9CA3AF", flexShrink: 0, marginTop: "2px" }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </div>

        {expanded && hasExtra && (
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #F3F4F6", display: "flex", flexDirection: "column", gap: "4px" }}>
            {entry.reason && (
              <div style={{ fontSize: "11px", color: "#374151" }}>
                <span style={{ color: "#9CA3AF" }}>Reason:</span> {entry.reason}
              </div>
            )}
            {entry.note && (
              <div style={{ fontSize: "11px", color: "#374151" }}>
                <span style={{ color: "#9CA3AF" }}>Note:</span> {entry.note}
              </div>
            )}
            {entry.fields && entry.fields.length > 0 && (
              <div style={{ fontSize: "11px", color: "#374151" }}>
                <span style={{ color: "#9CA3AF" }}>Fields:</span> {entry.fields.join(", ")}
              </div>
            )}
            {entry.meta && Object.keys(entry.meta).length > 0 && (
              <div style={{ fontSize: "11px", color: "#374151" }}>
                {Object.entries(entry.meta).map(([k, v]) => (
                  <span key={k} style={{ marginRight: "10px" }}>
                    <span style={{ color: "#9CA3AF" }}>{k}:</span> {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Loading audit log…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>Failed to load audit log.</p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: "5px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>{icon}</div>
      <p style={{ color: "#374151", fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>{title}</p>
      <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>{sub}</p>
    </div>
  );
}
