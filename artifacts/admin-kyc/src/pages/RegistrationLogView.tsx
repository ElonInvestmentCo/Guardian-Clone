import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { getRegistrationLog, fetchDocumentBlobUrl, type RegistrationLogEntry, type KycProfileData } from "@/lib/api";
import { useAdminRealtime, type RegistrationEvent, type ApplicationCompleteEvent } from "@/hooks/useAdminRealtime";
import AdminToast, { type ToastItem } from "@/components/AdminToast";

let toastId = 0;

function fmt(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(d);
  } catch { return iso; }
}

function fmtShort(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  } catch { return iso; }
}

function val(v: unknown): string {
  if (v == null || v === "") return "—";
  const s = String(v);
  if (s.startsWith("enc:") || s === "[decryption failed]" || s.startsWith("[encrypted")) return "⚠ Encrypted";
  if (s === "true") return "Yes";
  if (s === "false") return "No";
  return s;
}

function statusBadge(status?: string, steps?: number) {
  const s = status ?? "pending";
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    approved: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
    verified: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
    rejected: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    pending: { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
    reviewing: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    suspended: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    banned: { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF" },
  };
  const c = colors[s] ?? colors["pending"];
  return (
    <span style={{ ...c, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
      {steps !== undefined && ` · ${steps}/12 steps`}
    </span>
  );
}

function DocImage({ email, role, label }: { email: string; role: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  useEffect(() => {
    let revoked = false;
    setLoading(true);
    setError(false);
    fetchDocumentBlobUrl(email, role)
      .then(blobUrl => {
        if (!revoked) { setUrl(blobUrl); setLoading(false); }
      })
      .catch(() => {
        if (!revoked) { setError(true); setLoading(false); }
      });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [email, role]);

  if (error) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {loading ? (
        <div style={{ width: 90, height: 70, background: "#F1F5F9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner-border spinner-border-sm" style={{ width: 16, height: 16, color: "#94A3B8" }} />
        </div>
      ) : url ? (
        <>
          <img
            src={url}
            alt={label}
            onClick={() => setEnlarged(true)}
            style={{
              width: 90, height: 70, objectFit: "cover", borderRadius: 8,
              border: "1px solid #E2E8F0", cursor: "zoom-in",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          {enlarged && (
            <div
              onClick={() => setEnlarged(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 99999,
                background: "rgba(0,0,0,0.85)", display: "flex",
                alignItems: "center", justifyContent: "center",
                cursor: "zoom-out",
              }}
            >
              <img src={url} alt={label} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 0 60px rgba(0,0,0,0.8)" }} />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

interface ProfileSectionProps {
  title: string;
  icon: string;
  fields: Array<{ label: string; value: unknown }>;
}
function ProfileSection({ title, icon, fields }: ProfileSectionProps) {
  const visible = fields.filter(f => val(f.value) !== "—");
  if (visible.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
        <i className={`bi ${icon}`} style={{ color: "#6366F1", fontSize: 13 }} />
        <span style={{ fontWeight: 700, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 16px" }}>
        {visible.map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 13, color: "#1E293B", fontWeight: 500, wordBreak: "break-word" }}>{val(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandedProfile({ entry }: { entry: RegistrationLogEntry }) {
  const p = entry.profile ?? {};
  const docs = p.documents ?? {};
  const docRoles = Object.keys(docs);
  const g = (p.general ?? {}) as Record<string, unknown>;
  const per = (p.personal ?? {}) as Record<string, unknown>;
  const pro = (p.professional ?? {}) as Record<string, unknown>;
  const id = (p.idInformation ?? {}) as Record<string, unknown>;
  const inc = (p.income ?? {}) as Record<string, unknown>;
  const risk = (p.riskTolerance ?? {}) as Record<string, unknown>;
  const fin = (p.financialSituation ?? {}) as Record<string, unknown>;
  const inv = (p.investmentExperience ?? {}) as Record<string, unknown>;
  const fund = (p.fundingDetails ?? {}) as Record<string, unknown>;
  const disc = (p.disclosures ?? {}) as Record<string, unknown>;

  return (
    <div style={{ background: "#F8FAFC", padding: "20px 24px", borderTop: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 340px", minWidth: 0 }}>
          <ProfileSection title="Contact & Location" icon="bi-geo-alt" fields={[
            { label: "Phone", value: g["phone"] },
            { label: "Country", value: g["country"] },
            { label: "State / Province", value: g["state"] },
            { label: "City", value: g["city"] },
          ]} />
          <ProfileSection title="Personal" icon="bi-person" fields={[
            { label: "First Name", value: per["firstName"] },
            { label: "Last Name", value: per["lastName"] },
            { label: "Date of Birth", value: per["dateOfBirth"] },
            { label: "Gender", value: per["gender"] },
            { label: "Marital Status", value: per["maritalStatus"] },
            { label: "Nationality", value: per["nationality"] },
          ]} />
          <ProfileSection title="Identity" icon="bi-card-text" fields={[
            { label: "ID Type", value: id["idType"] },
            { label: "ID Number", value: id["idNumber"] },
            { label: "ID Expiry", value: id["idExpiryDate"] },
            { label: "Foreign ID Type", value: id["foreignIdType"] },
          ]} />
          <ProfileSection title="Professional" icon="bi-briefcase" fields={[
            { label: "Occupation", value: pro["occupation"] },
            { label: "Employer", value: pro["employer"] },
            { label: "Employment Status", value: pro["employmentStatus"] },
            { label: "Industry", value: pro["industryType"] },
            { label: "Years Employed", value: pro["yearsEmployed"] },
          ]} />
        </div>
        <div style={{ flex: "1 1 340px", minWidth: 0 }}>
          <ProfileSection title="Financial" icon="bi-currency-dollar" fields={[
            { label: "Annual Income", value: inc["annualIncome"] },
            { label: "Net Worth", value: inc["netWorth"] },
            { label: "Liquid Net Worth", value: fin["liquidNetWorth"] },
            { label: "Total Assets", value: fin["totalAssets"] },
            { label: "Existing Investments", value: fin["existingInvestments"] },
            { label: "Source of Funds", value: inc["sourceOfFunds"] },
            { label: "Tax Country", value: inc["taxCountry"] },
            { label: "Tax ID", value: inc["taxId"] },
          ]} />
          <ProfileSection title="Risk & Investment" icon="bi-graph-up" fields={[
            { label: "Risk Profile", value: risk["riskProfile"] },
            { label: "Investment Horizon", value: risk["investmentHorizon"] },
            { label: "Stocks Experience", value: inv["stocksExperience"] },
            { label: "Forex Experience", value: inv["forexExperience"] },
            { label: "Options Experience", value: inv["optionsExperience"] },
            { label: "Crypto Experience", value: inv["cryptoExperience"] },
          ]} />
          <ProfileSection title="Funding" icon="bi-bank" fields={[
            { label: "Initial Deposit", value: fund["initialDeposit"] },
            { label: "Funding Method", value: fund["fundingMethod"] },
            { label: "Bank Name", value: fund["bankName"] },
            { label: "Account Number", value: fund["bankAccountNumber"] },
            { label: "Routing Number", value: fund["routingNumber"] },
          ]} />
          <ProfileSection title="Disclosures" icon="bi-file-text" fields={[
            { label: "Terms Agreed", value: disc["termsAgreed"] ?? disc["agreeTerms"] },
            { label: "Privacy Agreed", value: disc["privacyAgreed"] ?? disc["agreePrivacy"] },
            { label: "Market Agreed", value: disc["marketAgreed"] },
            { label: "Political Exposure", value: disc["isPep"] ?? disc["politicalExposure"] },
          ]} />
        </div>
      </div>

      {docRoles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #E2E8F0" }}>
            <i className="bi bi-images" style={{ color: "#6366F1", fontSize: 13 }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>Uploaded Documents</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {docRoles.map(role => (
              <DocImage key={role} email={entry.email} role={role} label={role.replace(/([A-Z])/g, ' $1').trim()} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildCSV(entries: RegistrationLogEntry[]): string {
  const headers = [
    "ID", "Email", "Registered At", "KYC Status", "Steps Completed",
    "IP Address", "Referrer", "Product", "Type",
    "First Name", "Last Name", "Date of Birth", "Gender", "Marital Status", "Nationality",
    "Phone", "Country", "State",
    "Occupation", "Employer", "Employment Status", "Industry",
    "ID Type", "ID Expiry",
    "Annual Income", "Net Worth", "Liquid Net Worth", "Source of Funds", "Tax Country",
    "Risk Profile", "Investment Horizon",
    "Initial Deposit", "Funding Method",
    "Documents",
  ];

  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const rows = entries.map(e => {
    const p = e.profile ?? {};
    const per = (p.personal ?? {}) as Record<string, unknown>;
    const g = (p.general ?? {}) as Record<string, unknown>;
    const pro = (p.professional ?? {}) as Record<string, unknown>;
    const id = (p.idInformation ?? {}) as Record<string, unknown>;
    const inc = (p.income ?? {}) as Record<string, unknown>;
    const risk = (p.riskTolerance ?? {}) as Record<string, unknown>;
    const fin = (p.financialSituation ?? {}) as Record<string, unknown>;
    const fund = (p.fundingDetails ?? {}) as Record<string, unknown>;
    const docs = Object.keys(p.documents ?? {}).join(", ");

    return [
      e.id, e.email, fmt(e.registered_at),
      e.kyc_status ?? "pending", e.kyc_completed_steps ?? 0,
      e.ip_address ?? "", e.referrer ?? "", e.product ?? "", e.registration_type ?? "",
      val(per["firstName"]), val(per["lastName"]), val(per["dateOfBirth"]), val(per["gender"]), val(per["maritalStatus"]), val(per["nationality"]),
      val(g["phone"]), val(g["country"]), val(g["state"]),
      val(pro["occupation"]), val(pro["employer"]), val(pro["employmentStatus"]), val(pro["industryType"]),
      val(id["idType"]), val(id["idExpiryDate"]),
      val(inc["annualIncome"]), val(inc["netWorth"]), val(fin["liquidNetWorth"]), val(inc["sourceOfFunds"]), val(inc["taxCountry"]),
      val(risk["riskProfile"]), val(risk["investmentHorizon"]),
      val(fund["initialDeposit"]), val(fund["fundingMethod"]),
      docs,
    ].map(q).join(",");
  });

  return [headers.map(q).join(","), ...rows].join("\n");
}

export default function RegistrationLogView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((t: Omit<ToastItem, "id">) => {
    setToasts(prev => [...prev, { ...t, id: ++toastId }].slice(-5));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["registration-log"],
    queryFn: () => getRegistrationLog(),
    staleTime: 30_000,
  });

  const handleNewRegistration = useCallback((event: RegistrationEvent) => {
    queryClient.invalidateQueries({ queryKey: ["registration-log"] });
    pushToast({ type: "registration", title: "New Registration", message: event.email, subtext: event.formattedAt });
  }, [queryClient, pushToast]);

  const handleAppComplete = useCallback((event: ApplicationCompleteEvent) => {
    queryClient.invalidateQueries({ queryKey: ["registration-log"] });
    pushToast({ type: "kyc_complete", title: "KYC Application Complete", message: event.email, subtext: `All ${event.totalSteps} steps submitted — ${event.formattedAt}` });
  }, [queryClient, pushToast]);

  const { status } = useAdminRealtime({
    onNewRegistration: handleNewRegistration,
    onApplicationComplete: handleAppComplete,
  });

  const entries = data?.entries ?? [];
  const filtered = search
    ? entries.filter(e =>
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.ip_address ?? "").includes(search) ||
        (e.kyc_status ?? "").includes(search.toLowerCase()) ||
        (e.referrer ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const handleExport = () => {
    const csv = buildCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-full-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <AdminToast toasts={toasts} onDismiss={dismissToast} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h5 style={{ margin: 0, fontWeight: 700 }}>Registration Log</h5>

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
          {status === "connected" ? "Live" : status === "connecting" ? "Connecting..." : "Reconnecting..."}
        </span>

        <div style={{ flex: 1 }} />

        <input
          type="text"
          placeholder="Search email, IP, status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 13, minWidth: 220, background: "var(--input-bg, #fff)" }}
        />

        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: "#0D6EFD", color: "#fff", border: "none", cursor: "pointer",
            opacity: filtered.length === 0 ? 0.5 : 1,
          }}
        >
          <i className="bi bi-download" />
          Export CSV
        </button>
      </div>

      <div className="card-safee">
        <div className="card-header">
          <span>All Registrations</span>
          <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""} · click row to inspect
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8" }}>
              <div className="spinner-border spinner-border-sm" />
              <div style={{ marginTop: 8, fontSize: 13 }}>Loading registrations...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: 48, color: "#DC2626", fontSize: 13 }}>
              Failed to load registrations
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#94A3B8", fontSize: 13 }}>
              {search ? "No matching registrations" : "No registrations yet — they'll appear instantly when a user signs up"}
            </div>
          ) : (
            <div>
              {filtered.map((entry, i) => {
                const isOpen = expandedId === entry.id;
                const per = (entry.profile?.personal ?? {}) as Record<string, unknown>;
                const firstName = val(per["firstName"]);
                const lastName = val(per["lastName"]);
                const fullName = firstName !== "—" || lastName !== "—"
                  ? `${firstName !== "—" ? firstName : ""} ${lastName !== "—" ? lastName : ""}`.trim()
                  : null;

                return (
                  <div key={entry.id ?? i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <div
                      onClick={() => setExpandedId(isOpen ? null : (entry.id ?? null))}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                        cursor: "pointer", background: isOpen ? "#F8FAFC" : "transparent",
                        transition: "background 0.15s",
                        flexWrap: "wrap",
                      }}
                    >
                      <i className={`bi ${isOpen ? "bi-chevron-down" : "bi-chevron-right"}`}
                        style={{ color: "#94A3B8", fontSize: 12, flexShrink: 0 }} />

                      <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary, #1E293B)" }}>
                          {entry.email}
                        </div>
                        {fullName && (
                          <div style={{ fontSize: 12, color: "#64748B" }}>{fullName}</div>
                        )}
                      </div>

                      <div style={{ flex: "0 0 auto" }}>
                        {statusBadge(entry.kyc_status, entry.kyc_completed_steps)}
                      </div>

                      <div style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap", flex: "0 0 auto" }}>
                        {fmtShort(entry.registered_at)}
                      </div>

                      <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace", flex: "0 0 auto" }}>
                        {entry.ip_address || ""}
                      </div>
                    </div>

                    {isOpen && <ExpandedProfile entry={entry} />}
                  </div>
                );
              })}
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
