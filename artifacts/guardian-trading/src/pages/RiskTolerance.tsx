import { useState } from "react";
import { Link, useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";

const STEPS = [
  { n: 1,  label: "PERSONAL\nDETAILS" },
  { n: 2,  label: "PROFESSIONAL\nDETAILS" },
  { n: 3,  label: "ID\nINFORMATION" },
  { n: 4,  label: "INCOME\nDETAILS" },
  { n: 5,  label: "FINANCIAL\nSITUATION" },
  { n: 6,  label: "RISK\nTOLERANCE" },
  { n: 7,  label: "INVESTMENT\nEXPERIENCE" },
  { n: 8,  label: "IDENTIFICATION\nPROOF UPLOAD" },
  { n: 9,  label: "FUNDING\nDETAILS" },
  { n: 10, label: "DISCLOSURES" },
  { n: 11, label: "SIGNATURES" },
];

const CURRENT_STEP = 6;

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

const RISK_OPTIONS = [
  {
    key: "conservative",
    label: "Conservative",
    desc: "I want to preserve my initial principal in this account, with minimal risk, even if that means this account does not generate significant income or returns and may not keep pace with inflation.",
  },
  {
    key: "moderately-conservative",
    label: "Moderately Conservative",
    desc: "I am willing to accept low risk to my initial principal, including low volatility, to seek a modest level of portfolio returns.",
  },
  {
    key: "moderate",
    label: "Moderate",
    desc: "I am willing to accept some risk to my initial principal and tolerate some volatility to seek higher returns, and I understand I could lose a portion of the money invested.",
  },
  {
    key: "moderately-aggressive",
    label: "Moderately Aggressive",
    desc: "I am willing to accept high risk to my initial principal, including high volatility, to seek high returns over time and understand I could lose a substantial amount of the money invested.",
  },
  {
    key: "significant",
    label: "Significant Risk",
    desc: "I am willing to accept maximum risk to my initial principal to aggressively seek maximum returns, and I understand I could lose most, or all, of the money invested.",
  },
];

const STRATEGIES = [
  {
    key: "income",
    label: "Income",
    desc: "Focus on investments that generate income",
  },
  {
    key: "growth",
    label: "Growth of Account",
    desc: "Focus on Investments that are looking to grow in value",
  },
  {
    key: "speculation",
    label: "Speculation",
    desc: "Focus on assets with a chance of significant value increased. Ability to sustain high losses to achieve this objective",
  },
  {
    key: "trading",
    label: "Trading",
    desc: "Looking to employ strategies on short term opportunities. This strategy tends to yield high turnover, and high risk",
  },
  {
    key: "capital",
    label: "Capital Preservation",
    desc: "Primary goal is to preserve capital and prevent loss in a portfolio",
  },
];

const PRIORITY_OPTIONS = ["1", "2", "3", "4", "5"];

const selectStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "7px 28px 7px 10px",
  color: "#555",
  fontSize: "13px",
  appearance: "none" as const,
  cursor: "pointer",
  width: "160px",
};

