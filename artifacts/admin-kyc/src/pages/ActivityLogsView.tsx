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
        || entry.actionType.toLowerCase().includes(q)
        || (entry.note ?? "").toLowerCase().includes(q)
        || (entry.reason ?? "").toLowerCase().includes(q);
      const matchAction = !actionFilter || entry.actionType.includes(actionFilter);
      return matchSearch && matchAction;
    });
  }, [data?.entries, search, actionFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, flexWrap: "wrap", gap: "10px",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>Activity Logs</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", marginTop: "1px" }}>
            {isLoading ? "Loading…" : `${filtered.length} of ${data?.total ?? 0} events`}
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

      {/* ── Filters (responsive) ──────────────────────────────────────── */}
      <div style={{
        padding: "10px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
        flexShrink: 0, overflowX: "auto",
      }}>
        <input
          type="text"
          placeholder="Search by email, action, note…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[240px]"
          style={{
            padding: "6px 10px", borderRadius: "5px", border: "1px solid #E5E7EB",
            fontSize: "12px", color: "#374151", outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          {ACTION_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActionFilter(value)}
              style={{
                padding: "5px 10px", borderRadius: "4px",
                border: `1px solid ${actionFilter === value ? "#2563EB" : "#E5E7EB"}`,
                background: actionFilter === value ? "#EFF6FF" : "transparent",
                color: actionFilter === value ? "#2563EB" : "#6B7280",
                fontSize: "11px", fontWeight: actionFilter === value ? "700" : "400",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Log entries ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["Timestamp", "User", "Action", "Details", ""].map((h) => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left",
                        fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
                        textTransform: "uppercase", color: "#6B7280",
                        background: "#F9FAFB", borderBottom: "1px solid #E5E7EB",
                        whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 1,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const entry = item.entry;
                    const colors = actionTypeColor(entry.actionType);
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #F3F4F6", background: "white" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                      >
                        <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: "12px", color: "#374151", fontFamily: "monospace" }}>
                            {formatDate(entry.timestamp).split(",")[0]}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                            {formatDate(entry.timestamp).split(",").slice(1).join(",").trim()}
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "#111827", whiteSpace: "nowrap" }}>
                            {item.email.split("@")[0]}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{item.email.split("@")[1] ? `@${item.email.split("@")[1]}` : ""}</div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: "12px", fontWeight: "600", color: colors.text, whiteSpace: "nowrap" }}>
                              {actionTypeLabel(entry.actionType)}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px", paddingLeft: "13px" }}>by {entry.actor}</div>
                        </td>
                        <td style={{ padding: "11px 14px", maxWidth: "280px" }}>
                          {entry.note && (
                            <div style={{ fontSize: "12px", color: "#374151", marginBottom: "2px" }}>
                              <span style={{ color: "#9CA3AF" }}>Note: </span>{entry.note}
                            </div>
                          )}
                          {entry.reason && (
                            <div style={{ fontSize: "12px", color: "#374151" }}>
                              <span style={{ color: "#9CA3AF" }}>Reason: </span>{entry.reason}
                            </div>
                          )}
                          {entry.meta && Object.keys(entry.meta).length > 0 && (
                            <div style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "monospace" }}>
                              {JSON.stringify(entry.meta)}
                            </div>
                          )}
                          {!entry.note && !entry.reason && (!entry.meta || Object.keys(entry.meta).length === 0) && (
                            <span style={{ fontSize: "12px", color: "#D1D5DB" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "right" }}>
                          <button
                            onClick={() => onOpenProfile(item.email)}
                            style={{
                              padding: "4px 10px", borderRadius: "4px",
                              background: "#EFF6FF", color: "#2563EB",
                              border: "1px solid #BFDBFE",
                              fontSize: "11px", fontWeight: "600",
                              cursor: "pointer", whiteSpace: "nowrap",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#DBEAFE"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#EFF6FF"; }}
                          >
                            View User →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="block sm:hidden p-4 space-y-3">
              {filtered.map((item, i) => {
                const entry = item.entry;
                const colors = actionTypeColor(entry.actionType);
                return (
                  <div key={i} style={{
                    background: "white", border: "1px solid #E5E7EB",
                    borderRadius: "8px", padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.dot }} />
                        <span style={{ fontSize: "12px", fontWeight: "700", color: colors.text }}>
                          {actionTypeLabel(entry.actionType)}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{formatDate(entry.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#374151" }}>{item.email}</div>
                    {entry.note && <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>Note: {entry.note}</div>}
                    <button
                      onClick={() => onOpenProfile(item.email)}
                      style={{ marginTop: "8px", fontSize: "11px", color: "#2563EB", fontWeight: "600", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      View Profile →
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Loading activity logs…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>Failed to load activity logs.</p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: "5px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
      <p style={{ color: "#374151", fontSize: "14px", fontWeight: "600", margin: "0 0 6px" }}>No activity found.</p>
      <p style={{ color: "#9CA3AF", fontSize: "12px", margin: 0 }}>Try adjusting your filters.</p>
    </div>
  );
}
