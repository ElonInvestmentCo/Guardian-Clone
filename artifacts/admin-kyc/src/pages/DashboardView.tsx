import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { getKycQueue, getAllUsers, getGlobalAudit } from "@/lib/api";
import { formatDate, actionTypeLabel, actionTypeColor } from "@/lib/utils";
import {
  useAdminRealtime,
  type RegistrationEvent,
  type ApplicationCompleteEvent,
} from "@/hooks/useAdminRealtime";
import AdminToast, { type ToastItem } from "@/components/AdminToast";

let toastCounter = 0;

export default function DashboardView() {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [newRegistrations, setNewRegistrations] = useState(0);

  const pushToast = useCallback((t: Omit<ToastItem, "id">) => {
    setToasts(prev => [...prev, { ...t, id: ++toastCounter }].slice(-5));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ["dashboard-queue"],
    queryFn: () => getKycQueue({ limit: 100 }),
    staleTime: 30_000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => getAllUsers({}),
    staleTime: 30_000,
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ["dashboard-audit"],
    queryFn: () => getGlobalAudit(10),
    staleTime: 30_000,
  });

  const handleNewRegistration = useCallback((event: RegistrationEvent) => {
    setNewRegistrations(c => c + 1);
    queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
    pushToast({
      type: "registration",
      title: "New User Registered",
      message: event.email,
      subtext: event.formattedAt,
    });
  }, [queryClient, pushToast]);

  const handleApplicationComplete = useCallback((event: ApplicationCompleteEvent) => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-queue"] });
    pushToast({
      type: "kyc_complete",
      title: "KYC Application Complete",
      message: event.email,
      subtext: `All ${event.totalSteps} steps submitted · ${event.formattedAt}`,
    });
  }, [queryClient, pushToast]);

  const { status } = useAdminRealtime({
    onNewRegistration: handleNewRegistration,
    onApplicationComplete: handleApplicationComplete,
  });

  const users = usersData?.users ?? [];
  const queueUsers = queueData?.users ?? [];
  const recentActivity = auditData?.entries ?? [];

  const totalUsers = (usersData?.total ?? 0) + newRegistrations;
  const pendingCount = queueUsers.filter(u => u.status === "pending").length;
  const approvedCount = users.filter(u => u.status === "approved" || u.status === "verified").length;
  const riskCount = queueUsers.filter(u => u.riskScore >= 50).length;

  const statusBreakdown = [
    { label: "Approved", count: users.filter(u => u.status === "approved").length, color: "#198754" },
    { label: "Verified", count: users.filter(u => u.status === "verified").length, color: "#0D6EFD" },
    { label: "Pending", count: users.filter(u => u.status === "pending").length, color: "#FFC107" },
    { label: "Rejected", count: users.filter(u => u.status === "rejected").length, color: "#DC3545" },
    { label: "Resubmit", count: users.filter(u => u.status === "resubmit").length, color: "#6F42C1" },
    { label: "Suspended", count: users.filter(u => u.status === "suspended").length, color: "#FD7E14" },
    { label: "Banned", count: users.filter(u => u.status === "banned").length, color: "#6C757D" },
  ].filter(s => s.count > 0);

  const isLoading = queueLoading || usersLoading || auditLoading;

  return (
    <div>
      <AdminToast toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: status === "connected" ? "#F0FDF4" : "#F9FAFB",
          color: status === "connected" ? "#16A34A" : "#9CA3AF",
          border: `1px solid ${status === "connected" ? "#BBF7D0" : "#E5E7EB"}`,
          borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: status === "connected" ? "#16A34A" : "#D1D5DB",
            animation: status === "connected" ? "pulse 2s infinite" : "none",
          }} />
          {status === "connected" ? "Live sync active" : status === "connecting" ? "Connecting..." : "Disconnected — retrying"}
        </span>
        {newRegistrations > 0 && (
          <span style={{
            background: "#EFF6FF", color: "#2563EB",
            border: "1px solid #BFDBFE",
            borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
          }}>
            +{newRegistrations} new since page load
          </span>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #0D6EFD, #0B5ED7)" }}>
            <i className="bi bi-people stat-icon" />
            <h2>{isLoading ? "..." : totalUsers}</h2>
            <p>Total Users</p>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #7A5AF8, #6D28D9)" }}>
            <i className="bi bi-clock-history stat-icon" />
            <h2>{isLoading ? "..." : pendingCount}</h2>
            <p>Pending KYC</p>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #198754, #157347)" }}>
            <i className="bi bi-check-circle stat-icon" />
            <h2>{isLoading ? "..." : approvedCount}</h2>
            <p>Approved Users</p>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card" style={{ background: "linear-gradient(135deg, #DC3545, #BB2D3B)" }}>
            <i className="bi bi-exclamation-triangle stat-icon" />
            <h2>{isLoading ? "..." : riskCount}</h2>
            <p>High Risk</p>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card-safee">
            <div className="card-header">
              <span>User Status Distribution</span>
            </div>
            <div className="card-body">
              {isLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading...</div>
              ) : (
                <div>
                  {statusBreakdown.map(({ label, count, color }) => {
                    const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <span style={{ width: 80, fontSize: 13, color: "#3C4858", fontWeight: 500 }}>{label}</span>
                        <div style={{ flex: 1, height: 22, background: "#F1F2F7", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${pct}%`, background: color,
                            borderRadius: 4, minWidth: count > 0 ? 24 : 0,
                            display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
                            fontSize: 11, color: "#fff", fontWeight: 600,
                            transition: "width 0.5s ease",
                          }}>
                            {pct > 5 ? `${pct}%` : ""}
                          </div>
                        </div>
                        <span style={{ width: 50, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#3C4858" }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                  {statusBreakdown.length === 0 && (
                    <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>
                      No users registered yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-safee" style={{ height: "100%" }}>
            <div className="card-header">
              <span>KYC Queue Summary</span>
            </div>
            <div className="card-body">
              {isLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading...</div>
              ) : (
                <div>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#0D6EFD" }}>
                      {queueData?.total ?? 0}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Total in Queue</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Critical", count: queueUsers.filter(u => u.riskLevel === "critical").length, color: "#DC3545" },
                      { label: "High", count: queueUsers.filter(u => u.riskLevel === "high").length, color: "#FD7E14" },
                      { label: "Medium", count: queueUsers.filter(u => u.riskLevel === "medium").length, color: "#FFC107" },
                      { label: "Low", count: queueUsers.filter(u => u.riskLevel === "low").length, color: "#198754" },
                    ].map(r => (
                      <div key={r.label} style={{
                        textAlign: "center", padding: "10px 8px",
                        background: "#F8F9FC", borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: r.color }}>{r.count}</div>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-safee">
        <div className="card-header">
          <span>Recent Activity</span>
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400 }}>Last 10 actions</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {auditLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 13 }}>
              No recent activity
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-safee">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>By</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item, i) => {
                    const entry = item.entry;
                    const colors = actionTypeColor(entry.actionType ?? "");
                    return (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "#64748B" }}>
                          {formatDate(entry.timestamp)}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.email}</span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: colors.text, fontSize: 12 }}>
                              {actionTypeLabel(entry.actionType ?? "")}
                            </span>
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748B" }}>{entry.actor}</td>
                        <td style={{ fontSize: 12, color: "#64748B", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entry.note || entry.reason || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
