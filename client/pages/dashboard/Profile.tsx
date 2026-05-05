import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Camera, Link as LinkIcon, Calendar, Edit3, Check, X } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { getApiBase } from "@/lib/api";
import { Link } from "wouter";

interface UserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  kycComplete: boolean;
  profilePicture: string | null;
  createdAt?: string;
  phone?: string;
  country?: string;
  city?: string;
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px 20px" }}>
      <p style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

export default function Profile() {
  const { colors } = useTheme();
  const email = sessionStorage.getItem("signupEmail") ?? "";
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const base = getApiBase();

  const derivedName = email
    ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Trader";

  useEffect(() => {
    if (!email) return;
    fetch(`${base}/api/user/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        const fn = data.firstName ?? "";
        const ln = data.lastName ?? "";
        setDisplayName(fn || ln ? `${fn} ${ln}`.trim() : derivedName);
      })
      .catch(() => setDisplayName(derivedName))
      .finally(() => setLoading(false));
  }, [email]);

  const profilePicUrl = profile?.profilePicture
    ? `${base}/api/user/profile-picture/${profile.profilePicture}`
    : null;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: "Approved", color: colors.green, bg: colors.greenBg },
    pending:  { label: "Pending",  color: colors.yellow, bg: colors.yellowBg },
    verified: { label: "Verified", color: colors.accent, bg: "rgba(59,130,246,0.1)" },
    rejected: { label: "Rejected", color: colors.red,   bg: colors.redBg },
    reviewing:{ label: "Reviewing",color: colors.yellow, bg: colors.yellowBg },
  };
  const st = statusConfig[profile?.status ?? ""] ?? { label: profile?.status ?? "—", color: colors.textMuted, bg: colors.filterBar };

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;
    setUploadingPic(true);
    const form = new FormData();
    form.append("profilePicture", file);
    form.append("email", email);
    try {
      const res = await fetch(`${base}/api/user/profile-picture`, { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json() as { filename: string };
        setProfile((p) => p ? { ...p, profilePicture: data.filename } : p);
      }
    } catch { /* ignore */ }
    finally { setUploadingPic(false); }
  };

  const saveName = async () => {
    if (!email) return;
    setSavingName(true);
    const parts = displayName.trim().split(" ");
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") ?? "";
    try {
      await fetch(`${base}/api/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName }),
      });
    } catch { /* ignore */ }
    finally { setSavingName(false); setEditingName(false); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px", maxWidth: "860px" }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Profile</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Your account identity & details</p>
          </div>
          <Link href="/settings">
            <button className="flex items-center gap-2" style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
              border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.textPrimary, cursor: "pointer",
            }}>
              <Edit3 size={14} />
              Edit Settings
            </button>
          </Link>
        </div>

        <div className="rounded-xl mb-5" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "28px 24px" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="rounded-2xl overflow-hidden" style={{ width: "88px", height: "88px", background: colors.filterBar }}>
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="flex items-center justify-center w-full h-full" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
                    {(displayName[0] ?? "U").toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingPic}
                className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-lg"
                style={{ width: "26px", height: "26px", background: colors.accent, border: `2px solid ${colors.card}`, cursor: "pointer" }}
              >
                {uploadingPic ? (
                  <div style={{ width: "10px", height: "10px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <Camera size={11} color="#fff" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                      autoFocus
                      style={{
                        fontSize: "20px", fontWeight: 700, color: colors.textPrimary, background: colors.inputBg,
                        border: `1px solid ${colors.accent}`, borderRadius: "6px", padding: "2px 8px", outline: "none",
                      }}
                    />
                    <button onClick={saveName} disabled={savingName} style={{ background: colors.accent, border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}>
                      <Check size={14} color="#fff" />
                    </button>
                    <button onClick={() => setEditingName(false)} style={{ background: colors.filterBar, border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}>
                      <X size={14} color={colors.textMuted} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary }}>{loading ? "—" : displayName}</h2>
                    <button onClick={() => setEditingName(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: colors.textMuted }}>
                      <Edit3 size={13} />
                    </button>
                  </>
                )}
                <span className="inline-flex items-center rounded-full px-2 py-0.5" style={{ fontSize: "10px", fontWeight: 700, color: st.color, background: st.bg, letterSpacing: "0.06em" }}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-3" style={{ color: colors.textMuted }}>
                <Mail size={13} />
                <span style={{ fontSize: "13px" }}>{email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                  <Shield size={13} />
                  <span style={{ fontSize: "12px" }}>Pro Account</span>
                </div>
                {profile?.createdAt && (
                  <div className="flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                    <Calendar size={13} />
                    <span style={{ fontSize: "12px" }}>Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <StatBadge label="Account Status" value={st.label} color={st.color} />
          <StatBadge label="Account Type" value="Pro" color={colors.accent} />
          <StatBadge label="KYC Status" value={profile?.kycComplete ? "Complete" : "Incomplete"} color={profile?.kycComplete ? colors.green : colors.yellow} />
          <StatBadge label="2FA" value="Via Email" color={colors.textSub} />
        </div>

        <div className="rounded-xl mb-5" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "16px" }}>Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            {[
              { label: "Email Address", value: email || "—", icon: <Mail size={14} /> },
              { label: "Account Type", value: "Pro Account", icon: <Shield size={14} /> },
              { label: "KYC Verification", value: profile?.kycComplete ? "Verified" : "Pending", icon: <Check size={14} /> },
              { label: "Linked Platforms", value: "DAS Trader Pro, Sterling Trader® Pro", icon: <LinkIcon size={14} /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5" style={{ width: "30px", height: "30px", background: colors.filterBar, color: colors.textMuted }}>
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: colors.textMuted, fontWeight: 500, marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "20px 24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "4px" }}>Quick Actions</h3>
          <p style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "16px" }}>Manage your account preferences</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Edit Profile", sub: "Update personal info", href: "/settings", accent: false },
              { label: "Security", sub: "Password & 2FA", href: "/settings", accent: false },
              { label: "Contact Support", sub: "Get help from our team", href: "/support", accent: true },
            ].map(({ label, sub, href, accent }) => (
              <Link key={label} href={href}>
                <div className="rounded-lg p-4 cursor-pointer" style={{
                  background: accent ? colors.accent : colors.filterBar,
                  border: `1px solid ${accent ? "transparent" : colors.cardBorder}`,
                  transition: "opacity 0.15s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  <p style={{ fontSize: "13px", fontWeight: 600, color: accent ? "#fff" : colors.textPrimary, marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "11px", color: accent ? "rgba(255,255,255,0.75)" : colors.textMuted }}>{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );
}
