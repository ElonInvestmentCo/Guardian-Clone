import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getUserDetails,
  approveUser,
  rejectUser,
  requestResubmission,
  type KycUser,
  type AuditEntry,
} from "@/lib/api";
import { formatDate, getProfileField, riskColors } from "@/lib/utils";
import { RiskBadge, StatusBadge, SeverityBadge } from "@/components/Badges";

interface Props {
  user: KycUser;
  onClose: () => void;
  onAction: () => void;
}

type Tab = "overview" | "risk" | "audit";

export default function UserPanel({ user, onClose, onAction }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [actionNote, setActionNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-details", user.email],
    queryFn: () => getUserDetails(user.email),
  });

  const showMsg = (type: "ok" | "err", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const approveMut = useMutation({
    mutationFn: () => approveUser(user.email, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "User approved"); onAction(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectUser(user.email, rejectReason || undefined, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "User rejected"); onAction(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const resubmitMut = useMutation({
    mutationFn: () => requestResubmission(user.email, undefined, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "Resubmission requested"); onAction(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const profile   = data?.profile   ?? {};
  const risk      = data?.risk;
  const auditLog  = data?.auditLog  ?? [];

  const profileField = (step: string, field: string) => getProfileField(profile, step, field);

  const TabBtn = ({ t, label }: { t: Tab; label: string }) => (
    <button onClick={() => setTab(t)} style={{
      padding: "7px 14px", borderRadius: "4px",
      border: "none",
      background: tab === t ? "#2563EB" : "transparent",
      color: tab === t ? "white" : "#6B7280",
      fontSize: "12px", fontWeight: "600",
      cursor: "pointer",
    }}>{label}</button>
  );

  return (
    <div style={{
      width: "380px", flexShrink: 0,
      background: "white",
      borderLeft: "1px solid #E5E7EB",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      height: "100%",
    }}>
      {/* Panel header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>{user.email}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              <StatusBadge status={user.status} />
              <RiskBadge level={user.riskLevel} score={user.riskScore} />
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#9CA3AF", fontSize: "18px", lineHeight: 1, padding: "2px 4px",
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "12px" }}>
          <TabBtn t="overview" label="Profile" />
          <TabBtn t="risk" label="Risk Flags" />
          <TabBtn t="audit" label="Audit" />
        </div>
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>
            Loading user data…
          </div>
        )}

        {isError && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#DC2626", fontSize: "13px" }}>
            Failed to load user data
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* ── Overview tab ─────────────────────────────────────── */}
            {tab === "overview" && (
              <div>
                <Section title="Personal">
                  <Field label="First Name"   value={profileField("personal", "firstName")} />
                  <Field label="Last Name"    value={profileField("personal", "lastName")} />
                  <Field label="Phone"        value={profileField("personal", "phoneNumber")} />
                  <Field label="Address"      value={profileField("personal", "address")} />
                  <Field label="City"         value={profileField("personal", "city")} />
                  <Field label="State"        value={profileField("personal", "state")} />
                  <Field label="Country"      value={profileField("personal", "country")} />
                  <Field label="ZIP"          value={profileField("personal", "zipCode")} />
                </Section>

                <Section title="Identity">
                  <Field label="Citizenship"  value={profileField("idInformation", "countryOfCitizenship")} />
                  <Field label="ID Type"      value={profileField("idInformation", "idType")} />
                  <Field label="ID Number"    value={profileField("idInformation", "idNumber")} />
                  <Field label="Date of Birth" value={profileField("idInformation", "dateOfBirth")} />
                  <Field label="ID Expiry"    value={profileField("idInformation", "idExpiration")} />
                  <Field label="Tax ID"       value={profileField("idInformation", "taxId")} />
                </Section>

                <Section title="Financial">
                  <Field label="Annual Income"  value={profileField("income", "annualIncome")} />
                  <Field label="Net Worth"      value={profileField("income", "netWorth")} />
                  <Field label="Tax Bracket"    value={profileField("income", "taxBracket")} />
                  <Field label="Risk Tolerance" value={profileField("riskTolerance", "riskTolerance")} />
                  <Field label="Objective"      value={profileField("riskTolerance", "investmentObjective")} />
                </Section>

                <Section title="Account">
                  <Field label="Registration"  value={profileField("general", "registrationType")} />
                  <Field label="Product"       value={profileField("general", "product")} />
                  <Field label="Created"       value={formatDate(data?.master.createdAt as string)} />
                  <Field label="Last Updated"  value={formatDate(data?.master.updatedAt as string)} />
                </Section>
              </div>
            )}

            {/* ── Risk tab ─────────────────────────────────────────── */}
            {tab === "risk" && (
              <div>
                {risk ? (
                  <>
                    <div style={{ background: "#F9FAFB", borderRadius: "6px", padding: "12px 14px", marginBottom: "16px", border: "1px solid #E5E7EB" }}>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px" }}>TOTAL RISK SCORE</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{
                          fontSize: "36px", fontWeight: "800",
                          color: riskColors(risk.level).text,
                        }}>{risk.score}</span>
                        <RiskBadge level={risk.level} />
                      </div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                        Evaluated {formatDate(risk.evaluatedAt)}
                      </div>
                    </div>

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
                          <div key={i} style={{
                            border: "1px solid #E5E7EB", borderRadius: "6px",
                            padding: "10px 12px", marginBottom: "8px",
                            borderLeft: `3px solid ${riskColors("high").text}`,
                          }}>
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
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>
                    No risk data available
                  </div>
                )}
              </div>
            )}

            {/* ── Audit tab ────────────────────────────────────────── */}
            {tab === "audit" && (
              <div>
                {auditLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>
                    No audit events yet
                  </div>
                ) : (
                  <div>
                    {[...auditLog].reverse().map((entry: AuditEntry, i) => (
                      <div key={i} style={{
                        borderLeft: "2px solid #E5E7EB",
                        paddingLeft: "12px",
                        marginBottom: "14px",
                        position: "relative",
                      }}>
                        <div style={{
                          position: "absolute", left: "-5px", top: "3px",
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: "#2563EB", border: "2px solid white",
                          boxShadow: "0 0 0 1px #2563EB",
                        }} />
                        <div style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "2px" }}>
                          {formatDate(entry.timestamp)} · {entry.actor}
                        </div>
                        <div style={{ fontWeight: "600", fontSize: "12px", color: "#111827" }}>
                          {entry.actionType.replace(/_/g, " ")}
                        </div>
                        {entry.note && <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Note: {entry.note}</div>}
                        {entry.reason && <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Reason: {entry.reason}</div>}
                        {entry.fields && entry.fields.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                            Fields: {entry.fields.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action footer */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid #E5E7EB", background: "#FAFAFA", flexShrink: 0 }}>
        {actionMsg && (
          <div style={{
            marginBottom: "10px", padding: "8px 12px", borderRadius: "4px", fontSize: "12px",
            background: actionMsg.type === "ok" ? "#F0FDF4" : "#FEF2F2",
            color: actionMsg.type === "ok" ? "#16A34A" : "#DC2626",
            border: `1px solid ${actionMsg.type === "ok" ? "#BBF7D0" : "#FECACA"}`,
          }}>
            {actionMsg.text}
          </div>
        )}

        <textarea
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
          placeholder="Admin note (optional)…"
          rows={2}
          style={{
            width: "100%", resize: "none", boxSizing: "border-box",
            padding: "7px 10px", borderRadius: "4px",
            border: "1px solid #E5E7EB", fontSize: "12px",
            color: "#374151", outline: "none",
            fontFamily: "inherit", marginBottom: "8px",
          }}
        />

        {rejectMut.isPending ? null : (
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reject reason (required for rejections)…"
            rows={1}
            style={{
              width: "100%", resize: "none", boxSizing: "border-box",
              padding: "7px 10px", borderRadius: "4px",
              border: "1px solid #E5E7EB", fontSize: "12px",
              color: "#374151", outline: "none",
              fontFamily: "inherit", marginBottom: "10px",
            }}
          />
        )}

        <div style={{ display: "flex", gap: "6px" }}>
          <ActionBtn
            label="✓ Approve"
            onClick={() => approveMut.mutate()}
            loading={approveMut.isPending}
            color="#16A34A" hoverColor="#15803D"
          />
          <ActionBtn
            label="✗ Reject"
            onClick={() => rejectMut.mutate()}
            loading={rejectMut.isPending}
            color="#DC2626" hoverColor="#B91C1C"
          />
          <ActionBtn
            label="↩ Resubmit"
            onClick={() => resubmitMut.mutate()}
            loading={resubmitMut.isPending}
            color="#6B7280" hoverColor="#4B5563"
          />
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em",
        textTransform: "uppercase", color: "#9CA3AF",
        marginBottom: "8px", paddingBottom: "4px",
        borderBottom: "1px solid #F3F4F6",
      }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F9FAFB" }}>
      <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#374151", fontWeight: value === "—" ? "400" : "500", textAlign: "right", maxWidth: "200px", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function ActionBtn({ label, onClick, loading, color, hoverColor }: {
  label: string; onClick: () => void; loading: boolean;
  color: string; hoverColor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = color; }}
      style={{
        flex: 1, padding: "7px 4px",
        borderRadius: "4px", border: "none",
        background: loading ? "#9CA3AF" : color,
        color: "white", fontSize: "11px", fontWeight: "700",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}
