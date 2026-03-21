import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getKycQueue, getUserDetails, type KycUser, type RiskLevel, type RiskScore } from "@/lib/api";
import { riskColors, riskLabel, formatDateShort, formatDate } from "@/lib/utils";
import { RiskBadge, StatusBadge, SeverityBadge } from "@/components/Badges";

const LEVEL_FILTERS: Array<{ value: string; label: string; color: string }> = [
  { value: "",         label: "All",      color: "#6B7280" },
  { value: "critical", label: "Critical", color: "#DC2626" },
  { value: "high",     label: "High",     color: "#EA580C" },
  { value: "medium",   label: "Medium",   color: "#CA8A04" },
  { value: "low",      label: "Low",      color: "#16A34A" },
];

// ── Stat card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: number;
  color: string; bg: string; border: string;
  onClick?: () => void; active?: boolean;
}
function StatCard({ label, value, color, bg, border, onClick, active }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 110px", minWidth: "90px",
        background: active ? bg : "white",
        border: `1.5px solid ${active ? border : "#E5E7EB"}`,
        borderRadius: "8px", padding: "14px 16px",
        textAlign: "left", cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, background 0.15s",
        boxShadow: active ? `0 0 0 2px ${border}` : "none",
      }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = border; }}
      onMouseLeave={(e) => { if (onClick && !active) (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; }}
    >
      <div style={{ fontSize: "24px", fontWeight: "800", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px", fontWeight: "500" }}>{label}</div>
    </button>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────
export default function RiskEventsView() {
  const [levelFilter, setLevelFilter] = useState("");
  const [selected,    setSelected]    = useState<KycUser | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["risk-events-all"],
    queryFn: () => getKycQueue({ limit: 100, minRisk: 1 }),
    staleTime: 60_000,
  });

  const allUsers = data?.users ?? [];
  const counts = {
    critical: allUsers.filter((u) => u.riskLevel === "critical").length,
    high:     allUsers.filter((u) => u.riskLevel === "high").length,
    medium:   allUsers.filter((u) => u.riskLevel === "medium").length,
    low:      allUsers.filter((u) => u.riskLevel === "low").length,
  };

  const filtered = levelFilter
    ? allUsers.filter((u) => u.riskLevel === levelFilter)
    : allUsers;
  const sorted = [...filtered].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ padding: "14px 20px", background: "white", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827" }}>Risk Events</h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#6B7280", marginTop: "1px" }}>
            {isLoading ? "Loading…" : `${allUsers.length} flagged applicant${allUsers.length !== 1 ? "s" : ""}`}
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

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <StatCard label="Critical Risk" value={counts.critical} color="#DC2626" bg="#FEF2F2" border="#FECACA"
            active={levelFilter === "critical"} onClick={() => setLevelFilter(levelFilter === "critical" ? "" : "critical")} />
          <StatCard label="High Risk" value={counts.high} color="#EA580C" bg="#FFF7ED" border="#FED7AA"
            active={levelFilter === "high"} onClick={() => setLevelFilter(levelFilter === "high" ? "" : "high")} />
          <StatCard label="Medium Risk" value={counts.medium} color="#CA8A04" bg="#FEFCE8" border="#FEF08A"
            active={levelFilter === "medium"} onClick={() => setLevelFilter(levelFilter === "medium" ? "" : "medium")} />
          <StatCard label="Low Risk" value={counts.low} color="#16A34A" bg="#F0FDF4" border="#BBF7D0"
            active={levelFilter === "low"} onClick={() => setLevelFilter(levelFilter === "low" ? "" : "low")} />
        </div>

        {/* Level filter pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          {LEVEL_FILTERS.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setLevelFilter(value)}
              style={{
                padding: "5px 14px", borderRadius: "20px",
                border: `1.5px solid ${levelFilter === value ? color : "#E5E7EB"}`,
                background: levelFilter === value ? `${color}18` : "white",
                color: levelFilter === value ? color : "#6B7280",
                fontSize: "12px", fontWeight: levelFilter === value ? "700" : "500",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <SpinnerState label="Loading risk events…" />
        ) : isError ? (
          <ErrorState message="Failed to load risk data." onRetry={() => refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon="✓"
            title={levelFilter ? `No ${riskLabel(levelFilter as RiskLevel)} risk applicants` : "No flagged applicants"}
            sub="All applicants are within acceptable risk thresholds."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sorted.map((user) => {
              const c        = riskColors(user.riskLevel);
              const isActive = selected?.email === user.email;
              return (
                <button
                  key={user.email}
                  onClick={() => setSelected(isActive ? null : user)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "14px 16px",
                    background: isActive ? "#EFF6FF" : "white",
                    border: `1px solid ${isActive ? "#93C5FD" : "#E5E7EB"}`,
                    borderLeft: `4px solid ${c.text}`,
                    borderRadius: "8px", cursor: "pointer",
                    textAlign: "left", width: "100%",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "#F9FAFB";
                      el.style.borderColor = "#D1D5DB";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "white";
                      el.style.borderColor = "#E5E7EB";
                    }
                  }}
                >
                  {/* Score circle */}
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    background: c.bg, border: `2px solid ${c.border}`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: c.text, lineHeight: 1 }}>{user.riskScore}</span>
                    <span style={{ fontSize: "8px", color: c.text, fontWeight: "600", opacity: 0.8 }}>/ 100</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>{user.name}</span>
                      <RiskBadge level={user.riskLevel} />
                      <StatusBadge status={user.status} />
                    </div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "3px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>{user.email}</span>
                      {user.flagCount > 0 && (
                        <span style={{ color: "#DC2626", fontWeight: "600" }}>⚑ {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}</span>
                      )}
                      <span>Registered {formatDateShort(user.createdAt)}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: "11px", color: isActive ? "#2563EB" : "#9CA3AF", fontWeight: "600", flexShrink: 0 }}>
                    {isActive ? "Hide ←" : "Details →"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail panel — bottom sheet on mobile, overlay on desktop */}
      {selected && (
        <RiskDetailPanel user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── Risk detail panel ──────────────────────────────────────────────────────────
function RiskDetailPanel({ user, onClose }: { user: KycUser; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-details", user.email],
    queryFn: () => getUserDetails(user.email),
  });

  const risk = data?.risk;
  const c    = riskColors(user.riskLevel);

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div
        className="fixed inset-0 z-40 md:hidden flex flex-col justify-end"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="relative bg-white rounded-t-2xl"
          style={{ maxHeight: "80vh", overflow: "auto", padding: "20px" }}
        >
          <RiskDetailContent user={user} risk={risk} isLoading={isLoading} c={c} onClose={onClose} />
        </div>
      </div>

      {/* Desktop: right side panel */}
      <div
        className="hidden md:block"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "380px", background: "white",
          borderLeft: "1px solid #E5E7EB",
          overflow: "auto", padding: "20px",
          zIndex: 30, boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
        }}
      >
        <RiskDetailContent user={user} risk={risk} isLoading={isLoading} c={c} onClose={onClose} />
      </div>
    </>
  );
}

