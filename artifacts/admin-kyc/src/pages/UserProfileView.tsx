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
  TRANSACTION_TYPES,
  type TransactionType,
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
  const [resubmitFields, setResubmitFields] = useState<string[]>([]);
  const [flagReason,  setFlagReason]  = useState("");
  const [banReason,   setBanReason]   = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [newBalance,      setNewBalance]      = useState("");
  const [newProfit,       setNewProfit]       = useState("");
  const [txType,          setTxType]          = useState<TransactionType>("adjustment");
  const [balanceNote,     setBalanceNote]     = useState("");
  const [confirmBalance,  setConfirmBalance]  = useState(false);
  const [confirmSuspend,  setConfirmSuspend]  = useState(false);
  const [confirmBan,      setConfirmBan]      = useState(false);
  const [confirmRole,     setConfirmRole]     = useState(false);
  const [confirmResetPw,  setConfirmResetPw]  = useState(false);
  const [editFirst,       setEditFirst]       = useState("");
  const [editLast,        setEditLast]        = useState("");
  const [editMode,        setEditMode]        = useState(false);
  const [actionMsg,       setActionMsg]       = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmDel,      setConfirmDel]      = useState(false);
  const [auditFilter,     setAuditFilter]     = useState("");

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
  const resubmitMut  = useMutation({ mutationFn: () => requestResubmission(email, resubmitFields.length > 0 ? resubmitFields : undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "Resubmission requested — user notified"); setResubmitFields([]); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const suspendMut   = useMutation({ mutationFn: () => suspendUser(email, actionNote || undefined),                    onSuccess: () => { showMsg("ok", "User suspended"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const banMut       = useMutation({ mutationFn: () => banUser(email, banReason || undefined, actionNote || undefined), onSuccess: () => { showMsg("ok", "User banned"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const reactivateMut = useMutation({ mutationFn: () => reactivateUser(email, actionNote || undefined),                onSuccess: () => { showMsg("ok", "User reactivated"); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const roleMut      = useMutation({ mutationFn: () => assignRole(email, selectedRole, actionNote || undefined),       onSuccess: () => { showMsg("ok", `Role set to ${selectedRole}`); refresh(); }, onError: (e: Error) => showMsg("err", e.message) });
  const balanceMut   = useMutation({ mutationFn: () => setBalance(email, Number(newBalance), Number(newProfit), balanceNote, txType), onSuccess: () => { showMsg("ok", "Balance updated successfully"); setConfirmBalance(false); setNewBalance(""); setNewProfit(""); setBalanceNote(""); setTxType("adjustment"); refresh(); }, onError: (e: Error) => { showMsg("err", e.message); setConfirmBalance(false); } });
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

  const kycDecisionStatuses = ["approved", "rejected", "resubmit", "resubmit_required"] as const;
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
          <button onClick={onBack} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1" />Back
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
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <i className="bi bi-arrow-clockwise me-1" />Refresh
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
                  <Field label="KYC Steps"     value={`${((profile._completedStepNumbers as number[] | undefined) ?? []).length} / ${(profile.totalSteps as number | undefined) ?? 12}`} />
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
                  <Field label="Apt/Suite"           value={pf("professional", "aptSuiteNo")} />
                  <Field label="City"                value={pf("professional", "city")} />
                  <Field label="State"               value={pf("professional", "state")} />
                  <Field label="Country"             value={pf("professional", "country")} />
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
                  <Field label="Risk Level"            value={pf("riskTolerance", "riskTolerance")} />
                  <Field label="Financial Education"   value={pf("riskTolerance", "hasFinancialEducation")} />
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
                  <Field label="Tax Withholding"         value={pf("disclosures", "taxWithholding")} />
                  <Field label="Initial Deposit"         value={pf("disclosures", "initialDeposit")} />
                  <Field label="Wants Margin"            value={pf("disclosures", "wantsMargin")} />
                  <Field label="Partnership Check"       value={pf("disclosures", "partnershipCheck")} />
                  <Field label="Existing Account"                  value={pf("disclosures", "q1")} />
                  <Field label="Related Entity Relationship"       value={pf("disclosures", "q2")} />
                  <Field label="Director/10% Holder (Public Co.)"  value={pf("disclosures", "q3")} />
                  <Field label="FINRA/Broker-Dealer Affiliated"    value={pf("disclosures", "q4")} />
                  <Field label="Senior Financial Officer"          value={pf("disclosures", "q5")} />
                  <Field label="Senior Political Figure"           value={pf("disclosures", "q6")} />
                  <Field label="Discretionary Authority"           value={pf("disclosures", "q7")} />
                  <Field label="Day Trading Capital ($25K+)"       value={pf("disclosures", "q8")} />
                  <Field label="High Risk Objective"               value={pf("disclosures", "q9")} />
                  <Field label="Can Withstand Total Loss"          value={pf("disclosures", "q10")} />
                </Card>

                <Card title="Signatures & Consents">
                  <Field label="Trading Plan"          value={pf("signatures", "tradingPlan")} />
                  <Field label="Electronic Delivery"   value={pf("signatures", "electronicDelivery")} />
                  <Field label="Has Signed"            value={pf("signatures", "hasSigned")} />
                  <Field label="Signature Name"        value={pf("signatures", "signatureName")} />
                  {(() => {
                    const consents = (profile.signatures as Record<string, unknown> | undefined)?.consents as Record<string, boolean> | undefined;
                    if (!consents || Object.keys(consents).length === 0) return null;
                    return Object.entries(consents).map(([name, agreed]) => (
                      <Field key={name} label={name} value={agreed ? "Yes" : "No"} />
                    ));
                  })()}
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
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 300000);
                              } catch {
                                showMsg("err", "Failed to load document");
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
                {auditLog.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <input
                      value={auditFilter}
                      onChange={(e) => setAuditFilter(e.target.value)}
                      placeholder="Filter audit log (e.g. BALANCE, APPROVE, BAN)…"
                      style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "12px" }}
                    />
                  </div>
                )}
                {auditLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF", fontSize: "13px" }}>No audit events yet</div>
                ) : (
                  <div>
                    {[...auditLog].reverse().filter((entry: AuditEntry) => {
                      if (!auditFilter.trim()) return true;
                      const q = auditFilter.toLowerCase();
                      return (
                        (entry.actionType ?? "").toLowerCase().includes(q) ||
                        (entry.actor ?? "").toLowerCase().includes(q) ||
                        (entry.note ?? "").toLowerCase().includes(q) ||
                        (entry.reason ?? "").toLowerCase().includes(q) ||
                        JSON.stringify(entry.meta ?? {}).toLowerCase().includes(q)
                      );
                    }).map((entry: AuditEntry, i) => {
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
              <div style={{ maxWidth: "560px" }}>
                {actionMsg && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px",
                    background: actionMsg.type === "ok" ? "#F0FDF4" : "#FEF2F2",
                    color: actionMsg.type === "ok" ? "#16A34A" : "#DC2626",
                    border: `1px solid ${actionMsg.type === "ok" ? "#BBF7D0" : "#FECACA"}`,
                  }}>{actionMsg.text}</div>
                )}

                <Card title="Current Balance">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", padding: "4px 0" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Balance</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#111827" }}>
                        ${((profile._balance as Record<string, number> | undefined)?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Profit</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: ((profile._balance as Record<string, number> | undefined)?.profit ?? 0) >= 0 ? "#16A34A" : "#DC2626" }}>
                        ${((profile._balance as Record<string, number> | undefined)?.profit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Last Updated</div>
                      <div style={{ fontSize: "12px", fontWeight: "500", color: "#6B7280", marginTop: "4px" }}>
                        {formatDate((profile._balance as Record<string, string> | undefined)?.updatedAt)}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Update Balance / Profit">
                  {!confirmBalance ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                          Transaction Type <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <select value={txType} onChange={(e) => setTxType(e.target.value as TransactionType)}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px", background: "white" }}>
                          {TRANSACTION_TYPES.map((t) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                            New Balance ($) <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)}
                            placeholder="0.00" min="0" step="0.01"
                            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                            Profit ($) <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input type="number" value={newProfit} onChange={(e) => setNewProfit(e.target.value)}
                            placeholder="0.00" step="0.01"
                            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "13px" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>
                          Reason / Note <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <textarea value={balanceNote} onChange={(e) => setBalanceNote(e.target.value)}
                          placeholder="Required — describe the reason for this balance change…" rows={2}
                          style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${!balanceNote.trim() && newBalance ? "#FECACA" : "#E5E7EB"}`, borderRadius: "4px", fontSize: "12px", resize: "none", fontFamily: "inherit" }} />
                      </div>
                      <button
                        onClick={() => {
                          if (!newBalance || !newProfit) { showMsg("err", "Balance and profit values are required"); return; }
                          if (Number(newBalance) < 0) { showMsg("err", "Balance cannot be negative"); return; }
                          if (!balanceNote.trim()) { showMsg("err", "A reason/note is required for all balance changes"); return; }
                          setConfirmBalance(true);
                        }}
                        disabled={!newBalance || !newProfit || !balanceNote.trim()}
                        style={{
                          padding: "10px", background: "#2563EB", color: "white",
                          border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "700",
                          cursor: !newBalance || !newProfit || !balanceNote.trim() ? "not-allowed" : "pointer",
                          opacity: !newBalance || !newProfit || !balanceNote.trim() ? 0.5 : 1,
                        }}>
                        Review Changes
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ padding: "14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "6px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#92400E", marginBottom: "10px" }}>
                          Confirm Balance Change
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                          <div>
                            <span style={{ color: "#9CA3AF" }}>Current Balance:</span>{" "}
                            <strong>${((profile._balance as Record<string, number> | undefined)?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#9CA3AF" }}>New Balance:</span>{" "}
                            <strong style={{ color: "#2563EB" }}>${Number(newBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#9CA3AF" }}>Current Profit:</span>{" "}
                            <strong>${((profile._balance as Record<string, number> | undefined)?.profit ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#9CA3AF" }}>New Profit:</span>{" "}
                            <strong style={{ color: Number(newProfit) >= 0 ? "#16A34A" : "#DC2626" }}>${Number(newProfit).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>
                        <div style={{ marginTop: "8px", fontSize: "12px" }}>
                          <span style={{ color: "#9CA3AF" }}>Type:</span>{" "}
                          <TxTypeBadge type={txType} />
                        </div>
                        <div style={{ marginTop: "6px", fontSize: "12px" }}>
                          <span style={{ color: "#9CA3AF" }}>Reason:</span>{" "}
                          <span style={{ color: "#374151" }}>{balanceNote}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => balanceMut.mutate()} disabled={balanceMut.isPending}
                          style={{
                            flex: 1, padding: "10px", background: balanceMut.isPending ? "#9CA3AF" : "#16A34A", color: "white",
                            border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: "700",
                            cursor: balanceMut.isPending ? "not-allowed" : "pointer",
                          }}>
                          {balanceMut.isPending ? "Processing…" : "Confirm & Apply"}
                        </button>
                        <button onClick={() => setConfirmBalance(false)} disabled={balanceMut.isPending}
                          style={{
                            flex: 1, padding: "10px", background: "#F3F4F6", color: "#374151",
                            border: "1px solid #E5E7EB", borderRadius: "5px", fontSize: "13px", cursor: "pointer",
                          }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </Card>

                {Array.isArray(profile._balanceHistory) && profile._balanceHistory.length > 0 && (
                  <Card title={`Transaction History (${(profile._balanceHistory as unknown[]).length})`}>
                    <div style={{ maxHeight: "400px", overflow: "auto" }}>
                      {(profile._balanceHistory as Array<Record<string, unknown>>).slice().reverse().map((h, i) => {
                        const balChange = Number(h.balanceChange ?? (Number(h.newBalance) - Number(h.prevBalance)));
                        const profChange = Number(h.profitChange ?? (Number(h.newProfit) - Number(h.prevProfit)));
                        const tType = (h.transactionType as string) || "adjustment";
                        return (
                          <div key={i} style={{
                            borderBottom: "1px solid #F3F4F6", padding: "10px 0",
                            borderLeft: `3px solid ${txTypeColor(tType)}`, paddingLeft: "10px", marginBottom: "2px",
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <TxTypeBadge type={tType} />
                                <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{formatDate(h.timestamp as string)}</span>
                              </div>
                              <span style={{ fontSize: "11px", color: "#374151", fontWeight: "600" }}>
                                ${Number(h.newBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", fontSize: "11px", marginBottom: "2px" }}>
                              <span style={{ color: "#9CA3AF" }}>
                                Balance: <span style={{ color: balChange >= 0 ? "#16A34A" : "#DC2626", fontWeight: "600" }}>
                                  {balChange >= 0 ? "+" : ""}{balChange.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              </span>
                              <span style={{ color: "#9CA3AF" }}>
                                Profit: <span style={{ color: profChange >= 0 ? "#16A34A" : "#DC2626", fontWeight: "600" }}>
                                  {profChange >= 0 ? "+" : ""}{profChange.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              </span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                              Prev: ${Number(h.prevBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })} / ${Number(h.prevProfit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                            {h.note ? <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Note: {String(h.note)}</div> : null}
                            {h.actor ? <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "1px" }}>by {String(h.actor)}</div> : null}
                          </div>
                        );
                      })}
                    </div>
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
                      isDisabled={hasKycDecision}
                      anyPending={kycAnyPending}
                    />
                    <KycDecisionBtn
                      label="↩ Resubmit"
                      onClick={() => resubmitMut.mutate()}
                      loading={resubmitMut.isPending}
                      activeColor="#2563EB" hoverColor="#1D4ED8"
                      isActive={currentStatus === "resubmit" || currentStatus === "resubmit_required"}
                      isDisabled={hasKycDecision}
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
                      isDisabled={hasKycDecision}
                      anyPending={kycAnyPending}
                    />
                  </div>
                  {!hasKycDecision && (
                    <>
                      <div style={{ marginTop: "8px" }}>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Reject reason <span style={{ color: "#DC2626" }}>*</span></label>
                        <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Required when rejecting…"
                          disabled={kycAnyPending}
                          style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px" }} />
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "6px" }}>Resubmit fields (select sections the user must correct):</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {["Personal Details", "Professional Details", "ID Information", "Income Details", "Risk Tolerance", "Financial Situation", "Investment Experience", "ID Proof Upload", "Funding Details", "Disclosures", "Signatures"].map((f) => {
                            const sel = resubmitFields.includes(f);
                            return (
                              <button key={f} type="button"
                                onClick={() => setResubmitFields((prev) => sel ? prev.filter((x) => x !== f) : [...prev, f])}
                                disabled={kycAnyPending}
                                style={{
                                  padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 500,
                                  border: sel ? "1px solid #2563EB" : "1px solid #D1D5DB",
                                  background: sel ? "#EFF6FF" : "white",
                                  color: sel ? "#2563EB" : "#6B7280",
                                  cursor: kycAnyPending ? "not-allowed" : "pointer",
                                }}
                              >{f}</button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  {currentStatus === "rejected" && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                      <strong>Rejected</strong> — user has been notified with the reason and next steps.
                    </div>
                  )}
                  {(currentStatus === "resubmit" || currentStatus === "resubmit_required") && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7280" }}>
                      <strong>Resubmission requested</strong> — user has been prompted to correct the requested fields.
                    </div>
                  )}
                  {currentStatus === "reviewing" && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#2563EB" }}>
                      <strong>Under Review</strong> — user has resubmitted corrected information. Awaiting admin decision.
                    </div>
                  )}
                </Card>

                <Card title="Account Controls">
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <ActionBtn label="▶ Reactivate" onClick={() => reactivateMut.mutate()} loading={reactivateMut.isPending} color="#16A34A" hoverColor="#15803D" />
                    {!confirmSuspend ? (
                      <ActionBtn label="⏸ Suspend" onClick={() => setConfirmSuspend(true)} loading={false} color="#EA580C" hoverColor="#C2410C" />
                    ) : (
                      <ConfirmInline
                        message={`Suspend ${userName}? They will lose access until reactivated.`}
                        onConfirm={() => { suspendMut.mutate(); setConfirmSuspend(false); }}
                        onCancel={() => setConfirmSuspend(false)}
                        loading={suspendMut.isPending}
                        color="#EA580C"
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Ban reason</label>
                    <input value={banReason} onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for ban…"
                      style={{ width: "100%", boxSizing: "border-box", padding: "7px 9px", border: "1px solid #E5E7EB", borderRadius: "4px", fontSize: "12px", marginBottom: "6px" }} />
                    {!confirmBan ? (
                      <ActionBtn label="⛔ Ban User" onClick={() => {
                        if (!banReason.trim()) { showMsg("err", "Please provide a reason for the ban"); return; }
                        setConfirmBan(true);
                      }} loading={false} color="#7C3AED" hoverColor="#6D28D9" fullWidth />
                    ) : (
                      <ConfirmInline
                        message={`Permanently ban ${userName}? Reason: "${banReason}"`}
                        onConfirm={() => { banMut.mutate(); setConfirmBan(false); }}
                        onCancel={() => setConfirmBan(false)}
                        loading={banMut.isPending}
                        color="#7C3AED"
                      />
                    )}
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
                    {!confirmRole ? (
                      <ActionBtn label="Assign Role" onClick={() => {
                        if ((selectedRole || currentRole) === currentRole && !selectedRole) { showMsg("err", "Select a different role first"); return; }
                        setConfirmRole(true);
                      }} loading={false} color="#1E3A5F" hoverColor="#162D4A" />
                    ) : (
                      <ConfirmInline
                        message={`Change role from "${currentRole}" to "${selectedRole || currentRole}"?`}
                        onConfirm={() => { roleMut.mutate(); setConfirmRole(false); }}
                        onCancel={() => setConfirmRole(false)}
                        loading={roleMut.isPending}
                        color="#1E3A5F"
                      />
                    )}
                  </div>
                </Card>

                <Card title="Security">
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {!confirmResetPw ? (
                      <ActionBtn label="🔒 Reset Password" onClick={() => setConfirmResetPw(true)} loading={false} color="#374151" hoverColor="#1F2937" />
                    ) : (
                      <ConfirmInline
                        message={`Reset password for ${userName}? A new temporary password will be generated.`}
                        onConfirm={() => { resetPwMut.mutate(); setConfirmResetPw(false); }}
                        onCancel={() => setConfirmResetPw(false)}
                        loading={resetPwMut.isPending}
                        color="#374151"
                      />
                    )}
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
    <button
      onClick={onClick}
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
      style={{ fontSize: 12, fontWeight: 600 }}
    >
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
    <div className="card-safee" style={{ borderColor: borderColor ?? undefined }}>
      <div className="card-header" style={{
        padding: "10px 14px", borderBottom: "1px solid #F3F4F6",
        background: "#FAFAFA",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748B" }}>
          {title}
        </div>
        {headerAction}
      </div>
      <div className="card-body" style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const isWarning = value.startsWith("⚠");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #F9FAFB", gap: "8px" }}>
      <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "11px", color: isWarning ? "#D97706" : value === "—" ? "#9CA3AF" : "#374151", fontWeight: value === "—" ? "400" : "500", fontStyle: isWarning ? "italic" : "normal", textAlign: "right", maxWidth: "60%", wordBreak: "break-word", overflowWrap: "break-word" }}>
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

  const bg = disabled ? "#E5E7EB" : activeColor;
  const textColor = disabled ? "#9CA3AF" : "white";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = hoverColor; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = activeColor; }}
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
        opacity: isDisabled ? 0.5 : 1,
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

function txTypeColor(type: string): string {
  const map: Record<string, string> = {
    deposit: "#16A34A",
    withdrawal: "#DC2626",
    adjustment: "#2563EB",
    bonus: "#EA580C",
    correction: "#7C3AED",
    fee: "#374151",
    refund: "#0891B2",
  };
  return map[type] ?? "#6B7280";
}

function TxTypeBadge({ type }: { type: string }) {
  const color = txTypeColor(type);
  return (
    <span style={{
      display: "inline-block",
      fontSize: "10px", fontWeight: "700",
      textTransform: "uppercase", letterSpacing: "0.04em",
      padding: "2px 7px", borderRadius: "3px",
      color, background: `${color}14`, border: `1px solid ${color}33`,
    }}>
      {type}
    </span>
  );
}

function ConfirmInline({ message, onConfirm, onCancel, loading, color }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  color: string;
}) {
  return (
    <div style={{
      width: "100%", padding: "10px 12px", borderRadius: "6px",
      background: "#FFFBEB", border: "1px solid #FDE68A",
    }}>
      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#92400E" }}>{message}</p>
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={onConfirm} disabled={loading}
          style={{
            flex: 1, padding: "6px", borderRadius: "4px", border: "none",
            background: loading ? "#9CA3AF" : color, color: "white",
            fontSize: "12px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "Processing…" : "Confirm"}
        </button>
        <button onClick={onCancel} disabled={loading}
          style={{
            flex: 1, padding: "6px", borderRadius: "4px",
            border: "1px solid #E5E7EB", background: "#F3F4F6", color: "#374151",
            fontSize: "12px", cursor: "pointer",
          }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
