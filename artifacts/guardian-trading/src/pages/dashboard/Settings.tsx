import { useState, useEffect, useRef } from "react";
import { getApiBase } from "@/lib/api";
import loaderGif from "@assets/D63BF694-BB76-43CE-AFFB-E54A8FFDFBC5_1775805898246.gif";
import { User, Lock, BellRing, ChevronRight, Eye, EyeOff, Check, Shield, Copy, Download, AlertTriangle } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme, type ThemeColors } from "@/context/ThemeContext";
import { getCountries, getStates, getCities, getStateLabel, type LocationOption } from "@/lib/location/locationService";

type Section = "profile" | "security" | "notifications";
type TwoFAStep = "idle" | "qr" | "verify" | "backup" | "disable";

function Toggle({ on, onToggle, colors }: { on: boolean; onToggle: () => void; colors: { accent: string; inputBorder: string } }) {
  return (
    <button onClick={onToggle}
      style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", padding: "2px",
        background: on ? colors.accent : colors.inputBorder, transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "transform 0.2s",
        transform: on ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function SettingsSearchableSelect({
  value, onChange, options, placeholder, disabled = false, inputStyle, colors,
}: {
  value: string; onChange: (v: string) => void; options: LocationOption[];
  placeholder: string; disabled?: boolean; inputStyle: React.CSSProperties; colors: ThemeColors;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;
  const selectedLabel = options.find((o) => o.code === value)?.label ?? "";
  return (
    <div className="relative">
      <div className="flex items-center"
        style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, position: "relative" }}
        onClick={() => { if (!disabled) setOpen(!open); }}>
        {open ? (
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setTimeout(() => { setOpen(false); setSearch(""); }, 150); }}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", color: colors.inputText, padding: 0 }} />
        ) : (
          <span style={{ color: value ? colors.inputText : colors.textMuted, fontSize: "13px" }}>{selectedLabel || placeholder}</span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full overflow-y-auto"
          style={{ background: colors.card, border: `1px solid ${colors.inputBorder}`, borderRadius: "0 0 10px 10px", maxHeight: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", top: "100%", left: 0 }}>
          {filtered.map((o) => (
            <div key={o.code} className="cursor-pointer"
              style={{ padding: "8px 14px", fontSize: "13px", color: colors.textPrimary, background: o.code === value ? colors.filterBar : "transparent" }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); setSearch(""); }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.filterBar; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.code === value ? colors.filterBar : "transparent"; }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 w-full" style={{ background: colors.card, border: `1px solid ${colors.inputBorder}`, borderRadius: "0 0 10px 10px", top: "100%", left: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "8px 14px", fontSize: "12px", color: colors.textMuted }}>No results found</div>
        </div>
      )}
    </div>
  );
}

interface UserProfile {
  profilePicture?: string;
  settings?: { firstName?: string; lastName?: string; phone?: string; country?: string; state?: string; city?: string };
  notificationPreferences?: Record<string, boolean>;
  twoFAEnabled?: boolean;
}

export default function Settings() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";

  const [section, setSection] = useState<Section>("profile");
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [twoFAQrUrl, setTwoFAQrUrl] = useState("");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [twoFAError, setTwoFAError] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disablePw, setDisablePw] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [notifs, setNotifs] = useState({
    tradeConfirmations: true, priceAlerts: true, orderFills: true, marketOpen: false,
    marketClose: false, weeklyReport: true, promotions: false, securityAlerts: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const countries = getCountries();
  const stateOptions = country ? getStates(country) : [];
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  const base = getApiBase();

  useEffect(() => {
    if (!email) return;
    fetch(`${base}/api/user/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d: UserProfile) => {
        if (d.profilePicture) setProfilePic(d.profilePicture);
        if (d.settings) {
          if (d.settings.firstName) setFirstName(d.settings.firstName);
          if (d.settings.lastName) setLastName(d.settings.lastName);
          if (d.settings.phone) setPhone(d.settings.phone);
          if (d.settings.country) setCountry(d.settings.country);
          if (d.settings.state) setState(d.settings.state);
          if (d.settings.city) setCity(d.settings.city);
        }
        if (d.notificationPreferences) {
          setNotifs((prev) => ({ ...prev, ...(d.notificationPreferences as typeof notifs) }));
        }
        if (d.twoFAEnabled !== undefined) setTwoFAEnabled(d.twoFAEnabled);
        setLoadingProfile(false);
      })
      .catch(() => setLoadingProfile(false));
  }, [email]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setState("");
    setCity("");
    setCityOptions([]);
  }, [country]);

  useEffect(() => {
    if (!state) { setCityOptions([]); return; }
    setCityOptions(getCities(state));
  }, [state]);

  const handlePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; }
    setPicPreview(URL.createObjectURL(file));
    setPicUploading(true);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("picture", file);
    fetch(`${base}/api/user/profile-picture`, { method: "POST", body: fd })
      .then((r) => { if (!r.ok) throw new Error("Upload failed"); return r.json(); })
      .then((d: { filename?: string }) => { if (d.filename) setProfilePic(d.filename); setPicUploading(false); })
      .catch(() => { setPicUploading(false); setPicPreview(null); alert("Upload failed. Please try again."); });
  };

  const handlePicRemove = () => {
    fetch(`${base}/api/user/profile-picture?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      .then((r) => { if (!r.ok) throw new Error("Delete failed"); setProfilePic(null); setPicPreview(null); })
      .catch(() => alert("Failed to remove profile picture."));
  };

  const profilePicUrl = profilePic ? `${base}/api/user/profile-picture/${profilePic}` : null;

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${base}/api/user/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, phone, country, state, city }),
      });
      if (!res.ok) throw new Error("Save failed");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleSavePw = async () => {
    setPwError("");
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    try {
      const res = await fetch(`${base}/api/user/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwError((data as { error?: string }).error || "Password change failed.");
        return;
      }
      setPwSaved(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSaved(false), 2500);
    } catch {
      setPwError("Network error. Please try again.");
    }
  };

  const handleSaveNotifs = async () => {
    try {
      const res = await fetch(`${base}/api/user/update-notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences: notifs }),
      });
      if (!res.ok) throw new Error("Save failed");
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } catch {
      alert("Failed to save notification preferences.");
    }
  };

  const handle2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch(`${base}/api/user/2fa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json() as { qrDataUrl?: string; secret?: string; error?: string };
      if (!res.ok) { setTwoFAError(d.error || "Failed to start 2FA setup."); return; }
      setTwoFAQrUrl(d.qrDataUrl ?? "");
      setTwoFASecret(d.secret ?? "");
      setTwoFAStep("qr");
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FAEnable = async () => {
    if (twoFAToken.length !== 6) { setTwoFAError("Please enter the 6-digit code from your app."); return; }
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch(`${base}/api/user/2fa/enable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: twoFAToken }),
      });
      const d = await res.json() as { backupCodes?: string[]; error?: string };
      if (!res.ok) { setTwoFAError(d.error || "Invalid code. Please try again."); return; }
      setTwoFABackupCodes(d.backupCodes ?? []);
      setTwoFAEnabled(true);
      setTwoFAStep("backup");
      setTwoFAToken("");
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!disablePw) { setTwoFAError("Password is required."); return; }
    if (disableToken.length !== 6) { setTwoFAError("Please enter the 6-digit code from your app."); return; }
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch(`${base}/api/user/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: disablePw, token: disableToken }),
      });
      const d = await res.json() as { error?: string };
      if (!res.ok) { setTwoFAError(d.error || "Failed to disable 2FA."); return; }
      setTwoFAEnabled(false);
      setTwoFAStep("idle");
      setDisablePw(""); setDisableToken("");
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Guardian Trading – 2FA Backup Codes\nGenerated: ${new Date().toISOString()}\n\nKeep these codes safe. Each code can only be used once.\n\n${twoFABackupCodes.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "guardian-2fa-backup-codes.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const SECTIONS: { key: Section; icon: typeof User; label: string; desc: string }[] = [
    { key: "profile",       icon: User,    label: "Profile",       desc: "Name, email, phone" },
    { key: "security",      icon: Lock,    label: "Security",      desc: "Password & 2FA"     },
    { key: "notifications", icon: BellRing,label: "Notifications", desc: "Alerts & preferences" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "13px",
    border: `1px solid ${colors.inputBorder}`, borderRadius: "10px",
    color: colors.inputText, background: colors.inputBg, outline: "none", boxSizing: "border-box",
  };

  const cityLocationOptions: LocationOption[] = cityOptions.map((c) => ({ code: c, label: c }));

  if (loadingProfile) {
    return (
      <DashboardLayout>
        <div style={{ position: "relative", height: "256px" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", borderRadius: "8px" }}>
            <img src={loaderGif} alt="Loading" draggable={false} style={{ width: 80, height: 80, objectFit: "contain" }} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Settings</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Manage your account preferences</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-shrink-0 w-full md:w-[240px]">
            <div className="hidden md:flex rounded-xl p-5 mb-4 flex-col items-center" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              <div style={{ position: "relative", marginBottom: "12px" }}>
                {picPreview || profilePicUrl ? (
                  <img src={picPreview || profilePicUrl!} alt={displayName}
                    style={{ width: "64px", height: "64px", borderRadius: "16px", objectFit: "cover" }} />
                ) : (
                  <div className="flex items-center justify-center rounded-xl font-bold text-white"
                    style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", fontSize: "24px", borderRadius: "16px" }}>
                    {displayName[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <input ref={picInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePicSelect} style={{ display: "none" }} />
                <button onClick={() => picInputRef.current?.click()} disabled={picUploading}
                  style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "24px", height: "24px", borderRadius: "50%", background: colors.accent, color: "#fff", border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {picUploading ? "…" : "+"}
                </button>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "2px" }}>{firstName || displayName}</p>
              <p style={{ fontSize: "11px", color: colors.textMuted }}>{email}</p>
              {(profilePic || picPreview) && (
                <button onClick={handlePicRemove} style={{ marginTop: "6px", fontSize: "10px", color: colors.red ?? "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Remove photo
                </button>
              )}
              <span className="mt-3 px-3 py-1 rounded-md text-xs font-bold" style={{ background: colors.greenBg, color: colors.green }}>Approved</span>
            </div>

            <div className="flex md:flex-col gap-1.5 md:gap-0 overflow-x-auto md:overflow-visible rounded-xl md:rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              {SECTIONS.map(({ key, icon: Icon, label, desc }) => (
                <button key={key} onClick={() => setSection(key)}
                  className="flex items-center gap-2 md:gap-3 text-left flex-shrink-0 md:flex-shrink md:w-full"
                  style={{ padding: "10px 12px", border: "none", cursor: "pointer", borderBottom: `1px solid ${colors.divider}`, background: section === key ? colors.settingsSectionActiveBg : colors.card, minWidth: "0" }}>
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: "30px", height: "30px", background: section === key ? colors.accent : colors.filterBar }}>
                    <Icon size={14} color={section === key ? "#fff" : colors.textMuted} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: section === key ? colors.accent : colors.textSub, marginBottom: "1px" }}>{label}</p>
                    <p className="hidden md:block" style={{ fontSize: "10px", color: colors.textMuted }}>{desc}</p>
                  </div>
                  <ChevronRight size={14} color={colors.textMuted} className="hidden md:block" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {section === "profile" && (
              <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "24px" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Profile Information</h2>
                    <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Update your personal information</p>
                  </div>
                  {profileSaved && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: colors.greenBg, color: colors.green, fontSize: "12px", fontWeight: 600 }}>
                      <Check size={13} /> Settings saved successfully
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "First Name", val: firstName, set: setFirstName },
                    { label: "Last Name",  val: lastName,  set: setLastName  },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
                      <input value={val} onChange={(e) => set(e.target.value)} style={inputStyle} />
                    </div>
                  ))}
                </div>

                {[
                  { label: "Email Address", val: email, readOnly: true },
                  { label: "Phone Number",  val: phone, readOnly: false, set: setPhone },
                ].map(({ label, val, readOnly, set }) => (
                  <div key={label} className="mb-4">
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
                    <input value={val} readOnly={readOnly} onChange={set ? (e) => set(e.target.value) : undefined}
                      style={{ ...inputStyle, color: readOnly ? colors.textMuted : colors.inputText, background: readOnly ? colors.filterBar : colors.inputBg }} />
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Country</label>
                    <SettingsSearchableSelect value={country} onChange={setCountry} options={countries} placeholder="Select country" inputStyle={inputStyle} colors={colors} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                      {country ? getStateLabel(country) : "State / Region"}
                    </label>
                    {stateOptions.length > 0 ? (
                      <SettingsSearchableSelect value={state} onChange={setState} options={stateOptions} placeholder="Select state" inputStyle={inputStyle} colors={colors} />
                    ) : (
                      <input value={state} onChange={(e) => setState(e.target.value)} placeholder={country ? "Enter state" : "Select country first"} disabled={!country} style={{ ...inputStyle, opacity: !country ? 0.5 : 1 }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>City</label>
                    {cityOptions.length > 0 ? (
                      <SettingsSearchableSelect value={city} onChange={setCity} options={cityLocationOptions} placeholder="Select city" inputStyle={inputStyle} colors={colors} />
                    ) : (
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={state || (country && stateOptions.length === 0) ? "Enter city" : "Select state first"} disabled={!state && stateOptions.length > 0} style={{ ...inputStyle, opacity: (!state && stateOptions.length > 0) ? 0.5 : 1 }} />
                    )}
                  </div>
                </div>

                <button onClick={handleSaveProfile}
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                  Save Changes
                </button>
              </div>
            )}

            {section === "security" && (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "24px" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Change Password</h2>
                      <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Use a strong, unique password</p>
                    </div>
                    {pwSaved && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: colors.greenBg, color: colors.green, fontSize: "12px", fontWeight: 600 }}>
                        <Check size={13} /> Password updated
                      </span>
                    )}
                  </div>
                  {pwError && <div className="mb-4 px-4 py-2.5 rounded-lg" style={{ background: colors.redBg, color: colors.red, fontSize: "13px" }}>{pwError}</div>}

                  {[
                    { label: "Current Password", val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent((p) => !p) },
                    { label: "New Password",      val: newPw,     set: setNewPw,     show: showNew,    toggle: () => setShowNew((p) => !p)     },
                    { label: "Confirm New Password", val: confirmPw, set: setConfirmPw, show: showNew, toggle: () => setShowNew((p) => !p)     },
                  ].map(({ label, val, set, show, toggle }) => (
                    <div key={label} className="mb-4">
                      <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{label}</label>
                      <div className="relative">
                        <input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)}
                          style={{ ...inputStyle, padding: "10px 42px 10px 14px" }} />
                        <button type="button" onClick={(e) => { e.stopPropagation(); toggle(); }} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 0 }}>
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {newPw && (
                    <div className="mb-4">
                      <p style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "6px" }}>Password strength</p>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => {
                          const strength = Math.min(4, Math.floor(newPw.length / 3));
                          const strengthColors = [colors.red, colors.yellow, colors.accent, colors.green];
                          return <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i < strength ? strengthColors[strength - 1] : colors.filterBar }} />;
                        })}
                      </div>
                    </div>
                  )}

                  <button onClick={handleSavePw}
                    style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                    Update Password
                  </button>
                </div>

                <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "24px" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center rounded-xl" style={{ width: "40px", height: "40px", background: twoFAEnabled ? colors.greenBg : colors.filterBar }}>
                      <Shield size={18} color={twoFAEnabled ? colors.green : colors.textMuted} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Two-Factor Authentication</h2>
                      <p style={{ fontSize: "12px", color: colors.textMuted }}>Enterprise-grade account security</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                        background: twoFAEnabled ? colors.greenBg : colors.filterBar,
                        color: twoFAEnabled ? colors.green : colors.textMuted,
                      }}>
                        {twoFAEnabled ? "● Enabled" : "○ Disabled"}
                      </span>
                    </div>
                  </div>

                  {twoFAError && (
                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: colors.redBg }}>
                      <AlertTriangle size={14} color={colors.red} />
                      <span style={{ fontSize: "13px", color: colors.red }}>{twoFAError}</span>
                    </div>
                  )}

                  {twoFAStep === "idle" && !twoFAEnabled && (
                    <div>
                      <p style={{ fontSize: "13px", color: colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
                        Protect your account with an authenticator app (Google Authenticator, Authy, or any TOTP-compatible app). Once enabled, you'll need your authenticator code to log in.
                      </p>
                      <button onClick={handle2FASetup} disabled={twoFALoading}
                        style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", opacity: twoFALoading ? 0.7 : 1 }}>
                        {twoFALoading ? "Setting up…" : "Enable 2FA"}
                      </button>
                    </div>
                  )}

                  {twoFAStep === "qr" && (
                    <div>
                      <p style={{ fontSize: "13px", color: colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
                        Scan the QR code below with your authenticator app, then enter the 6-digit code to confirm.
                      </p>
                      {twoFAQrUrl && (
                        <div className="flex justify-center mb-4">
                          <div style={{ padding: "12px", background: "#fff", borderRadius: "12px", display: "inline-block" }}>
                            <img src={twoFAQrUrl} alt="2FA QR Code" style={{ width: "180px", height: "180px", display: "block" }} />
                          </div>
                        </div>
                      )}
                      <div className="mb-4 p-3 rounded-xl" style={{ background: colors.filterBar, border: `1px solid ${colors.divider}` }}>
                        <p style={{ fontSize: "10px", color: colors.textMuted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Manual entry key</p>
                        <div className="flex items-center justify-between gap-2">
                          <code style={{ fontSize: "13px", color: colors.textPrimary, fontFamily: "monospace", letterSpacing: "0.1em", wordBreak: "break-all" }}>{twoFASecret}</code>
                          <button onClick={() => { navigator.clipboard.writeText(twoFASecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: copiedSecret ? colors.green : colors.textMuted }}>
                            {copiedSecret ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>6-Digit Code from App</label>
                        <input
                          value={twoFAToken}
                          onChange={(e) => { setTwoFAToken(e.target.value.replace(/\D/g, "").slice(0, 6)); setTwoFAError(""); }}
                          placeholder="000000"
                          maxLength={6}
                          style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center" }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setTwoFAStep("idle"); setTwoFAError(""); setTwoFAToken(""); }}
                          style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>
                          Cancel
                        </button>
                        <button onClick={handle2FAEnable} disabled={twoFALoading || twoFAToken.length !== 6}
                          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", opacity: (twoFALoading || twoFAToken.length !== 6) ? 0.6 : 1 }}>
                          {twoFALoading ? "Verifying…" : "Verify & Enable"}
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFAStep === "backup" && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: colors.greenBg }}>
                        <Check size={16} color={colors.green} />
                        <span style={{ fontSize: "13px", color: colors.green, fontWeight: 600 }}>2FA enabled successfully!</span>
                      </div>
                      <p style={{ fontSize: "13px", color: colors.textSub, marginBottom: "8px", fontWeight: 600 }}>Save your backup codes</p>
                      <p style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
                        Store these codes in a safe place. Each code can be used once to access your account if you lose your authenticator device.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4 p-4 rounded-xl" style={{ background: colors.filterBar }}>
                        {twoFABackupCodes.map((code, i) => (
                          <code key={i} style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, fontFamily: "monospace", padding: "4px 0" }}>{code}</code>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={downloadBackupCodes} className="flex items-center gap-2"
                          style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>
                          <Download size={14} /> Download
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(twoFABackupCodes.join("\n")); }}
                          className="flex items-center gap-2"
                          style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>
                          <Copy size={14} /> Copy All
                        </button>
                        <button onClick={() => setTwoFAStep("idle")}
                          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFAStep === "idle" && twoFAEnabled && (
                    <div>
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: colors.greenBg, border: `1px solid rgba(14,203,129,0.2)` }}>
                        <Shield size={15} color={colors.green} />
                        <span style={{ fontSize: "13px", color: colors.green }}>Your account is protected with two-factor authentication.</span>
                      </div>
                      <button onClick={() => { setTwoFAStep("disable"); setTwoFAError(""); }}
                        style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.redBg}`, borderRadius: "10px", background: colors.redBg, color: colors.red, cursor: "pointer" }}>
                        Disable 2FA
                      </button>
                    </div>
                  )}

                  {twoFAStep === "disable" && (
                    <div>
                      <p style={{ fontSize: "13px", color: colors.textMuted, marginBottom: "16px", lineHeight: 1.6 }}>
                        To disable 2FA, confirm your password and enter the current 6-digit code from your authenticator app.
                      </p>
                      <div className="mb-4">
                        <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Current Password</label>
                        <input type="password" value={disablePw} onChange={(e) => { setDisablePw(e.target.value); setTwoFAError(""); }} style={inputStyle} />
                      </div>
                      <div className="mb-5">
                        <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Authenticator Code</label>
                        <input
                          value={disableToken}
                          onChange={(e) => { setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6)); setTwoFAError(""); }}
                          placeholder="000000"
                          maxLength={6}
                          style={{ ...inputStyle, fontSize: "22px", fontWeight: 700, letterSpacing: "0.3em", textAlign: "center" }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setTwoFAStep("idle"); setTwoFAError(""); }}
                          style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, border: `1px solid ${colors.btnBorder}`, borderRadius: "10px", background: colors.btnBg, color: colors.textSub, cursor: "pointer" }}>
                          Cancel
                        </button>
                        <button onClick={handle2FADisable} disabled={twoFALoading}
                          style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 700, background: colors.red, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", opacity: twoFALoading ? 0.7 : 1 }}>
                          {twoFALoading ? "Disabling…" : "Confirm & Disable 2FA"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "notifications" && (
              <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "24px" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary }}>Notification Preferences</h2>
                    <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Choose what alerts you receive</p>
                  </div>
                  {notifSaved && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: colors.greenBg, color: colors.green, fontSize: "12px", fontWeight: 600 }}>
                      <Check size={13} /> Settings saved successfully
                    </span>
                  )}
                </div>

                {[
                  { key: "tradeConfirmations", label: "Trade Confirmations",      desc: "Get notified when a trade executes" },
                  { key: "priceAlerts",        label: "Price Alerts",             desc: "Alerts when a price target is hit"  },
                  { key: "orderFills",         label: "Order Fills",              desc: "Notify when orders are filled"      },
                  { key: "marketOpen",         label: "Market Open",              desc: "Daily reminder at 9:30 AM ET"       },
                  { key: "marketClose",        label: "Market Close",             desc: "Daily reminder at 4:00 PM ET"       },
                  { key: "weeklyReport",       label: "Weekly Performance Report",desc: "Portfolio summary every Friday"     },
                  { key: "promotions",         label: "Promotions & Offers",      desc: "News and special offers"            },
                  { key: "securityAlerts",     label: "Security Alerts",          desc: "Login attempts and account changes" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textSub, marginBottom: "2px" }}>{label}</p>
                      <p style={{ fontSize: "11px", color: colors.textMuted }}>{desc}</p>
                    </div>
                    <Toggle on={notifs[key as keyof typeof notifs]} onToggle={() => setNotifs((p) => ({ ...p, [key]: !p[key as keyof typeof notifs] }))} colors={colors} />
                  </div>
                ))}

                <button onClick={handleSaveNotifs} className="mt-5"
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: colors.accent, color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}>
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
