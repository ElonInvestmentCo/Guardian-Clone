import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSignaturesList,
  verifySignature,
  type SignatureStatus,
  type SignatureUser,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const LIMIT = 25;

const STATUS_TABS: { key: SignatureStatus | ""; label: string; icon: string; color: string }[] = [
  { key: "",            label: "All Users",          icon: "bi-people",        color: "#374151" },
  { key: "verified",    label: "Verified",            icon: "bi-check-circle",  color: "#16A34A" },
  { key: "pending",     label: "Pending Verification",icon: "bi-clock",         color: "#D97706" },
  { key: "not_signed",  label: "Not Signed",          icon: "bi-dash-circle",   color: "#9CA3AF" },
];

function SigStatusBadge({ status }: { status: SignatureStatus }) {
  const cfg = {
    verified:   { label: "Verified",    bg: "#DCFCE7", color: "#16A34A", icon: "bi-check-circle-fill" },
    pending:    { label: "Pending",     bg: "#FEF9C3", color: "#B45309", icon: "bi-clock-fill" },
    not_signed: { label: "Not Signed",  bg: "#F3F4F6", color: "#6B7280", icon: "bi-dash-circle" },
  }[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700,
    }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {cfg.label}
    </span>
  );
}

interface Props {
  initialFilter?: SignatureStatus | "";
}

