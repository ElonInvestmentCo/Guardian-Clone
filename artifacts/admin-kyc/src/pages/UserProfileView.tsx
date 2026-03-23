import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserDetails,
  getUserDocuments,
  fetchDocumentBlobUrl,
  approveUser,
  rejectUser,
  requestResubmission,
  suspendUser,
  banUser,
  reactivateUser,
  assignRole,
  setBalance,
  flagUser,
  resetPassword,
  deleteUser,
  updateUser,
  type AuditEntry,
  type DocumentInfo,
} from "@/lib/api";
import { formatDate, getProfileField, riskColors, actionTypeLabel, actionTypeColor } from "@/lib/utils";
import { RiskBadge, StatusBadge, SeverityBadge } from "@/components/Badges";

type ProfileTab = "profile" | "risk" | "audit" | "balance" | "actions";

interface Props {
  email: string;
  onBack: () => void;
}

const ROLE_OPTIONS = ["user", "vip", "restricted", "admin"];

export default function UserProfileView({ email, onBack }: Props) {
  const [tab,         setTab]         = useState<ProfileTab>("profile");
  const [actionNote,  setActionNote]  = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [flagReason,  setFlagReason]  = useState("");
  const [banReason,   setBanReason]   = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [newBalance,  setNewBalance]  = useState("");
  const [newProfit,   setNewProfit]   = useState("");
  const [editFirst,   setEditFirst]   = useState("");
  const [editLast,    setEditLast]    = useState("");
  const [editMode,    setEditMode]    = useState(false);
  const [actionMsg,   setActionMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel,  setConfirmDel]  = useState(false);

  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["user-details", email],
    queryFn: () => getUserDetails(email),
  });

  const { data: docsData } = useQuery({
    queryKey: ["user-documents", email],
    queryFn: () => getUserDocuments(email),
  });

  const showMsg = (type: "ok" | "err", text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 5000);
  };

  const refresh = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["all-users"] });
    qc.invalidateQueries({ queryKey: ["kyc-queue"] });
    qc.invalidateQueries({ queryKey: ["global-audit"] });
  };

  const approveMut   = useMutation({ mutationFn: () => approveUser(email, actionNote || undefined),                    onSuccess: () => { showMsg("ok", "User approved successfully"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const rejectMut    = useMutation({ mutationFn: () => rejectUser(email, rejectReason, actionNote || undefined), onSuccess: () => { showMsg("ok", "User rejected"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const resubmitMut  = useMutation({ mutationFn: () => requestResubmission(email, undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "Resubmission requested — user notified"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const suspendMut   = useMutation({ mutationFn: () => suspendUser(email, actionNote || undefined),                    onSuccess: () => { showMsg("ok", "User suspended"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const banMut       = useMutation({ mutationFn: () => banUser(email, banReason || undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "User banned"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const reactivateMut = useMutation({ mutationFn: () => reactivateUser(email, actionNote || undefined),                onSuccess: () => { showMsg("ok", "User reactivated"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const roleMut      = useMutation({ mutationFn: () => assignRole(email, selectedRole, actionNote || undefined),       onSuccess: () => { showMsg("ok", `Role set to ${selectedRole}`); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const balanceMut   = useMutation({ mutationFn: () => setBalance(email, Number(newBalance), Number(newProfit), actionNote || undefined), onSuccess: () => { showMsg("ok", "Balance updated"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const flagMut      = useMutation({ mutationFn: () => flagUser(email, flagReason || undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "User flagged"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const resetPwMut   = useMutation({ mutationFn: () => resetPassword(email, actionNote || undefined),                  onSuccess: () => { showMsg("ok", "Password reset"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const updateMut    = useMutation({ mutationFn: () => updateUser(email, editFirst || undefined, editLast || undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "Profile updated"); setEditMode(false); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const deleteMut    = useMutation({ mutationFn: () => deleteUser(email, actionNote || undefined),                     onSuccess: () => { showMsg("ok", "User deleted"); onBack(); }, onError: (e: Error) => showMsg("err", e.message) });

  const profile  = data?.profile  ?? {};
  const risk     = data?.risk;
  const auditLog = data?.auditLog ?? [];
  const master   = data?.master   ?? {};

  const pf = (step: string, field: string) => getProfileField(profile, step, field);
  const currentStatus = (master.status as string) ?? (profile.status as string) ?? "pending";
  const currentRole   = (master.role   as string) ?? (profile.role   as string) ?? "user";
  const userName      = [pf("personal", "firstName"), pf("personal", "lastName")].join(" ").trim().replace(/—/g, "").trim() || email;

  const kycDecisionStatuses = ["approved", "rejected", "resubmit"] as const;
  const hasKycDecision = (kycDecisionStatuses as readonly string[]).includes(currentStatus);
  const kycAnyPending = approveMut.isPending || rejectMut.isPending || resubmitMut.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 20px", background: "white", borderBottom: "1px solid #E5E7EB",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "none", border: "1px solid #E5E7EB",
              borderRadius: "5px", padding: "5px 10px",
              fontSize: "12px", color: "#6B7280", cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            ← Back
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#111827", whiteSpace: "nowrap" }}>
                {isLoading ? "Loading…" : userName}
              </h1>
              {!isLoading && (
                <>
                  <StatusBadge status={currentStatus as "pending"} />
                  <RoleBadgePill role={currentRole} />
                  {risk && <RiskBadge level={risk.level} score={risk.score} />}
                </>
              )}
            </div>
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{email}</div>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              padding: "5px 12px", borderRadius: "5px",
              background: "#F3F4F6", color: "#374151",
              border: "1px solid #E5E7EB", fontSize: "12px", fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "12px", flexWrap: "wrap" }}>
          {(["profile", "risk", "audit", "balance", "actions"] as ProfileTab[]).map((t) => (
            <TabBtn key={t} active={tab === t} onClick={() => setTab(t)} label={
              t === "profile" ? "Profile" :
              t === "risk"    ? `Risk${risk && risk.flags.length > 0 ? ` (${risk.flags.length})` : ""}` :
              t === "audit"   ? `Audit (${auditLog.length})` :
              t === "balance" ? "Balance" : "Admin Actions"
            } />
          ))}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {isLoading && <LoadingState />}
        {isError   && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !isError && (
          <div style={{ padding: "20px", maxWidth: "860px" }}>

            {/* ── Profile tab ─────────────────────────────────────────── */}
            {tab === "profile" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
                <Card title="Account Status">
                  <Field label="Status"        value={currentStatus} />
                  <Field label="Role"          value={currentRole} />
                  <Field label="Email"         value={email} />
                  <Field label="Created"       value={formatDate(master.createdAt as string)} />
                  <Field label="Last Updated"  value={formatDate(master.updatedAt as string)} />
                  <Field label="KYC Steps"     value={`${((profile._completedStepNumbers as number[] | undefined) ?? []).length} / 12`} />
                </Card>

                <Card title="General Details">
                  <Field label="Registration Type"  value={pf("general", "registrationType")} />
                  <Field label="Product"             value={pf("general", "product")} />
                  <Field label="How Heard"           value={pf("general", "howHeard")} />
                </Card>

                <Card title="Personal Information" headerAction={
                  editMode ? null : (
                    <button onClick={() => {
                      setEditFirst(pf("personal", "firstName").replace("—", ""));
                      setEditLast(pf("personal", "lastName").replace("—", ""));
                      setEditMode(true);
                    }} style={{ fontSize: "11px", color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: "600" }}>
                      Edit
                    </button>
                  )
                }>
                  {editMode ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontSize: "11px", color: "#9CA3AF" }}>First Name</label>
                      <input value={editFirst} onChange={(e) => setEditFirst(e.target.value)}
                        style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px" }} />
                      <label style={{ fontSize: "11px", color: "#9CA3AF" }}>Last Name</label>
                      <input value={editLast} onChange={(e) => setEditLast(e.target.value)}
                        style={{ padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px" }} />
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
                          style={{ flex: 1, padding: "6px", background: "#2563EB", color: "white", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                          {updateMut.isPending ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setEditMode(false)}
                          style={{ flex: 1, padding: "6px", background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Field label="First Name"  value={pf("personal", "firstName")} />
                      <Field label="Last Name"   value={pf("personal", "lastName")} />
                      <Field label="Phone"       value={pf("personal", "phoneNumber")} />
                      <Field label="Address"     value={pf("personal", "address")} />
                      <Field label="Apt/Suite"   value={pf("personal", "aptSuite")} />
                      <Field label="City"        value={pf("personal", "city")} />
                      <Field label="State"       value={pf("personal", "state")} />
                      <Field label="Country"     value={pf("personal", "country")} />
                      <Field label="ZIP"         value={pf("personal", "zipCode")} />
                    </>
                  )}
                </Card>

                <Card title="Professional Details">
                  <Field label="Employment Status"   value={pf("professional", "employmentStatus")} />
                  <Field label="Employer Name"       value={pf("professional", "employerName")} />
                  <Field label="Position/Title"      value={pf("professional", "positionTitle")} />
                  <Field label="Employer Address"    value={pf("professional", "employerAddress")} />
                  <Field label="Country"             value={pf("professional", "country")} />
                  <Field label="City"                value={pf("professional", "city")} />
                  <Field label="Years with Employer" value={pf("professional", "yearsWithEmployer")} />
                  <Field label="Phone"               value={pf("professional", "phoneNumber")} />
                </Card>

                <Card title="Identity & Tax">
                  <Field label="Tax Residence"    value={pf("idInformation", "taxResidenceCountry")} />
                  <Field label="Tax ID Type"      value={pf("idInformation", "taxIdType")} />
                  <Field label="Tax ID"           value={pf("idInformation", "taxId")} />
                  <Field label="Date of Birth"    value={pf("idInformation", "dateOfBirth")} />
                  <Field label="ID Type"          value={pf("idInformation", "idType")} />
                  <Field label="ID Number"        value={pf("idInformation", "idNumber")} />
                  <Field label="Country of Issue" value={pf("idInformation", "countryOfIssuance")} />
                  <Field label="Issue Date"       value={pf("idInformation", "issueDate")} />
                  <Field label="Expiration Date"  value={pf("idInformation", "expirationDate")} />
                </Card>

                <Card title="Income">
                  <Field label="Annual Income"    value={pf("income", "annualIncome")} />
                  <Field label="Net Worth"         value={pf("income", "netWorth")} />
                  <Field label="Liquid Net Worth"  value={pf("income", "liquidNetWorth")} />
                  <Field label="Tax Rate"          value={pf("income", "taxRate")} />
                </Card>

                <Card title="Risk Tolerance">
                  <Field label="Risk Level"       value={pf("riskTolerance", "riskTolerance")} />
                  <Field label="Financial Education" value={pf("riskTolerance", "hasFinancialEducation")} />
                  {(() => {
                    const priorities = (profile.riskTolerance as Record<string, unknown> | undefined)?.strategyPriorities as Record<string, string> | undefined;
                    if (!priorities || Object.keys(priorities).length === 0) return <Field label="Strategy Priorities" value="—" />;
                    return Object.entries(priorities).map(([strategy, priority]) => (
                      <Field key={strategy} label={strategy} value={`Priority ${priority}`} />
                    ));
                  })()}
                </Card>

                <Card title="Financial Situation">
                  <Field label="Annual Expenses"   value={pf("financialSituation", "annualExpense")} />
                  <Field label="Special Expenses"  value={pf("financialSituation", "specialExpense")} />
                  <Field label="Liquidity Needs"   value={pf("financialSituation", "liquidityNeeds")} />
                  <Field label="Time Horizon"      value={pf("financialSituation", "investmentTimeHorizon")} />
                </Card>

                <Card title="Investment Experience">
                  {(() => {
                    const inv = (profile.investmentExperience as Record<string, unknown> | undefined)?.investments as Record<string, { enabled: boolean; years: string; transactions: string; knowledge: string }> | undefined;
                    if (!inv) return <Field label="Investments" value="—" />;
                    const enabled = Object.entries(inv).filter(([, v]) => v.enabled);
                    if (enabled.length === 0) return <Field label="Investments" value="None selected" />;
                    return enabled.map(([key, v]) => (
                      <div key={key} style={{ marginBottom: "8px", padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                        <div style={{ fontSize: "11px", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>{key}</div>
                        <div style={{ fontSize: "11px", color: "#6B7280" }}>
                          Years: {v.years} | Transactions: {v.transactions} | Knowledge: {v.knowledge}
                        </div>
                      </div>
                    ));
                  })()}
                </Card>

                <Card title="Funding Details">
                  {(() => {
                    const sources = (profile.fundingDetails as Record<string, unknown> | undefined)?.fundingSources as string[] | undefined;
                    return <Field label="Funding Sources" value={sources && sources.length > 0 ? sources.join(", ") : "—"} />;
                  })()}
                  <Field label="Bank Name"       value={pf("fundingDetails", "bankName")} />
                  <Field label="ABA/SWIFT"       value={pf("fundingDetails", "abaSwift")} />
                  <Field label="Account Name"    value={pf("fundingDetails", "accountName")} />
                  <Field label="Account Number"  value={pf("fundingDetails", "accountNumber")} />
                  <Field label="Account Type"    value={pf("fundingDetails", "accountType")} />
                </Card>

                <Card title="Disclosures">
                  <Field label="Tax Withholding"    value={pf("disclosures", "taxWithholding")} />
                  <Field label="Initial Deposit"    value={pf("disclosures", "initialDeposit")} />
                  <Field label="Wants Margin"       value={pf("disclosures", "wantsMargin")} />
                  <Field label="Partnership Check"  value={pf("disclosures", "partnershipCheck")} />
                </Card>

                <Card title="Signatures">
                  <Field label="Trading Plan"          value={pf("signatures", "tradingPlan")} />
                  <Field label="Electronic Delivery"   value={pf("signatures", "electronicDelivery")} />
                  <Field label="Has Signed"            value={pf("signatures", "hasSigned")} />
                  <Field label="Signature Name"        value={pf("signatures", "signatureName")} />
                </Card>

                <Card title="Uploaded Documents">
                  {(() => {
                    const docs = docsData?.documents;
                    if (!docs || Object.keys(docs).length === 0) {
                      return <div style={{ fontSize: "12px", color: "#9CA3AF", padding: "8px 0" }}>No documents uploaded</div>;
                    }
                    return Object.entries(docs).map(([role, doc]) => (
                      <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "#374151" }}>{role.replace(/_/g, " ").toUpperCase()}</div>
                          <div style={{ fontSize: "10px", color: doc.exists ? "#16A34A" : "#DC2626" }}>
                            {doc.exists ? "File available" : "File missing"}
                          </div>
                        </div>
                        {doc.exists && (
                          <button
                            onClick={async () => {
                              try {
                                const blobUrl = await fetchDocumentBlobUrl(email, role);
                                window.open(blobUrl, "_blank");
                              } catch {
                                alert("Failed to load document");
                              }
                            }}
                            style={{
                              fontSize: "11px", color: "#2563EB", fontWeight: "600",
                              cursor: "pointer", padding: "4px 8px",
                              border: "1px solid #BFDBFE", borderRadius: "4px",
                              background: "#EFF6FF",
                            }}
                          >
                            View
                          </button>
                        )}
                      </div>
                    ));
                  })()}
                </Card>
              </div>
            )}

            {/* ── Risk tab ──────────────────────────────────────────── */}
            {tab === "risk" && (
              <div style={{ maxWidth: "540px" }}>
                {risk ? (
                  <>
                    <div style={{
                      background: `${riskColors(risk.level).bg}`, border: `1px solid ${riskColors(risk.level).border}`,
                      borderRadius: "8px", padding: "16px 18px", marginBottom: "16px",
                    }}>
                      <div style={{ fontSize: "11px", color: "#6B7280", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk Score</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                        <span style={{ fontSize: "44px", fontWeight: "800", color: riskColors(risk.level).text }}>{risk.score}</span>
                        <RiskBadge level={risk.level} />
                      </div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>Evaluated {formatDate(risk.evaluatedAt)}</div>
                    </div>

                    {risk.flags.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 0", color: "#6B7280", fontSize: "13px" }}>
                        ✓ No fraud flags detected
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#374151", letterSpacing: "0.05em", marginBottom: "10px" }}>
                          {risk.flags.length} FLAG{risk.flags.length !== 1 ? "S" : ""} DETECTED
                        </div>
                        {risk.flags.map((flag, i) => (
                          <div key={i} style={{
                            border: "1px solid #E5E7EB", borderRadius: "6px",
                            padding: "12px 14px", marginBottom: "8px",
                            borderLeft: `3px solid ${riskColors("high").text}`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
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
              </div>
            )}

            {/* ── Audit tab ─────────────────────────────────────────── */}
            {tab === "audit" && (
              <div style={{ maxWidth: "600px" }}>
                {auditLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>No audit events yet</div>
                ) : (
                  <div>
                    {[...auditLog].reverse().map((entry: AuditEntry, i) => {
                      const colors = actionTypeColor(entry.actionType);
                      return (
                        <div key={i} style={{
                          borderLeft: `2px solid ${colors.dot}`,
                          paddingLeft: "14px", marginBottom: "16px", position: "relative",
                        }}>
                          <div style={{
                            position: "absolute", left: "-5px", top: "4px",
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: colors.dot, border: "2px solid white",
                            boxShadow: `0 0 0 1px ${colors.dot}`,
                          }} />
                          <div style={{ fontSize: "10px", color: "#9CA3AF", marginBottom: "2px" }}>
                            {formatDate(entry.timestamp)} · {entry.actor}
                          </div>
                          <div style={{ fontWeight: "700", fontSize: "12px", color: colors.text }}>
                            {actionTypeLabel(entry.actionType)}
                          </div>
                          {entry.note && <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>Note: {entry.note}</div>}
                          {entry.reason && <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>Reason: {entry.reason}</div>}
                          {entry.fields && entry.fields.length > 0 && (
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Fields: {entry.fields.join(", ")}</div>
                          )}
                          {entry.meta && Object.keys(entry.meta).length > 0 && (
                            <div style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "monospace", marginTop: "2px" }}>
                              {JSON.stringify(entry.meta)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Balance tab ───────────────────────────────────────── */}
            {tab === "balance" && (
              <div style={{ maxWidth: "500px" }}>
                <Card title="Current Balance">
                  <Field label="Balance" value={`$${((profile._balance as Record<string, number> | undefined)?.balance ?? 0).toLocaleString()}`} />
                  <Field label="Profit"  value={`$${((profile._balance as Record<string, number> | undefined)?.profit  ?? 0).toLocaleString()}`} />
                  <Field label="Last Updated" value={formatDate((profile._balance as Record<string, string> | undefined)?.updatedAt)} />
                </Card>

                <Card title="Set Balance">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>New Balance ($)</label>
                        <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)}
                          placeholder="0.00"
                          style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Profit ($)</label>
                        <input type="number" value={newProfit} onChange={(e) => setNewProfit(e.target.value)}
                          placeholder="0.00"
                          style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px" }} />
                      </div>
                    </div>
                    <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Admin note (optional)…" rows={2}
                      style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", resize: "none", fontFamily: "inherit" }} />
                    <button onClick={() => balanceMut.mutate()} disabled={balanceMut.isPending || !newBalance || !newProfit}
                      style={{
                        padding: "8px", background: "#2563EB", color: "white",
                        border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "700",
                        cursor: balanceMut.isPending || !newBalance ? "not-allowed" : "pointer",
                        opacity: !newBalance || !newProfit ? 0.5 : 1,
                      }}>
                      {balanceMut.isPending ? "Updating…" : "Update Balance"}
                    </button>
                  </div>
                </Card>

                {Array.isArray(profile._balanceHistory) && profile._balanceHistory.length > 0 && (
                  <Card title="Balance History">
                    {(profile._balanceHistory as Array<Record<string, unknown>>).slice().reverse().map((h, i) => (
                      <div key={i} style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: "8px", marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                          <span style={{ color: "#9CA3AF" }}>{formatDate(h.timestamp as string)}</span>
                          <span style={{ color: "#374151", fontWeight: "600" }}>${Number(h.newBalance).toLocaleString()}</span>
                        </div>
                        {h.note ? <div style={{ fontSize: "11px", color: "#6B7280" }}>Note: {String(h.note)}</div> : null}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {/* ── Actions tab ───────────────────────────────────────── */}
            {tab === "actions" && (
              <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "16px" }}>

                {actionMsg && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "6px", fontSize: "13px",
                    background: actionMsg.type === "ok" ? "#F0FDF4" : "#FEF2F2",
                    color: actionMsg.type === "ok" ? "#16A34A" : "#DC2626",
                    border: `1px solid ${actionMsg.type === "ok" ? "#BBF7D0" : "#FECACA"}`,
                  }}>
                    {actionMsg.text}
                  </div>
                )}

                <Card title="Admin Note (applies to all actions)">
                  <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Optional admin note for the audit log…" rows={2}
                    style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", resize: "none", fontFamily: "inherit" }} />
                </Card>

                <Card title="KYC Decision">
                  {hasKycDecision && (
                    <div style={{
                      marginBottom: "12px", padding: "8px 12px", borderRadius: "6px",
                      background: currentStatus === "approved" ? "#F0FDF4" : currentStatus === "rejected" ? "#FEF2F2" : "#EFF6FF",
                      border: `1px solid ${currentStatus === "approved" ? "#BBF7D0" : currentStatus === "rejected" ? "#FECACA" : "#BFDBFE"}`,
                      fontSize: "12px",
                      color: currentStatus === "approved" ? "#16A34A" : currentStatus === "rejected" ? "#DC2626" : "#2563EB",
                      fontWeight: "600",
                    }}>
                      Decision recorded: <span style={{ textTransform: "capitalize" }}>{currentStatus}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <KycDecisionBtn
                      label="✓ Approve"
                      onClick={() => approveMut.mutate()}
                      loading={approveMut.isPending}
                      activeColor="#16A34A" hoverColor="#15803D"
                      isActive={currentStatus === "approved"}
                      isDisabled={hasKycDecision && currentStatus !== "approved"}
                      anyPending={kycAnyPending}
                    />
                    <KycDecisionBtn
                      label="↩ Resubmit"
                      onClick={() => resubmitMut.mutate()}
                      loading={resubmitMut.isPending}
                      activeColor="#2563EB" hoverColor="#1D4ED8"
                      isActive={currentStatus === "resubmit"}
                      isDisabled={hasKycDecision && currentStatus !== "resubmit"}
                      anyPending={kycAnyPending}
                    />
                    <KycDecisionBtn
                      label="✗ Reject"
                      onClick={() => {
                        if (!rejectReason.trim()) {
                          showMsg("err", "Please provide a reason for rejection");
                          return;
                        }
                        rejectMut.mutate();
                      }}
                      loading={rejectMut.isPending}
                      activeColor="#DC2626" hoverColor="#B91C1C"
                      isActive={currentStatus === "rejected"}
                      isDisabled={hasKycDecision && currentStatus !== "rejected"}
                      anyPending={kycAnyPending}
                    />
                  </div>
                  {!hasKycDecision && (
                    <div style={{ marginTop: "8px" }}>
                      <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Reject reason <span style={{ color: "#DC2626" }}>*</span></label>
                      <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Required when rejecting…"
                        disabled={kycAnyPending}
                        style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px" }} />
                    </div>
                  )}
                  {currentStatus === "rejected" && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                      <strong>Rejected</strong> — user has been notified with the reason and next steps.
                    </div>
                  )}
                  {currentStatus === "resubmit" && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                      <strong>Resubmission requested</strong> — user has been prompted to update their documents.
                    </div>
                  )}
                </Card>

                <Card title="Account Controls">
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <ActionBtn label="▶ Reactivate" onClick={() => reactivateMut.mutate()} loading={reactivateMut.isPending} color="#16A34A" hoverColor="#15803D" />
                    <ActionBtn label="⏸ Suspend"    onClick={() => suspendMut.mutate()}    loading={suspendMut.isPending}    color="#EA580C" hoverColor="#C2410C" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Ban reason</label>
                    <input value={banReason} onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for ban…"
                      style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", marginBottom: "6px" }} />
                    <ActionBtn label="⛔ Ban User" onClick={() => banMut.mutate()} loading={banMut.isPending} color="#7C3AED" hoverColor="#6D28D9" fullWidth />
                  </div>
                </Card>

                <Card title="Role Management">
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                        Current: <strong>{currentRole}</strong>
                      </label>
                      <select value={selectedRole || currentRole} onChange={(e) => setSelectedRole(e.target.value)}
                        style={{ width: "100%", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px" }}>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <ActionBtn label="Assign Role" onClick={() => roleMut.mutate()} loading={roleMut.isPending} color="#1E3A5F" hoverColor="#162D4A" />
                  </div>
                </Card>

                <Card title="Security">
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <ActionBtn label="🔒 Reset Password" onClick={() => resetPwMut.mutate()} loading={resetPwMut.isPending} color="#374151" hoverColor="#1F2937" />
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Flag reason</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input value={flagReason} onChange={(e) => setFlagReason(e.target.value)}
                          placeholder="Reason…"
                          style={{ flex: 1, padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px" }} />
                        <ActionBtn label="⚑ Flag" onClick={() => flagMut.mutate()} loading={flagMut.isPending} color="#EA580C" hoverColor="#C2410C" />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Danger Zone" borderColor="#FECACA">
                  {confirmDel ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "#DC2626" }}>
                        This will permanently delete <strong>{email}</strong> and all their data. This cannot be undone.
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <ActionBtn label="Confirm Delete" onClick={() => deleteMut.mutate()} loading={deleteMut.isPending} color="#DC2626" hoverColor="#B91C1C" fullWidth />
                        <button onClick={() => setConfirmDel(false)}
                          style={{ flex: 1, padding: "8px", background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", borderRadius: "5px", fontSize: "13px", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(true)}
                      style={{
                        width: "100%", padding: "8px", background: "none",
                        border: "1px solid #FECACA", color: "#DC2626",
                        borderRadius: "5px", fontSize: "13px", fontWeight: "600",
                        cursor: "pointer", transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                    >
                      Delete User Account
                    </button>
                  )}
                </Card>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: "5px",
      border: "none",
      background: active ? "#1E3A5F" : "#F3F4F6",
      color: active ? "white" : "#6B7280",
      fontSize: "12px", fontWeight: "600",
      cursor: "pointer", whiteSpace: "nowrap",
      transition: "background 0.12s",
    }}>
      {label}
    </button>
  );
}

function Card({ title, children, headerAction, borderColor }: {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: "white", border: `1px solid ${borderColor ?? "#E5E7EB"}`,
      borderRadius: "8px", overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid #F3F4F6",
        background: "#FAFAFA",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "#9CA3AF" }}>
          {title}
        </div>
        {headerAction}
      </div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F9FAFB", gap: "8px" }}>
      <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "11px", color: "#374151", fontWeight: value === "—" ? "400" : "500", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", overflowWrap: "break-word" }}>
        {value}
      </span>
    </div>
  );
}

function RoleBadgePill({ role }: { role: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    vip:        { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    admin:      { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    restricted: { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF" },
    user:       { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  };
  const c = map[role] ?? map.user;
  return (
    <span style={{
      display: "inline-block",
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: "4px", padding: "2px 8px",
      fontSize: "11px", fontWeight: "600", textTransform: "capitalize",
    }}>
      {role}
    </span>
  );
}

function ActionBtn({ label, onClick, loading, color, hoverColor, fullWidth }: {
  label: string; onClick: () => void; loading: boolean;
  color: string; hoverColor: string; fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = color; }}
      style={{
        flex: fullWidth ? 1 : undefined,
        padding: "8px 14px",
        borderRadius: "5px", border: "none",
        background: loading ? "#9CA3AF" : color,
        color: "white", fontSize: "13px", fontWeight: "700",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.15s", whiteSpace: "nowrap",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}

function KycDecisionBtn({ label, onClick, loading, activeColor, hoverColor, isActive, isDisabled, anyPending, fullWidth }: {
  label: string;
  onClick: () => void;
  loading: boolean;
  activeColor: string;
  hoverColor: string;
  isActive: boolean;
  isDisabled: boolean;
  anyPending: boolean;
  fullWidth?: boolean;
}) {
  const disabled = loading || isDisabled || (anyPending && !loading);

  const bg = isActive
    ? activeColor
    : disabled
      ? "#E5E7EB"
      : activeColor;

  const textColor = isActive || !disabled ? "white" : "#9CA3AF";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled && !isActive) (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { if (!disabled && !isActive) (e.currentTarget as HTMLElement).style.background = activeColor; }}
      style={{
        flex: fullWidth ? 1 : undefined,
        padding: "8px 14px",
        borderRadius: "5px",
        border: isActive ? `2px solid ${activeColor}` : "none",
        background: loading ? "#9CA3AF" : bg,
        color: textColor,
        fontSize: "13px", fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.15s, opacity 0.15s",
        whiteSpace: "nowrap",
        opacity: isDisabled ? 0.4 : 1,
      }}
    >
      {loading ? "Processing…" : isActive ? `${label} ✔` : label}
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #E5E7EB", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Loading profile…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
      <p style={{ color: "#DC2626", fontSize: "13px", margin: "0 0 12px" }}>Failed to load profile.</p>
      <button onClick={onRetry} style={{ padding: "7px 18px", borderRadius: "5px", background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}
