import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getKycQueue, getUserDetails, type KycUser, type RiskLevel, type RiskScore } from "@/lib/api";
import { riskColors, riskLabel, formatDateShort, formatDate } from "@/lib/utils";
import { RiskBadge, StatusBadge, SeverityBadge } from "@/components/Badges";

const LEVEL_FILTERS: Array<{ value: string; label: string; color: string }> = [
  { value: "",         label: "All",      color: "#64748B" },
  { value: "critical", label: "Critical", color: "#DC3545" },
  { value: "high",     label: "High",     color: "#FD7E14" },
  { value: "medium",   label: "Medium",   color: "#FFC107" },
  { value: "low",      label: "Low",      color: "#198754" },
];

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Risk Events</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${allUsers.length} flagged applicant${allUsers.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            <i className="bi bi-arrow-clockwise me-1" />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div className="row g-3 mb-3">
          {([
            { key: "critical", label: "Critical Risk", color: "#DC3545", bg: "linear-gradient(135deg, #DC3545, #BB2D3B)" },
            { key: "high", label: "High Risk", color: "#FD7E14", bg: "linear-gradient(135deg, #FD7E14, #E8590C)" },
            { key: "medium", label: "Medium Risk", color: "#FFC107", bg: "linear-gradient(135deg, #FFC107, #FFCA2C)" },
            { key: "low", label: "Low Risk", color: "#198754", bg: "linear-gradient(135deg, #198754, #157347)" },
          ] as const).map(({ key, label, bg }) => (
            <div className="col-6 col-lg-3" key={key}>
              <button
                onClick={() => setLevelFilter(levelFilter === key ? "" : key)}
                className="stat-card w-100 text-start"
                style={{
                  background: bg,
                  border: levelFilter === key ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: levelFilter === key ? "0 0 0 2px #0D6EFD" : undefined,
                  cursor: "pointer",
                }}
              >
                <h2 style={{ fontSize: 28 }}>{counts[key]}</h2>
                <p>{label}</p>
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {LEVEL_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              className={`btn btn-sm ${levelFilter === value ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setLevelFilter(value)}
              style={{ fontSize: 12, borderRadius: 20 }}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div className="spinner-border text-primary" role="status" />
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 12 }}>Loading risk events…</p>
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 32 }} />
            <p style={{ color: "#DC3545", fontSize: 13, margin: "12px 0" }}>Failed to load risk data.</p>
            <button className="btn btn-outline-primary btn-sm" onClick={() => refetch()}>Try Again</button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <i className="bi bi-check-circle text-success" style={{ fontSize: 40 }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: "12px 0 6px" }}>
              {levelFilter ? `No ${riskLabel(levelFilter as RiskLevel)} risk applicants` : "No flagged applicants"}
            </p>
            <p style={{ color: "#94A3B8", fontSize: 12 }}>All applicants are within acceptable risk thresholds.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((user) => {
              const c = riskColors(user.riskLevel);
              const isActive = selected?.email === user.email;
              return (
                <button
                  key={user.email}
                  onClick={() => setSelected(isActive ? null : user)}
                  className="card-safee"
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    background: isActive ? "#EFF6FF" : "#fff",
                    borderLeft: `4px solid ${c.text}`,
                    cursor: "pointer", textAlign: "left", width: "100%",
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: c.bg, border: `2px solid ${c.border}`,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: c.text, lineHeight: 1 }}>{user.riskScore}</span>
                    <span style={{ fontSize: 8, color: c.text, fontWeight: 600, opacity: 0.8 }}>/ 100</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{user.name}</span>
                      <RiskBadge level={user.riskLevel} />
                      <StatusBadge status={user.status} />
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>{user.email}</span>
                      {user.flagCount > 0 && <span style={{ color: "#DC3545", fontWeight: 600 }}>⚑ {user.flagCount} flag{user.flagCount !== 1 ? "s" : ""}</span>}
                      <span>Registered {formatDateShort(user.createdAt)}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, color: isActive ? "#0D6EFD" : "#94A3B8", fontWeight: 600, flexShrink: 0 }}>
                    {isActive ? "Hide ←" : "Details →"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && <RiskDetailPanel user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function RiskDetailPanel({ user, onClose }: { user: KycUser; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-details", user.email],
    queryFn: () => getUserDetails(user.email),
  });

  const risk = data?.risk;
  const c = riskColors(user.riskLevel);

  return (
    <div
      style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 380, background: "#fff",
        borderLeft: "1px solid #e5e7eb",
        overflow: "auto", padding: 20,
        zIndex: 1040, boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1E293B" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{user.email}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <RiskBadge level={user.riskLevel} score={user.riskScore} />
            <StatusBadge status={user.status} />
          </div>
        </div>
        <button className="btn-close" onClick={onClose} />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>Loading risk details…</div>
      ) : risk ? (
        <>
          <div className="card-safee" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Risk Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: c.text }}>{risk.score}</span>
                <div style={{ flex: 1 }}>
                  <div className="progress" style={{ height: 6 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(100, risk.score)}%`, background: c.text }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>Evaluated {formatDate(risk.evaluatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {risk.flags.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#64748B", fontSize: 13 }}>✓ No fraud flags detected</div>
          ) : (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3C4858", marginBottom: 8 }}>
                {risk.flags.length} FLAG{risk.flags.length !== 1 ? "S" : ""} DETECTED
              </div>
              {risk.flags.map((flag, i) => (
                <div key={i} className="card-safee" style={{ borderLeft: `3px solid ${c.text}`, marginBottom: 8 }}>
                  <div className="card-body" style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <code style={{ fontSize: 11, fontWeight: 700, color: "#3C4858" }}>{flag.code}</code>
                      <SeverityBadge severity={flag.severity} />
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>{flag.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>No risk data available</div>
      )}
    </div>
  );
}