export default function RiskTolerance() {
  const [, navigate] = useLocation();
  const [riskChecks, setRiskChecks] = useState<Set<string>>(new Set());
  const [hasEducation, setHasEducation] = useState<string>("");
  const [priorities, setPriorities] = useState<Record<string, string>>({
    income: "", growth: "", speculation: "", trading: "", capital: "",
  });

  const toggleRisk = (key: string) =>
    setRiskChecks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("riskTolerance", {
      riskTolerances: Array.from(riskChecks),
      hasFinancialEducation: hasEducation,
      strategyPriorities: priorities,
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      {/* ── Top phone bar ── */}
      <div className="flex items-center justify-end px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          844-963-1512
        </a>
      </div>

      {/* ── Navbar ── */}
      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-6 h-[54px]">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src={guardianLogo} alt="Guardian Trading" style={{ height: "38px", width: "auto", objectFit: "contain" }} />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4] transition-colors" style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.02em" }}>
                {link.name}
                {link.hasDropdown && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
          <button className="text-white font-medium px-5 py-1.5 border transition-colors hover:bg-white/10" style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Step progress bar ── */}
      <div className="bg-white px-6 py-5" style={{ borderBottom: "1px solid #dde3e9" }}>
        <div className="flex items-start justify-between">
          {STEPS.map((step, i) => {
            const active = step.n === CURRENT_STEP;
            const done   = step.n < CURRENT_STEP;
            return (
              <div key={step.n} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="flex items-center w-full">
                  <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : (done || active) ? "#3a7bd5" : "#ccd3da" }} />
                  <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{ width: "28px", height: "28px", fontSize: "12px",
                      background: (active || done) ? "#3a7bd5" : "white",
                      color: (active || done) ? "white" : "#aaa",
                      border: `2px solid ${(active || done) ? "#3a7bd5" : "#ccd3da"}`,
                    }}>
                    {step.n}
                  </div>
                  <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : done ? "#3a7bd5" : "#ccd3da" }} />
                </div>
                <p className="text-center mt-1.5 leading-tight whitespace-pre-line"
                  style={{ fontSize: "9px", color: (active || done) ? "#3a7bd5" : "#999", fontWeight: (active || done) ? 700 : 400, maxWidth: "70px" }}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

          {/* Card header */}
          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
              Risk Tolerance
            </h1>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} noValidate>

              {/* Warning notice */}
              <p className="mb-5 leading-relaxed" style={{ fontSize: "12px", color: "#555" }}>
                <strong>We consider day trading to be a high-risk trading strategy.</strong>{" "}
                Please ensure that you have read and understand the accompanying Day Trading Risk Disclosure Statement before submitting your new account documentation. It is in your best interest to carefully consider whether or not you have a significant risk tolerance before proceeding with this form.
              </p>

              {/* Investment Risk Tolerance section */}
              <div className="mb-5" style={{ border: "1px solid #dde3e9", borderRadius: "2px", padding: "16px 20px" }}>
                <p className="font-semibold mb-1" style={{ fontSize: "15px", color: "#333" }}>
                  Investment Risk Tolerance
                </p>
                <p className="mb-4" style={{ fontSize: "12px", color: "#777" }}>
                  Please select the degree of risk you are willing to take with the assets in this account
                </p>

                <div className="flex flex-col gap-3">
                  {RISK_OPTIONS.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-start gap-4">
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0" style={{ minWidth: "200px" }}>
                        <input
                          type="checkbox"
                          checked={riskChecks.has(key)}
                          onChange={() => toggleRisk(key)}
                          style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: "13px", color: "#444", fontWeight: 500 }}>{label}</span>
                      </label>
                      <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education question */}
              <div className="mb-5">
                <p className="mb-2" style={{ fontSize: "13px", color: "#444" }}>
                  Have you had education in trading/financial markets?<span style={{ color: "#e53e3e" }}>*</span>
                </p>
                <div className="flex items-center gap-6">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="education"
                        value={opt}
                        checked={hasEducation === opt}
                        onChange={() => setHasEducation(opt)}
                        style={{ width: "14px", height: "14px", accentColor: "#3a7bd5" }}
                      />
                      <span style={{ fontSize: "13px", color: "#555" }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Strategy priority section */}
              <div className="mb-6">
                <p className="mb-4" style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
                  Please detail the trading strategy you are looking to employ at Guardian On a scale of 1-5 in terms of priority, 5 being the highest, and 1 being the lowest in terms of priority, please review and evaluate the below.{" "}
                  <span style={{ color: "#e53e3e" }}>*</span>
                </p>

                <div className="flex flex-col gap-3">
                  {STRATEGIES.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-5">
                      <div className="relative flex-shrink-0">
                        <select
                          value={priorities[key]}
                          onChange={(e) => setPriorities((p) => ({ ...p, [key]: e.target.value }))}
                          style={selectStyle}
                          className="focus:outline-none"
                        >
                          <option value="" disabled>Please Select</option>
                          {PRIORITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: "#555" }}>
                        <strong style={{ color: "#333" }}>{label}</strong>{" "}
                        <span>: {desc}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/financial-situation")}
                  className="font-medium hover:bg-gray-50 transition-colors"
                  style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ── Dark Footer ── */}
      <footer style={{ background: "#111" }}>
        <div className="px-10 pt-12 pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/"><img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto", objectFit: "contain" }} /></Link>
            </div>
            <div className="flex flex-1 flex-wrap gap-12">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Company</h4>
                <ul className="flex flex-col gap-2.5">
                  {["About","Services","Platforms","Pricing","Insights"].map((item) => (
                    <li key={item}><Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Legal</h4>
                <ul className="flex flex-col gap-2.5">
                  {["Disclosures","Privacy Policy"].map((item) => (
                    <li key={item}><a href="#" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>{item}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Contact</h4>
                <div className="flex flex-col gap-2.5">
                  <a href="tel:8886020092" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>888-602-0092</a>
                  <a href="mailto:info@guardiantrading.com" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>info@guardiantrading.com</a>
                  <p className="text-[13px]" style={{ color: "#bbb" }}>1301 Route 36 Suite 109 Hazlet, NJ 07730</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-10 py-8 text-center">
          <p className="text-[13px] mb-1" style={{ color: "#aaa" }}>Guardian Trading – A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.</p>
          <p className="text-[13px] mb-6" style={{ color: "#aaa" }}>All securities and transactions are handled through Velocity.</p>
          <p className="text-[11px] uppercase leading-relaxed mb-5" style={{ color: "#666", maxWidth: "900px", margin: "0 auto 20px" }}>
            @2023 VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF{" "}
            <a href="https://www.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA</a> AND{" "}
            <a href="https://www.sipc.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>SIPC</a>.{" "}
            MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON{" "}
            <a href="https://brokercheck.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA'S BROKER CHECK</a>.
          </p>
          <p className="text-[11px] uppercase leading-relaxed" style={{ color: "#666", maxWidth: "900px", margin: "0 auto" }}>
            OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE{" "}
            <a href="#" style={{ color: "#5baad4" }}>CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>,{" "}
            ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT{" "}
            <a href="mailto:info@guardiantrading.com" style={{ color: "#5baad4" }}>INFO@GUARDIANTRADING.COM</a>{" "}
            TO RECEIVE A COPY OF THE ODD.
          </p>
        </div>
      </footer>
    </div>
  );
}