function RiskDetailContent({
  user, risk, isLoading, c, onClose,
}: {
  user: KycUser;
  risk: RiskScore | undefined;
  isLoading: boolean;
  c: { bg: string; text: string; border: string };
  onClose: () => void;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{user.name}</div>
          <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{user.email}</div>
          <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <RiskBadge level={user.riskLevel} score={user.riskScore} />
            <StatusBadge status={user.status} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "22px", lineHeight: 1, padding: "2px 6px" }}>
          ×
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>Loading risk details…</div>
      ) : risk ? (
        <>
          {/* Score bar */}
          <div style={{ background: "#F9FAFB", borderRadius: "6px", padding: "12px 14px", marginBottom: "16px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: "10px", color: "#6B7280", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>Risk Score</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "36px", fontWeight: "800", color: c.text }}>{risk.score}</span>
              <div style={{ flex: 1 }}>
                <div style={{ height: "6px", borderRadius: "3px", background: "#E5E7EB", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, risk.score)}%`, background: c.text, borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>Evaluated {formatDate(risk.evaluatedAt)}</div>
              </div>
            </div>
          </div>

          {/* Flags */}
          {risk.flags.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#6B7280", fontSize: "13px" }}>
              ✓ No fraud flags detected
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#374151", letterSpacing: "0.05em", marginBottom: "8px" }}>
                {risk.flags.length} FLAG{risk.flags.length !== 1 ? "S" : ""} DETECTED
              </div>
              {risk.flags.map((flag, i) => (
                <div key={i} style={{ border: "1px solid #E5E7EB", borderLeft: `3px solid ${c.text}`, borderRadius: "6px", padding: "10px 12px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <code style={{ fontSize: "11px", fontWeight: "700", color: "#374151" }}>{flag.code}</code>
                    <SeverityBadge severity={flag.severity} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>{flag.description}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>No risk data available</div>
      )}
    </>
  );
}

// ── Shared state views ─────────────────────────────────────────────────────────
function SpinnerState({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>{message}</p>
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
