import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSignatureAuditLog,
  exportSignatureAuditLog,
  type SignatureAuditEntry,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";

const LIMIT = 25;

export default function SignatureAuditLogView() {
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [modalEntry,  setModalEntry]  = useState<SignatureAuditEntry | null>(null);
  const [exporting,   setExporting]   = useState(false);
  const [exportErr,   setExportErr]   = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sig-audit", search, page],
    queryFn:  () => getSignatureAuditLog({ search, page, limit: LIMIT }),
    staleTime: 15_000,
  });

  const entries    = data?.entries ?? [];
  const total      = data?.total   ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportErr(null);
    try {
      await exportSignatureAuditLog(search || undefined);
    } catch (e) {
      setExportErr((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const downloadSig = (entry: SignatureAuditEntry) => {
    if (!entry.signature_image) return;
    const a  = document.createElement("a");
    a.href   = entry.signature_image;
    a.download = `signature-${entry.email}-${entry.id}.png`;
    a.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, color: "#1E293B", fontSize: 16 }}>Signature Audit Log</h5>
            <span style={{ fontSize: 12, color: "#64748B" }}>
              {isLoading ? "Loading…" : `${total} immutable signature event${total !== 1 ? "s" : ""} — sorted latest first`}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <i className="bi bi-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 13, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Filter by email…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 13, outline: "none", width: 220 }}
              />
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 6, border: "1px solid #D1D5DB",
                background: "white", color: "#374151", fontSize: 12, fontWeight: 600,
                cursor: exporting ? "not-allowed" : "pointer", opacity: exporting ? 0.6 : 1,
              }}
            >
              <i className="bi bi-download" />
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {exportErr && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>
            Export error: {exportErr}
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
            Failed to load signature audit log
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    {["#", "User / Application", "Date & Time Signed", "IP Address", "Browser / Agent", "Signature", ""].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          color: "#6B7280",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                        <i className="bi bi-pen" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.3 }} />
                        {search ? "No entries match your search" : "No signature events recorded yet"}
                      </td>
                    </tr>
                  )}

                  {entries.map((entry) => {
                    const ua    = entry.user_agent ?? "";
                    const uaShort = ua.length > 60 ? ua.slice(0, 60) + "…" : ua;

                    return (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}
                      >
                        {/* ID */}
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>
                          {entry.id}
                        </td>

                        {/* User */}
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{entry.email}</div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                          {formatDate(entry.created_at)}
                        </td>

                        {/* IP */}
                        <td style={{ padding: "10px 14px" }}>
                          <code style={{ fontSize: 11, background: "#F1F5F9", padding: "3px 7px", borderRadius: 4, color: "#334155", fontFamily: "monospace" }}>
                            {entry.ip_address ?? "—"}
                          </code>
                        </td>

                        {/* User Agent */}
                        <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                          <div title={ua} style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {uaShort || "—"}
                          </div>
                        </td>

                        {/* Thumbnail */}
                        <td style={{ padding: "10px 14px" }}>
                          {entry.signature_image ? (
                            <button
                              onClick={() => setModalEntry(entry)}
                              style={{
                                border: "1px solid #E5E7EB", borderRadius: 5, padding: 3,
                                background: "#FAFAFA", cursor: "zoom-in", display: "inline-block", lineHeight: 0,
                              }}
                              title="Click to enlarge"
                            >
                              <img
                                src={entry.signature_image}
                                alt="Signature thumbnail"
                                style={{ height: 36, maxWidth: 100, objectFit: "contain", display: "block" }}
                              />
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "#D1D5DB" }}>No image</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {entry.signature_image && (
                              <>
                                <button
                                  onClick={() => setModalEntry(entry)}
                                  style={{
                                    padding: "4px 10px", borderRadius: 4, border: "1px solid #E5E7EB",
                                    background: "white", color: "#374151", fontSize: 11, cursor: "pointer",
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => downloadSig(entry)}
                                  style={{
                                    padding: "4px 10px", borderRadius: 4, border: "1px solid #BFDBFE",
                                    background: "#EFF6FF", color: "#2563EB", fontSize: 11, cursor: "pointer",
                                  }}
                                  title="Download PNG"
                                >
                                  <i className="bi bi-download" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
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

      {/* ── Full-Signature Modal ────────────────────────────────────────── */}
      {modalEntry && (
        <div
          onClick={() => setModalEntry(null)}
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
              maxWidth: 640, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                  Electronic Signature
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  <strong>{modalEntry.email}</strong>
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  Signed: {formatDate(modalEntry.created_at)}
                  {modalEntry.ip_address && (
                    <> &nbsp;·&nbsp; IP: <code style={{ fontFamily: "monospace", background: "#F1F5F9", padding: "1px 5px", borderRadius: 3 }}>{modalEntry.ip_address}</code></>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => downloadSig(modalEntry)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid #BFDBFE",
                    background: "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <i className="bi bi-download" style={{ marginRight: 4 }} />
                  Download PNG
                </button>
                <button
                  onClick={() => setModalEntry(null)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E7EB",
                    background: "white", color: "#374151", fontSize: 12, cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Signature canvas */}
            <div style={{
              background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8,
              padding: 24, display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 160,
            }}>
              {modalEntry.signature_image ? (
                <img
                  src={modalEntry.signature_image}
                  alt="Full electronic signature"
                  style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>No signature image stored</span>
              )}
            </div>

            {/* Metadata footer */}
            <div style={{ marginTop: 16, padding: "12px 16px", background: "#F8FAFC", borderRadius: 6, fontSize: 11, color: "#64748B" }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span><strong>Record #:</strong> {modalEntry.id}</span>
                <span><strong>IP Address:</strong> {modalEntry.ip_address ?? "—"}</span>
                <span><strong>Timestamp:</strong> {formatDate(modalEntry.created_at)}</span>
              </div>
              {modalEntry.user_agent && (
                <div style={{ marginTop: 6, wordBreak: "break-all" }}>
                  <strong>User Agent:</strong> {modalEntry.user_agent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
