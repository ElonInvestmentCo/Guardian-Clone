import { useState, useEffect, useRef } from "react";
import { User, Lock, BellRing, ChevronRight, Eye, EyeOff, Check } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { getCountries, getStates, getCities, getStateLabel, type LocationOption } from "@/lib/location/locationService";

type Section = "profile" | "security" | "notifications";

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
  placeholder: string; disabled?: boolean; inputStyle: React.CSSProperties; colors: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.code === value)?.label ?? "";

  return (
    <div className="relative">
      <div
        className="flex items-center"
        style={{ ...inputStyle, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, position: "relative" }}
        onClick={() => { if (!disabled) setOpen(!open); }}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setTimeout(() => { setOpen(false); setSearch(""); }, 150); }}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", color: colors.inputText, padding: 0 }}
          />
        ) : (
          <span style={{ color: value ? colors.inputText : colors.textMuted, fontSize: "13px" }}>
            {selectedLabel || placeholder}
          </span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full overflow-y-auto"
          style={{ background: colors.card, border: `1px solid ${colors.inputBorder}`, borderRadius: "0 0 10px 10px", maxHeight: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", top: "100%", left: 0 }}
        >
          {filtered.map((o) => (
            <div
              key={o.code}
              className="cursor-pointer"
              style={{ padding: "8px 14px", fontSize: "13px", color: colors.textPrimary, background: o.code === value ? colors.filterBar : "transparent" }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); setSearch(""); }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = colors.filterBar; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.code === value ? colors.filterBar : "transparent"; }}
            >
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

export default function Settings() {
  const { colors } = useTheme();
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";
  const nameParts = displayName.split(" ");

  const [section, setSection] = useState<Section>("profile");

  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts[1] ?? "");
  const [phone, setPhone] = useState("+1 (555) 000-0000");
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [picUploading, setPicUploading] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!email) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/user/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d: { profilePicture?: string }) => {
        if (d.profilePicture) setProfilePic(d.profilePicture);
      })
      .catch(() => {});
  }, [email]);

  const handlePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; }
    setPicPreview(URL.createObjectURL(file));
    setPicUploading(true);
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const fd = new FormData();
    fd.append("email", email);
    fd.append("picture", file);
    fetch(`${base}/api/user/profile-picture`, { method: "POST", body: fd })
      .then((r) => {
        if (!r.ok) throw new Error("Upload failed");
        return r.json();
      })
      .then((d: { filename?: string }) => {
        if (d.filename) setProfilePic(d.filename);
        setPicUploading(false);
      })
      .catch(() => { setPicUploading(false); setPicPreview(null); alert("Upload failed. Please try again."); });
  };

  const handlePicRemove = () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/user/profile-picture?email=${encodeURIComponent(email)}`, { method: "DELETE" })
      .then(() => { setProfilePic(null); setPicPreview(null); });
  };

  const profilePicUrl = profilePic
    ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/user/profile-picture/${profilePic}`
    : null;

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const [notifs, setNotifs] = useState({
    tradeConfirmations: true, priceAlerts: true, orderFills: true, marketOpen: false,
    marketClose: false, weeklyReport: true, promotions: false, securityAlerts: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const countries = getCountries();
  const stateOptions = country ? getStates(country) : [];
  const [cityOptions, setCityOptions] = useState<string[]>(state ? getCities(state) : []);
  const isInitialMount = useRef(true);

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

  const handleSaveProfile = () => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500); };

  const handleSavePw = () => {
    setPwError("");
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  };

  const handleSaveNotifs = () => { setNotifSaved(true); setTimeout(() => setNotifSaved(false), 2500); };

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
                <input ref={picInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePicSelect}
                  style={{ display: "none" }} />
                <button onClick={() => picInputRef.current?.click()} disabled={picUploading}
                  style={{
                    position: "absolute", bottom: "-4px", right: "-4px",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: colors.accent, color: "#fff", border: "2px solid white",
                    cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {picUploading ? "..." : "+"}
                </button>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: colors.textPrimary, marginBottom: "2px" }}>{displayName}</p>
              <p style={{ fontSize: "11px", color: colors.textMuted }}>{email}</p>
              {(profilePic || picPreview) && (
                <button onClick={handlePicRemove} style={{
                  marginTop: "6px", fontSize: "10px", color: colors.red ?? "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
                }}>
                  Remove photo
                </button>
              )}
              <span className="mt-3 px-3 py-1 rounded-md text-xs font-bold" style={{ background: colors.greenBg, color: colors.green }}>
                Approved
              </span>
            </div>

            <div className="flex md:flex-col gap-1.5 md:gap-0 overflow-x-auto md:overflow-visible rounded-xl md:rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
              {SECTIONS.map(({ key, icon: Icon, label, desc }) => (
                <button key={key} onClick={() => setSection(key)}
                  className="flex items-center gap-2 md:gap-3 text-left flex-shrink-0 md:flex-shrink md:w-full"
                  style={{ padding: "10px 12px", border: "none", cursor: "pointer",
                    borderBottom: `1px solid ${colors.divider}`,
                    background: section === key ? colors.settingsSectionActiveBg : colors.card,
                    minWidth: "0" }}>
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: "30px", height: "30px", background: section === key ? colors.accent : colors.filterBar }}>
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
                      <Check size={13} /> Saved
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
                    <SettingsSearchableSelect
                      value={country}
                      onChange={setCountry}
                      options={countries}
                      placeholder="Select country"
                      inputStyle={inputStyle}
                      colors={colors}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                      {country ? getStateLabel(country) : "State / Region"}
                    </label>
                    {stateOptions.length > 0 ? (
                      <SettingsSearchableSelect
                        value={state}
                        onChange={setState}
                        options={stateOptions}
                        placeholder="Select state"
                        inputStyle={inputStyle}
                        colors={colors}
                      />
                    ) : (
                      <input value={state} onChange={(e) => setState(e.target.value)} placeholder={country ? "Enter state" : "Select country first"} disabled={!country} style={{ ...inputStyle, opacity: !country ? 0.5 : 1 }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>City</label>
                    {cityOptions.length > 0 ? (
                      <SettingsSearchableSelect
                        value={city}
                        onChange={setCity}
                        options={cityLocationOptions}
                        placeholder="Select city"
                        inputStyle={inputStyle}
                        colors={colors}
                      />
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
                        <button type="button" onClick={toggle} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 0 }}>
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
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary, marginBottom: "4px" }}>Two-Factor Authentication</h2>
                  <p style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "20px" }}>Add an extra layer of security</p>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: `1px solid ${colors.cardBorder}` }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary, marginBottom: "2px" }}>Authenticator App (TOTP)</p>
                      <p style={{ fontSize: "12px", color: colors.textMuted }}>Use Google Authenticator or Authy</p>
                    </div>
                    <Toggle on={twoFA} onToggle={() => setTwoFA((p) => !p)} colors={colors} />
                  </div>
                  {twoFA && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: colors.greenBg, border: `1px solid rgba(14,203,129,0.2)` }}>
                      <p style={{ fontSize: "13px", color: colors.green, fontWeight: 600 }}>2FA is enabled</p>
                      <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "4px" }}>Your account is protected with two-factor authentication.</p>
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
                      <Check size={13} /> Saved
                    </span>
                  )}
                </div>

                {[
                  { key: "tradeConfirmations", label: "Trade Confirmations",    desc: "Get notified when a trade executes" },
                  { key: "priceAlerts",        label: "Price Alerts",           desc: "Alerts when a price target is hit"  },
                  { key: "orderFills",         label: "Order Fills",            desc: "Notify when orders are filled"      },
                  { key: "marketOpen",         label: "Market Open",            desc: "Daily reminder at 9:30 AM ET"       },
                  { key: "marketClose",        label: "Market Close",           desc: "Daily reminder at 4:00 PM ET"       },
                  { key: "weeklyReport",       label: "Weekly Performance Report", desc: "Portfolio summary every Friday"  },
                  { key: "promotions",         label: "Promotions & Offers",    desc: "News and special offers"            },
                  { key: "securityAlerts",     label: "Security Alerts",        desc: "Login attempts and account changes" },
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
