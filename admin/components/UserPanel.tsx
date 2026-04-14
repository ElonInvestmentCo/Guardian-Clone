import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  onOpenProfile?: (email: string) => void;
}

type Tab = "overview" | "risk" | "audit";

const KYC_STATUSES = ["approved", "rejected", "resubmit", "resubmit_required", "reviewing"] as const;
type KycDecision = typeof KYC_STATUSES[number];

function isKycDecision(s: string): s is KycDecision {
  return (KYC_STATUSES as readonly string[]).includes(s);
}

const RESUBMIT_FIELD_OPTIONS = [
  "Personal Details", "Professional Details", "ID Information",
  "Income Details", "Risk Tolerance", "Financial Situation",
  "Investment Experience", "ID Proof Upload", "Funding Details",
  "Disclosures", "Signatures",
];

export default function UserPanel({ user, onClose, onAction, onOpenProfile }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [actionNote, setActionNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [resubmitFields, setResubmitFields] = useState<string[]>([]);
  const [actionMsg, setActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-details", user.email],
    queryFn: () => getUserDetails(user.email),
  });

  const showMsg = (type: "ok" | "err", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 5000);
  };

  const refresh = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["kyc-queue"] });
    qc.invalidateQueries({ queryKey: ["all-users"] });
    qc.invalidateQueries({ queryKey: ["global-audit"] });
    onAction();
  };

  const approveMut = useMutation({
    mutationFn: () => approveUser(user.email, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "User approved successfully"); refresh(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectUser(user.email, rejectReason, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "User rejected"); refresh(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const resubmitMut = useMutation({
    mutationFn: () => requestResubmission(user.email, resubmitFields.length > 0 ? resubmitFields : undefined, actionNote || undefined),
    onSuccess: () => { showMsg("ok", "Resubmission requested"); setResubmitFields([]); refresh(); },
    onError:   (e: Error) => showMsg("err", e.message),
  });

  const profile   = data?.profile   ?? {};
  const risk      = data?.risk;
  const auditLog  = data?.auditLog  ?? [];
  const master    = data?.master     ?? {};

  const currentStatus = (master.status as string) ?? (profile.status as string) ?? user.status ?? "pending";
  const hasDecision = isKycDecision(currentStatus);
  const anyPending = approveMut.isPending || rejectMut.isPending || resubmitMut.isPending;

  const profileField = (step: string, field: string) => getProfileField(profile, step, field);

  const TabBtn = ({ t, label }: { t: Tab; label: string }) => (
    <button
      onClick={() => setTab(t)}
      className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline-secondary"}`}
      style={{ fontSize: 12, fontWeight: 600 }}
    >{label}</button>
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
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F8FAFC" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "15px", color: "#1E293B" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{user.email}</div>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
              <StatusBadge status={currentStatus as "pending"} />
              <RiskBadge level={user.riskLevel} score={user.riskScore} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {onOpenProfile && (
              <button
                onClick={() => onOpenProfile(user.email)}
                style={{
                  fontSize: "11px", color: "#2563EB", fontWeight: "600",
                  cursor: "pointer", padding: "4px 10px",
                  border: "1px solid #BFDBFE", borderRadius: "4px",
                  background: "#EFF6FF", whiteSpace: "nowrap",
                }}
              >
                Full Profile →
              </button>
            )}
            <button className="btn-close" onClick={onClose} />
          </div>
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
                <Section title="Account">
                  <Field label="Registration"  value={profileField("general", "registrationType")} />
                  <Field label="Product"       value={profileField("general", "product")} />
                  <Field label="Created"       value={formatDate(data?.master.createdAt as string)} />
                  <Field label="Last Updated"  value={formatDate(data?.master.updatedAt as string)} />
                </Section>

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

                <Section title="Professional">
                  <Field label="Employment"   value={profileField("professional", "employmentStatus")} />
                  <Field label="Employer"     value={profileField("professional", "employerName")} />
                  <Field label="Position"     value={profileField("professional", "positionTitle")} />
                </Section>

                <Section title="Identity & Tax">
                  <Field label="Tax ID Type"   value={profileField("idInformation", "taxIdType")} />
                  <Field label="Tax ID"        value={profileField("idInformation", "taxId")} />
                  <Field label="Date of Birth" value={profileField("idInformation", "dateOfBirth")} />
                  <Field label="ID Type"       value={profileField("idInformation", "idType")} />
                  <Field label="ID Number"     value={profileField("idInformation", "idNumber")} />
                  <Field label="Expiration"    value={profileField("idInformation", "expirationDate")} />
                </Section>

                <Section title="Financial">
                  <Field label="Annual Income"     value={profileField("income", "annualIncome")} />
                  <Field label="Net Worth"          value={profileField("income", "netWorth")} />
                  <Field label="Liquid Net Worth"   value={profileField("income", "liquidNetWorth")} />
                  <Field label="Tax Rate"           value={profileField("income", "taxRate")} />
                  <Field label="Risk Tolerance"     value={profileField("riskTolerance", "riskTolerance")} />
                </Section>

                <Section title="Funding">
                  <Field label="Bank Name"       value={profileField("fundingDetails", "bankName")} />
                  <Field label="ABA/SWIFT"       value={profileField("fundingDetails", "abaSwift")} />
                  <Field label="Account Name"    value={profileField("fundingDetails", "accountName")} />
                  <Field label="Account Number"  value={profileField("fundingDetails", "accountNumber")} />
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
                          {(entry.actionType ?? "Unknown").replace(/_/g, " ")}
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

      <div style={{ padding: "14px 20px", borderTop: "1px solid #E5E7EB", background: "#F8FAFC", flexShrink: 0 }}>
        {actionMsg && (
          <div className={`alert ${actionMsg.type === "ok" ? "alert-success" : "alert-danger"} py-2 px-3 mb-2`} style={{ fontSize: 12 }}>
            {actionMsg.text}
          </div>
        )}

        <textarea
          value={actionNote}
          onChange={(e) => setActionNote(e.target.value)}
          placeholder="Admin note (optional)…"
          rows={2}
          disabled={hasDecision || anyPending}
          className="form-control form-control-sm mb-2"
          style={{ fontSize: 12, resize: "none", opacity: hasDecision ? 0.5 : 1 }}
        />

        {!hasDecision && (
          <>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reject reason (required for rejections)…"
              disabled={anyPending}
              className="form-control form-control-sm mb-2"
              style={{ fontSize: 12 }}
            />
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#6B7280", marginBottom: "4px" }}>
                Resubmit fields (select for resubmission):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {RESUBMIT_FIELD_OPTIONS.map((f) => {
                  const selected = resubmitFields.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setResubmitFields((prev) => selected ? prev.filter((x) => x !== f) : [...prev, f])}
                      disabled={anyPending}
                      style={{
                        padding: "3px 8px", borderRadius: "3px", fontSize: "10px", fontWeight: 500,
                        border: selected ? "1px solid #2563EB" : "1px solid #D1D5DB",
                        background: selected ? "#EFF6FF" : "white",
                        color: selected ? "#2563EB" : "#6B7280",
                        cursor: anyPending ? "not-allowed" : "pointer",
                      }}
                    >{f}</button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: "6px" }}>
          <KycActionBtn
            label="✓ Approve"
            onClick={() => approveMut.mutate()}
            loading={approveMut.isPending}
            activeColor="#16A34A"
            hoverColor="#15803D"
            isActive={currentStatus === "approved"}
            isDisabled={hasDecision}
            anyPending={anyPending}
          />
          <KycActionBtn
            label="✗ Reject"
            onClick={() => {
              if (!rejectReason.trim()) {
                showMsg("err", "Please provide a reason for rejection");
                return;
              }
              rejectMut.mutate();
            }}
            loading={rejectMut.isPending}
            activeColor="#DC2626"
            hoverColor="#B91C1C"
            isActive={currentStatus === "rejected"}
            isDisabled={hasDecision}
            anyPending={anyPending}
          />
          <KycActionBtn
            label="↩ Resubmit"
            onClick={() => resubmitMut.mutate()}
            loading={resubmitMut.isPending}
            activeColor="#2563EB"
            hoverColor="#1D4ED8"
            isActive={currentStatus === "resubmit" || currentStatus === "resubmit_required"}
            isDisabled={hasDecision}
            anyPending={anyPending}
          />
        </div>

        {hasDecision && (
          <div style={{
            marginTop: "8px", padding: "6px 10px", borderRadius: "4px",
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            fontSize: "11px", color: "#64748B", textAlign: "center",
          }}>
            Decision recorded: <strong style={{ textTransform: "capitalize" }}>{currentStatus}</strong>
          </div>
        )}
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
  const isWarning = value.startsWith("⚠");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F9FAFB" }}>
      <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{label}</span>
      <span style={{ fontSize: "11px", color: isWarning ? "#D97706" : value === "—" ? "#9CA3AF" : "#374151", fontWeight: value === "—" ? "400" : "500", fontStyle: isWarning ? "italic" : "normal", textAlign: "right", maxWidth: "200px", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function KycActionBtn({ label, onClick, loading, activeColor, hoverColor, isActive, isDisabled, anyPending }: {
  label: string;
  onClick: () => void;
  loading: boolean;
  activeColor: string;
  hoverColor: string;
  isActive: boolean;
  isDisabled: boolean;
  anyPending: boolean;
}) {
  const disabled = loading || isDisabled || (anyPending && !loading);

  const bg = disabled ? "#E5E7EB" : activeColor;
  const textColor = disabled ? "#9CA3AF" : "white";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = activeColor; }}
      style={{
        flex: 1, padding: "7px 4px",
        borderRadius: "4px", border: isActive ? `2px solid ${activeColor}` : "none",
        background: loading ? "#9CA3AF" : bg,
        color: textColor, fontSize: "11px", fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s, opacity 0.15s",
        opacity: isDisabled ? 0.5 : 1,
        position: "relative",
      }}
    >
      {loading ? "Processing…" : isActive ? `${label} ✔` : label}
    </button>
  );
}
