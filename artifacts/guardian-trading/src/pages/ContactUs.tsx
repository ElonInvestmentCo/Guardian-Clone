import { useState } from "react";
import { Layout } from "@/components/Layout";

const BG_VECTOR = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-background-vector-1.png";
const RECAPTCHA_LOGO = "https://www.gstatic.com/recaptcha/api2/logo_48.png";

export default function ContactUs() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const MAX_CHARS = 600;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "#ffffff",
    border: "1px solid #cccccc",
    borderRadius: "2px",
    fontSize: "14px",
    color: "#333333",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: "5px",
  };

  return (
    <Layout title="Contact Us | Guardian Trading">

      {/* ── SINGLE BACKGROUND WRAPPER ── */}
      <div
        style={{
          marginTop: "78px",
          position: "relative",
          backgroundImage: `url('${BG_VECTOR}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.15)", zIndex: 0 }} />

        {/* ── HERO ── */}
        <section
          className="relative flex items-center justify-center text-center"
          style={{ minHeight: "260px", zIndex: 1 }}
        >
          <div className="py-16 px-4">
            <h1
              className="font-bold text-white"
              style={{ fontSize: "clamp(32px, 5vw, 50px)", letterSpacing: "-0.01em" }}
            >
              Contact Us
            </h1>
          </div>
        </section>

        {/* ── CONTENT ── */}
        <section className="py-14 px-6" style={{ position: "relative", zIndex: 1 }}
      >
        <div
          className="max-w-[1100px] mx-auto"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.6fr",
            gap: "64px",
            alignItems: "start",
          }}
        >
          {/* Left — Company Info */}
          <div>
            <h2 className="text-white font-bold mb-4" style={{ fontSize: "22px" }}>
              Guardian Trading
            </h2>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "15px", lineHeight: 1.6, marginBottom: "16px" }}>
              A Division of Velocity Clearing, LLC (&ldquo;Velocity&rdquo;). Member FINRA/ SIPC.
            </p>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "15px", fontWeight: 600, marginBottom: "28px" }}>
              All securities and transactions are handled through Velocity.
            </p>

            <p style={{ color: "#76d1f5", fontSize: "14px", fontWeight: 700, marginBottom: "12px", letterSpacing: "0.03em" }}>
              For Customer Service
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", lineHeight: 1.7 }}>
              Please call:{" "}
              <a href="tel:8886020092" style={{ color: "#76d1f5", textDecoration: "none", fontWeight: 600 }}>
                888-602-0092
              </a>{" "}
              During Market Hours or email{" "}
              <a href="mailto:support@guardiiantrading.com" style={{ color: "#76d1f5", textDecoration: "none", display: "block", marginTop: "2px" }}>
                support@guardiiantrading.com
              </a>
            </p>
          </div>

          {/* Right — Contact Form */}
          <div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "18px" }}>
              <span style={{ color: "#c0392b", fontWeight: 700 }}>*</span>&ldquo;*&rdquo; indicates required fields
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              {/* Name row */}
              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "4px" }}>First</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "4px" }}>Last</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email + Phone row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>
                    Email <span style={{ color: "#c0392b" }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>
                  Message <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                  Enter your message below and we will get back to you as soon as possible!
                </p>
                <textarea
                  value={message}
                  maxLength={MAX_CHARS}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  required
                />
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                  {message.length} of {MAX_CHARS} max characters
                </p>
              </div>

              {/* Privacy text */}
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
                velocityclearingllc.com needs the contact information you provide to us to contact you about our products and services. You may unsubscribe from these communications at any time. For information on how to unsubscribe, as well as our privacy practices and commitment to protecting your privacy, please review our{" "}
                <a href="#" style={{ color: "#76d1f5", textDecoration: "underline" }}>Privacy Policy</a>.
              </p>

              {/* Submit + reCAPTCHA */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  style={{
                    background: "#4a7fbd",
                    color: "#ffffff",
                    border: "none",
                    padding: "13px 36px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    borderRadius: "2px",
                    letterSpacing: "0.03em",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#3a6fad"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4a7fbd"; }}
                >
                  Submit
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={RECAPTCHA_LOGO} alt="reCAPTCHA" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                  <div>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.4 }}>Protected by reCAPTCHA</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>Privacy</a>
                      {" · "}
                      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>Terms</a>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        </section>
      </div>

    </Layout>
  );
}
