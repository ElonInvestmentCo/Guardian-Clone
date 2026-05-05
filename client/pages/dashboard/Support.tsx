import { useState } from "react";
import { HelpCircle, MessageSquare, ChevronDown, ChevronUp, ExternalLink, Send, CheckCircle, Phone, Mail, BookOpen } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { getApiBase } from "@/lib/api";

const FAQS = [
  {
    q: "How do I fund my trading account?",
    a: "Funding your account is handled directly with our clearing team. Please log into your client portal and navigate to the Funding Details section, or contact our support team directly for wire transfer instructions.",
  },
  {
    q: "How do I obtain stock locates for short selling?",
    a: "Guardian Trading has an in-house stock borrow desk. You can place locate requests through DAS Trader Pro or Sterling Trader® Pro, or contact our borrows & locates team directly for hard-to-borrow securities.",
  },
  {
    q: "What are the minimum commission rates?",
    a: "Equities commissions start as low as $0.0005 per share and options contracts from $0.15 per contract. Actual rates are negotiated based on trading volume and account type.",
  },
  {
    q: "How do I set up DAS Trader Pro or Sterling Trader® Pro?",
    a: "After your account is approved, our team will send you login credentials for your chosen platform. Visit guardiiantrading.com/platforms for setup guides and configuration documentation.",
  },
  {
    q: "What is the KYC process and how long does it take?",
    a: "KYC (Know Your Customer) verification typically takes 1–3 business days. You'll need to provide valid government-issued ID and complete the identity verification steps in your onboarding flow.",
  },
  {
    q: "How do I reset my account password?",
    a: "You can reset your password from the Login page by clicking 'Forgot Password'. A reset link will be sent to your registered email address. For additional help, contact our support team.",
  },
  {
    q: "How can I modify my commission structure?",
    a: "Commission rates are negotiated based on your trading volume and activity. Please reach out to our support team to discuss potential rate adjustments for your account.",
  },
];

const RESOURCES = [
  { label: "Platform Setup Guides", sub: "DAS Trader Pro & Sterling Trader®", href: "https://www.guardiiantrading.com/platforms", icon: <BookOpen size={16} /> },
  { label: "Blog & Insights",       sub: "Trading strategies & market commentary", href: "https://www.guardiiantrading.com", icon: <ExternalLink size={16} /> },
  { label: "Contact by Phone",      sub: "Speak directly with our team", href: "tel:+1-800-0000000", icon: <Phone size={16} /> },
];

type FormState = "idle" | "sending" | "sent" | "error";