export default function SignaturesView({ initialFilter = "" }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab]   = useState<SignatureStatus | "">(initialFilter);
  const [search,    setSearch]      = useState("");
  const [page,      setPage]        = useState(1);
  const [modalUser, setModalUser]   = useState<SignatureUser | null>(null);
  const [verifying, setVerifying]   = useState<string | null>(null);
  const [verifyErr, setVerifyErr]   = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["signatures-list", activeTab, search, page],
    queryFn:  () => getSignaturesList({ status: activeTab || undefined, search, page, limit: LIMIT }),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const users      = data?.users      ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.pages      ?? 1;

  const handleTabChange = useCallback((tab: SignatureStatus | "") => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleVerify = async (email: string) => {
    setVerifying(email);
    setVerifyErr(null);
    try {
      await verifySignature(email, "Verified via Signatures dashboard");
      await queryClient.invalidateQueries({ queryKey: ["signatures-list"] });
      await queryClient.invalidateQueries({ queryKey: ["sig-stats"] });
      if (modalUser?.email === email) setModalUser(null);
    } catch (e) {
      setVerifyErr((e as Error).message);
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Signature Compliance</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${total} user${total !== 1 ? "s" : ""} · sorted by signing date`}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 13, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Filter by email or name…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none", width: 240 }}
            />
          </div>
        </div>

        {/* ── Filter Tabs ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                border: activeTab === tab.key ? `1.5px solid ${tab.color}` : "1.5px solid #E5E7EB",
                background: activeTab === tab.key ? `${tab.color}15` : "#F9FAFB",
                color: activeTab === tab.key ? tab.color : "#64748B",
              }}
            >
              <i className={`bi ${tab.icon}`} style={{ fontSize: 11 }} />
              {tab.label}
            </button>
          ))}
        </div>

        {verifyErr && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>
            Error: {verifyErr}
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

        {isLoading && (
          <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF", fontSize: 14 }}>
            <i className="bi bi-hourglass-split" style={{ marginRight: 6 }} />Loading…
          </div>
        )}

        {isError && (
          <div style={{ textAlign: "center", padding: 60, color: "#DC2626", fontSize: 14 }}>
            <i className="bi bi-exclamation-triangle" style={{ marginRight: 6 }} />
            Failed to load signatures
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["User", "Account Status", "Signature Status", "Signed At", "Preview", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "10px 14px", textAlign: "left",
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.05em", textTransform: "uppercase",
                        color: "#6B7280", whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                        <i className="bi bi-pen" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.3 }} />
                        {search || activeTab ? "No users match your filter" : "No signature data yet"}
                      </td>
                    </tr>
                  )}

                  {users.map(user => (
                    <tr
                      key={user.email}
                      style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      {/* User */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{user.email}</div>
                      </td>

                      {/* Account Status */}
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, borderRadius: 20,
                          padding: "3px 10px",
                          background: user.status === "approved" || user.status === "verified" ? "#DCFCE7" :
                                      user.status === "pending" ? "#FEF9C3" :
                                      user.status === "rejected" ? "#FEE2E2" : "#F3F4F6",
                          color: user.status === "approved" || user.status === "verified" ? "#16A34A" :
                                 user.status === "pending" ? "#B45309" :
                                 user.status === "rejected" ? "#DC2626" : "#6B7280",
                        }}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>

                      {/* Signature Status */}
                      <td style={{ padding: "12px 14px" }}>
                        <SigStatusBadge status={user.signatureStatus} />
                      </td>

                      {/* Signed At */}
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                        {user.signedAt ? formatDate(user.signedAt) : <span style={{ color: "#D1D5DB" }}>—</span>}
                      </td>

                      {/* Thumbnail */}
                      <td style={{ padding: "12px 14px" }}>
                        {user.signatureThumbnail ? (
                          <button
                            onClick={() => setModalUser(user)}
                            style={{
                              border: "1px solid #E5E7EB", borderRadius: 5, padding: 3,
                              background: "#FAFAFA", cursor: "zoom-in", display: "inline-block", lineHeight: 0,
                            }}
                            title="Click to preview"
                          >
                            <img
                              src={user.signatureThumbnail}
                              alt="Signature"
                              style={{ height: 34, maxWidth: 90, objectFit: "contain", display: "block" }}
                            />
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#D1D5DB" }}>No image</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {user.signatureThumbnail && (
                            <button
                              onClick={() => setModalUser(user)}
                              style={{
                                padding: "4px 10px", borderRadius: 4, border: "1px solid #E5E7EB",
                                background: "white", color: "#374151", fontSize: 11, cursor: "pointer",
                              }}
                            >
                              Preview
                            </button>
                          )}
                          {user.signatureStatus === "pending" && (
                            <button
                              onClick={() => handleVerify(user.email)}
                              disabled={verifying === user.email}
                              style={{
                                padding: "4px 10px", borderRadius: 4,
                                border: "1px solid #BBF7D0",
                                background: "#F0FDF4", color: "#16A34A",
                                fontSize: 11, cursor: verifying === user.email ? "not-allowed" : "pointer",
                                opacity: verifying === user.email ? 0.6 : 1, fontWeight: 600,
                              }}
                            >
                              {verifying === user.email ? "Verifying…" : "Verify"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Page {page} of {totalPages} · {total} total
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "5px 14px", borderRadius: 5, border: "1px solid #E5E7EB",
                      background: "white", fontSize: 12,
                      color: page === 1 ? "#D1D5DB" : "#374151",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: "5px 14px", borderRadius: 5, border: "1px solid #E5E7EB",
                      background: "white", fontSize: 12,
                      color: page === totalPages ? "#D1D5DB" : "#374151",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Signature Preview Modal ─────────────────────────────────────── */}
      {modalUser && (
        <div
          onClick={() => setModalUser(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 12, padding: 28,
              maxWidth: 580, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                  Electronic Signature
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  <strong>{modalUser.name}</strong> &nbsp;·&nbsp; {modalUser.email}
                </div>
                <div style={{ marginTop: 6 }}>
                  <SigStatusBadge status={modalUser.signatureStatus} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {modalUser.signatureStatus === "pending" && (
                  <button
                    onClick={() => handleVerify(modalUser.email)}
                    disabled={verifying === modalUser.email}
                    style={{
                      padding: "6px 14px", borderRadius: 6,
                      border: "1px solid #BBF7D0",
                      background: "#F0FDF4", color: "#16A34A",
                      fontSize: 12, fontWeight: 600,
                      cursor: verifying === modalUser.email ? "not-allowed" : "pointer",
                      opacity: verifying === modalUser.email ? 0.6 : 1,
                    }}
                  >
                    <i className="bi bi-check-circle" style={{ marginRight: 4 }} />
                    {verifying === modalUser.email ? "Verifying…" : "Mark as Verified"}
                  </button>
                )}
                <button
                  onClick={() => setModalUser(null)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E7EB",
                    background: "white", color: "#374151", fontSize: 12, cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{
              background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8,
              padding: 24, display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 150,
            }}>
              {modalUser.signatureThumbnail ? (
                <img
                  src={modalUser.signatureThumbnail}
                  alt="Full electronic signature"
                  style={{ maxWidth: "100%", maxHeight: 260, objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>No signature image stored</span>
              )}
            </div>

            <div style={{ marginTop: 16, padding: "12px 16px", background: "#F8FAFC", borderRadius: 6, fontSize: 11, color: "#64748B" }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span><strong>Email:</strong> {modalUser.email}</span>
                <span><strong>Signed:</strong> {modalUser.signedAt ? formatDate(modalUser.signedAt) : "—"}</span>
                {modalUser.signatureVerifiedAt && (
                  <span><strong>Verified:</strong> {formatDate(modalUser.signatureVerifiedAt)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
