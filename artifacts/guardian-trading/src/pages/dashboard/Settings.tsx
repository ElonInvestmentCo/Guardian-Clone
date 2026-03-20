import { useState } from "react";
import { Bell, User, Lock, BellRing, ChevronRight, Eye, EyeOff, Check } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

type Section = "profile" | "security" | "notifications";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", padding: "2px",
        background: on ? "#3a7bd5" : "#ddd", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "transform 0.2s",
        transform: on ? "translateX(20px)" : "translateX(0)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

export default function Settings() {
  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";
  const displayName = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Trader";
  const nameParts = displayName.split(" ");

  const [section, setSection] = useState<Section>("profile");

  // Profile state
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts[1] ?? "");
  const [phone, setPhone] = useState("+1 (555) 000-0000");
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  // Notification state
  const [notifs, setNotifs] = useState({
    tradeConfirmations: true,
    priceAlerts: true,
    orderFills: true,
    marketOpen: false,
    marketClose: false,
    weeklyReport: true,
    promotions: false,
    securityAlerts: true,
  });

  const [notifSaved, setNotifSaved] = useState(false);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSavePw = () => {
    setPwError("");
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  };

  const handleSaveNotifs = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2500);
  };

  const SECTIONS: { key: Section; icon: typeof User; label: string; desc: string }[] = [
    { key: "profile",       icon: User,    label: "Profile",       desc: "Name, email, phone" },
    { key: "security",      icon: Lock,    label: "Security",      desc: "Password & 2FA"     },
    { key: "notifications", icon: BellRing,label: "Notifications", desc: "Alerts & preferences" },
  ];

  return (
    <DashboardLayout>
      <div style={{ padding: "28px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#111" }}>Settings</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} color="#555" style={{ cursor: "pointer" }} />
              <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
                style={{ width: "14px", height: "14px", background: "#3a7bd5", fontSize: "8px", fontWeight: 700 }}>3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-full font-bold text-white"
                style={{ width: "32px", height: "32px", background: "#3a7bd5", fontSize: "13px" }}>
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{displayName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Left nav */}
          <div className="flex-shrink-0" style={{ width: "220px" }}>
            {/* Avatar */}
            <div className="rounded-xl p-5 mb-4 flex flex-col items-center" style={{ background: "#fff" }}>
              <div className="flex items-center justify-center rounded-full font-bold text-white mb-3"
                style={{ width: "64px", height: "64px", background: "#3a7bd5", fontSize: "24px" }}>
                {displayName[0]?.toUpperCase() ?? "U"}
              </div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "2px" }}>{displayName}</p>
              <p style={{ fontSize: "11px", color: "#aaa" }}>{email}</p>
              <span className="mt-3 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#e8f5e9", color: "#28a745" }}>
                ✓ Verified
              </span>
            </div>

            {/* Section nav */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#fff" }}>
              {SECTIONS.map(({ key, icon: Icon, label, desc }) => (
                <button key={key} onClick={() => setSection(key)}
                  className="flex items-center gap-3 w-full text-left"
                  style={{ padding: "13px 16px", border: "none", cursor: "pointer", borderBottom: "1px solid #f5f5f5",
                    background: section === key ? "#f0f5ff" : "#fff" }}>
                  <div className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: "34px", height: "34px", background: section === key ? "#3a7bd5" : "#f0f2f5" }}>
                    <Icon size={16} color={section === key ? "#fff" : "#888"} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: section === key ? "#3a7bd5" : "#333", marginBottom: "1px" }}>{label}</p>
                    <p style={{ fontSize: "10px", color: "#aaa" }}>{desc}</p>
                  </div>
                  <ChevronRight size={14} color="#ccc" />
                </button>
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1">

            {/* ── Profile ── */}
            {section === "profile" && (
              <div className="rounded-xl" style={{ background: "#fff", padding: "24px" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>Profile Information</h2>
                    <p style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>Update your personal information</p>
                  </div>
                  {profileSaved && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#e8f5e9", color: "#28a745", fontSize: "12px", fontWeight: 600 }}>
                      <Check size={13} /> Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "First Name", val: firstName, set: setFirstName },
                    { label: "Last Name",  val: lastName,  set: setLastName  },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label style={{ display: "block", fontSize: "11px", color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                      <input value={val} onChange={(e) => set(e.target.value)}
                        style={{ width: "100%", padding: "9px 13px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", color: "#333", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>

                {[
                  { label: "Email Address", val: email, readOnly: true },
                  { label: "Phone Number",  val: phone, readOnly: false, set: setPhone },
                ].map(({ label, val, readOnly, set }) => (
                  <div key={label} className="mb-4">
                    <label style={{ display: "block", fontSize: "11px", color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                    <input value={val} readOnly={readOnly} onChange={set ? (e) => set(e.target.value) : undefined}
                      style={{ width: "100%", padding: "9px 13px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", color: readOnly ? "#aaa" : "#333", outline: "none", background: readOnly ? "#fafafa" : "#fff", boxSizing: "border-box" }} />
                  </div>
                ))}

                <div className="mb-5">
                  <label style={{ display: "block", fontSize: "11px", color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Country</label>
                  <select style={{ width: "100%", padding: "9px 13px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", color: "#333", outline: "none", background: "#fff" }}>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                  </select>
                </div>

                <button onClick={handleSaveProfile}
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: "#3a7bd5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                  Save Changes
                </button>
              </div>
            )}

            {/* ── Security ── */}
            {section === "security" && (
              <div className="flex flex-col gap-4">
                {/* Password */}
                <div className="rounded-xl" style={{ background: "#fff", padding: "24px" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>Change Password</h2>
                      <p style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>Use a strong, unique password</p>
                    </div>
                    {pwSaved && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#e8f5e9", color: "#28a745", fontSize: "12px", fontWeight: 600 }}>
                        <Check size={13} /> Password updated
                      </span>
                    )}
                  </div>
                  {pwError && <div className="mb-4 px-4 py-2 rounded-lg" style={{ background: "#fdecea", color: "#dc3545", fontSize: "13px" }}>{pwError}</div>}

                  {[
                    { label: "Current Password", val: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent((p) => !p) },
                    { label: "New Password",      val: newPw,     set: setNewPw,     show: showNew,    toggle: () => setShowNew((p) => !p)     },
                    { label: "Confirm New Password", val: confirmPw, set: setConfirmPw, show: showNew, toggle: () => setShowNew((p) => !p)     },
                  ].map(({ label, val, set, show, toggle }) => (
                    <div key={label} className="mb-4">
                      <label style={{ display: "block", fontSize: "11px", color: "#aaa", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                      <div className="relative">
                        <input type={show ? "text" : "password"} value={val} onChange={(e) => set(e.target.value)}
                          style={{ width: "100%", padding: "9px 40px 9px 13px", fontSize: "13px", border: "1.5px solid #e8e8e8", borderRadius: "8px", color: "#333", outline: "none", boxSizing: "border-box" }} />
                        <button type="button" onClick={toggle} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0 }}>
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {newPw && (
                    <div className="mb-4">
                      <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>Password strength</p>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => {
                          const strength = Math.min(4, Math.floor(newPw.length / 3));
                          const colors = ["#dc3545", "#f59e0b", "#3a7bd5", "#28a745"];
                          return <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i < strength ? colors[strength - 1] : "#eee" }} />;
                        })}
                      </div>
                    </div>
                  )}

                  <button onClick={handleSavePw}
                    style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: "#3a7bd5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                    Update Password
                  </button>
                </div>

                {/* 2FA */}
                <div className="rounded-xl" style={{ background: "#fff", padding: "24px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111", marginBottom: "4px" }}>Two-Factor Authentication</h2>
                  <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "20px" }}>Add an extra layer of security to your account</p>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: "1.5px solid #f0f0f0" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "2px" }}>Authenticator App (TOTP)</p>
                      <p style={{ fontSize: "12px", color: "#aaa" }}>Use Google Authenticator or Authy</p>
                    </div>
                    <Toggle on={twoFA} onToggle={() => setTwoFA((p) => !p)} />
                  </div>
                  {twoFA && (
                    <div className="mt-4 p-4 rounded-xl" style={{ background: "#f0f5ff", border: "1px solid #c5d8f5" }}>
                      <p style={{ fontSize: "13px", color: "#3a7bd5", fontWeight: 600 }}>2FA is enabled ✓</p>
                      <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Your account is protected with two-factor authentication.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {section === "notifications" && (
              <div className="rounded-xl" style={{ background: "#fff", padding: "24px" }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#111" }}>Notification Preferences</h2>
                    <p style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>Choose what alerts you receive</p>
                  </div>
                  {notifSaved && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#e8f5e9", color: "#28a745", fontSize: "12px", fontWeight: 600 }}>
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
                  <div key={key} className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "2px" }}>{label}</p>
                      <p style={{ fontSize: "11px", color: "#aaa" }}>{desc}</p>
                    </div>
                    <Toggle on={notifs[key as keyof typeof notifs]} onToggle={() => setNotifs((p) => ({ ...p, [key]: !p[key as keyof typeof notifs] }))} />
                  </div>
                ))}

                <button onClick={handleSaveNotifs} className="mt-5"
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, background: "#3a7bd5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>
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