export default function Support() {
  const { colors } = useTheme();
  const email = sessionStorage.getItem("signupEmail") ?? "";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tab, setTab] = useState<"contact" | "faq" | "resources">("contact");
  const [form, setForm] = useState({ name: "", email: email, category: "General", message: "" });
  const [formState, setFormState] = useState<FormState>("idle");
  const base = getApiBase();

  const CATEGORIES = ["General", "Account", "Trading Platforms", "Commissions & Billing", "KYC / Verification", "Technical Issue", "Other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim() || !form.email.trim()) return;
    setFormState("sending");
    try {
      const res = await fetch(`${base}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setFormState(res.ok ? "sent" : "error");
    } catch {
      setFormState("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
    border: `1px solid ${colors.inputBorder}`, background: colors.inputBg,
    color: colors.inputText, outline: "none",
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "24px 20px", maxWidth: "860px" }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: colors.textPrimary }}>Support</h1>
            <p style={{ fontSize: "12px", color: colors.textMuted, marginTop: "2px" }}>Help center, FAQs & contact your account team</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { icon: <MessageSquare size={18} color={colors.accent} />, label: "Live Chat", sub: "Mon–Fri, 9am–5pm ET", bg: "rgba(59,130,246,0.1)" },
            { icon: <Mail size={18} color={colors.green} />,           label: "Email Support", sub: "Response within 1 business day", bg: colors.greenBg },
            { icon: <Phone size={18} color={colors.purple} />,          label: "Phone Support", sub: "Dedicated account team", bg: "rgba(167,139,250,0.1)" },
          ].map(({ icon, label, sub, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "16px" }}>
              <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: "40px", height: "40px", background: bg }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: colors.textPrimary }}>{label}</p>
                <p style={{ fontSize: "11px", color: colors.textMuted }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: colors.filterBar, width: "fit-content" }}>
          {(["contact", "faq", "resources"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 18px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 600, border: "none", cursor: "pointer",
              background: tab === t ? colors.card : "transparent",
              color: tab === t ? colors.textPrimary : colors.textMuted,
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}>
              {t === "contact" ? "Contact Us" : t === "faq" ? "FAQs" : "Resources"}
            </button>
          ))}
        </div>

        {tab === "contact" && (
          <div className="rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "24px" }}>
            {formState === "sent" ? (
              <div className="flex flex-col items-center justify-center" style={{ padding: "32px 0" }}>
                <div className="flex items-center justify-center rounded-full mb-4" style={{ width: "56px", height: "56px", background: colors.greenBg }}>
                  <CheckCircle size={28} color={colors.green} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: colors.textPrimary, marginBottom: "6px" }}>Message sent!</h3>
                <p style={{ fontSize: "13px", color: colors.textMuted, textAlign: "center", maxWidth: "320px" }}>
                  Our support team will get back to you within 1 business day.
                </p>
                <button onClick={() => { setFormState("idle"); setForm((f) => ({ ...f, message: "" })); }}
                  style={{ marginTop: "20px", padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, background: colors.accent, border: "none", color: "#fff", cursor: "pointer" }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary, marginBottom: "20px" }}>Send a message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name"
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.inputFocusBorder; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.inputBorder; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.inputFocusBorder; }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.inputBorder; }}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mb-5">
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your question or issue in detail..."
                    required
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                    onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = colors.inputFocusBorder; }}
                    onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = colors.inputBorder; }}
                  />
                </div>
                {formState === "error" && (
                  <p style={{ fontSize: "12px", color: colors.red, marginBottom: "12px" }}>Failed to send. Please try again or email us directly.</p>
                )}
                <button type="submit" disabled={formState === "sending"} className="flex items-center gap-2" style={{
                  padding: "10px 22px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                  background: colors.accent, border: "none", color: "#fff", cursor: formState === "sending" ? "not-allowed" : "pointer", opacity: formState === "sending" ? 0.7 : 1,
                }}>
                  {formState === "sending" ? (
                    <>
                      <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Sending…
                    </>
                  ) : (
                    <><Send size={14} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "faq" && (
          <div className="rounded-xl overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
            {FAQS.map((faq, idx) => (
              <div key={idx} style={{ borderBottom: idx < FAQS.length - 1 ? `1px solid ${colors.tableRowBorder}` : "none" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-start justify-between gap-4 text-left"
                  style={{ padding: "18px 20px", background: "none", border: "none", cursor: "pointer" }}
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={15} color={colors.accent} style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textPrimary }}>{faq.q}</span>
                  </div>
                  {openFaq === idx ? <ChevronUp size={16} color={colors.textMuted} style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color={colors.textMuted} style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === idx && (
                  <div style={{ padding: "0 20px 18px 52px" }}>
                    <p style={{ fontSize: "13px", color: colors.textSub, lineHeight: "1.65" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "resources" && (
          <div className="flex flex-col gap-3">
            {RESOURCES.map(({ label, sub, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div className="flex items-center gap-4 rounded-xl cursor-pointer" style={{
                  background: colors.card, border: `1px solid ${colors.cardBorder}`, padding: "18px 20px", transition: "border-color 0.15s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.accent; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.cardBorder; }}
                >
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: "42px", height: "42px", background: colors.filterBar, color: colors.textMuted }}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textPrimary }}>{label}</p>
                    <p style={{ fontSize: "12px", color: colors.textMuted }}>{sub}</p>
                  </div>
                  <ExternalLink size={14} color={colors.textMuted} />
                </div>
              </a>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </DashboardLayout>
  );
}
