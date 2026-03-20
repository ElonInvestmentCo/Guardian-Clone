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
  { n: 5,  label: "RISK\nTOLERANCE" },
  { n: 6,  label: "FINANCIAL\nSITUATION" },
  { n: 7,  label: "INVESTMENT\nEXPERIENCE" },
  { n: 8,  label: "IDENTIFICATION\nPROOF UPLOAD" },
  { n: 9,  label: "FUNDING\nDETAILS" },
  { n: 10, label: "DISCLOSURES" },
  { n: 11, label: "SIGNATURES" },
];
const CURRENT_STEP = 10;

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

type YNVal = "yes" | "no" | "";

function YesNo({
  value,
  onChange,
}: {
  value: YNVal;
  onChange: (v: YNVal) => void;
}) {
  return (
    <div className="flex items-center gap-5 mt-1.5">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={value === "yes"} onChange={() => onChange("yes")} style={{ accentColor: "#3a7bd5" }} />
        <span style={{ fontSize: "12px", color: "#555" }}>Yes</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={value === "no"} onChange={() => onChange("no")} style={{ accentColor: "#3a7bd5" }} />
        <span style={{ fontSize: "12px", color: "#555" }}>No</span>
      </label>
    </div>
  );
}

export default function Disclosures() {
  const [, navigate] = useLocation();

  const [wantsMargin, setWantsMargin] = useState<YNVal>("no");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [q1, setQ1] = useState<YNVal>("");
  const [q2, setQ2] = useState<YNVal>("");
  const [q3, setQ3] = useState<YNVal>("");
  const [q4, setQ4] = useState<YNVal>("");
  const [q5, setQ5] = useState<YNVal>("");
  const [q6, setQ6] = useState<YNVal>("");
  const [q7, setQ7] = useState<YNVal>("");
  const [q8, setQ8] = useState<YNVal>("");
  const [q9, setQ9] = useState<YNVal>("");
  const [q10, setQ10] = useState<YNVal>("");
  const [taxWithholding, setTaxWithholding] = useState<"not_subject" | "subject" | "non_resident">("not_subject");
  const [partnershipCheck, setPartnershipCheck] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("disclosures", {
      wantsMargin, initialDeposit, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
      taxWithholding, partnershipCheck,
    });
    navigate("/signatures");
  };

  const qStyle: React.CSSProperties = { fontSize: "12px", color: "#555", lineHeight: "1.55", marginBottom: "2px" };
  const blockStyle: React.CSSProperties = { marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #eef1f4" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      {/* Top bar */}
      <div className="flex items-center justify-end px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          844-963-1512
        </a>
      </div>

      {/* Navbar */}
      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-6 h-[54px]">
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "38px", width: "auto", objectFit: "contain" }} /></Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4] transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {link.name}
                {link.hasDropdown && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
              </Link>
            ))}
          </div>
          <button className="text-white font-medium px-5 py-1.5 border hover:bg-white/10" style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}>Logout</button>
        </div>
      </nav>

      {/* Step bar */}
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
                      border: `2px solid ${(active || done) ? "#3a7bd5" : "#ccd3da"}` }}>
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

      {/* Main */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>
          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Disclosures</h1>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} noValidate>

              {/* ── Margin section ── */}
              <div className="mb-5">
                <p className="font-semibold mb-2" style={{ fontSize: "13px", color: "#333" }}>
                  Borrowing Money to Buy Securities (Buying 'on Margin'). (Please read carefully)
                </p>
                <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "10px" }}>
                  You choose to have a 'margin loan account' (commonly known as 'margin account') by checking the boxes below. To help you decide whether a margin loan account is right for you, please read the information below and the client agreement.
                </p>
                <p style={qStyle}>
                  You wish to borrow funds in my account and would like to open a margin account: I have read the client agreement and disclosures understand my right and obligation under it. *
                </p>
                <YesNo value={wantsMargin} onChange={setWantsMargin} />
              </div>

              {/* ── Day Traders notice ── */}
              <div className="mb-5 p-3" style={{ background: "#fafbfc", border: "1px solid #e8edf2", borderRadius: "2px" }}>
                <p style={{ fontSize: "11.5px", color: "#666", lineHeight: "1.6" }}>
                  <strong>Please Note:</strong> Please Day trading accounts are only offered to an account that maintains balance greater than $25,000.
                  Therefore, Guardian requires an Initial deposit for such accounts of at least $30,000.
                </p>
              </div>

              <div style={blockStyle}>
                <p style={qStyle}>Please state your approximate initial deposit: *</p>
                <input
                  type="text"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  style={{ marginTop: "6px", width: "100%", maxWidth: "360px", padding: "7px 10px", fontSize: "13px", border: "1px solid #ccd3da", borderRadius: "2px", color: "#444" }}
                />
              </div>

              {/* ── Yes/No questions ── */}
              {[
                { q: "Do you currently maintain an account at Guardian in which you have control, beneficial interest, or trading authority? *", val: q1, set: setQ1 },
                { q: "Do you have a relationship with an entity that currently maintains an account at Guardian, such as employee, officer, shareholder, member, partner or owner? *", val: q2, set: setQ2 },
                { q: "Are either you or an immediate family member an officer, director or at least a 10% shareholder in a publicly traded company? *", val: q3, set: setQ3 },
                { q: "Are either you or an immediate family member employed by FINRA, a registered broker dealer or a securities exchange? *", val: q4, set: setQ4 },
                { q: "Are you a senior officer of a bank, savings and loan institution, investment company, investment advisory firm, or other financial institution? *", val: q5, set: setQ5 },
                { q: "Are either you or an immediate relative or family member a senior political figure? *", val: q6, set: setQ6 },
              ].map(({ q, val, set }, idx) => (
                <div key={idx} style={blockStyle}>
                  <p style={qStyle}>{q}</p>
                  <YesNo value={val} onChange={set} />
                </div>
              ))}

              {/* Guardian Addendum question with View link */}
              <div style={blockStyle}>
                <p style={qStyle}>
                  Have you read, reviewed, and agree to the 'Guardian Addendum to Customer Agreement fee Testing' form ?{" "}
                  <a href="#" style={{ color: "#3a7bd5", textDecoration: "underline" }}>View</a>
                </p>
                <YesNo value={q7} onChange={setQ7} />
              </div>

              {[
                { q: "If you are opening a day trading account with Guardian Trading, do you have $25,000 in available investment capital? *", val: q8, set: setQ8 },
                { q: "Does your sole objective with this account involve high risk? *", val: q9, set: setQ9 },
                { q: "Are you able to withstand losing more or all of your investment in your Guardian Trading account? *", val: q10, set: setQ10 },
              ].map(({ q, val, set }, idx) => (
                <div key={idx} style={blockStyle}>
                  <p style={qStyle}>{q}</p>
                  <YesNo value={val} onChange={set} />
                </div>
              ))}

              {/* ── Tax Withholding Certifications ── */}
              <div className="mb-6">
                <div className="px-4 py-2 mb-4" style={{ background: "#e8edf2", borderRadius: "2px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#444" }}>Tax Withholding Certifications - Choose One</p>
                </div>

                <p className="mb-3" style={{ fontSize: "12px", color: "#555", fontWeight: 600 }}>U.S. Person: Under penalty of perjury, I certify that:</p>

                {/* Not Subject */}
                <label className="flex gap-2 mb-3 cursor-pointer">
                  <input type="radio" name="taxWithholding" checked={taxWithholding === "not_subject"} onChange={() => setTaxWithholding("not_subject")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <div>
                    <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "6px" }}>Not Subject to Backup Withholding</p>
                    <ol style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.7", paddingLeft: "18px" }}>
                      <li>The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me), and</li>
                      <li>I am not subject to backup withholding, or
                        <ol type="a" style={{ paddingLeft: "18px", marginTop: "4px" }}>
                          <li>I am exempt from backup withholding, or</li>
                          <li>I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of failure to report all interest or dividends, or</li>
                        </ol>
                        <p style={{ marginTop: "4px" }}>The IRS has notified me that I am no longer subject to backup withholding</p>
                      </li>
                      <li>I am a U.S. citizen or other U.S. person (defined below), and</li>
                      <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                    </ol>
                  </div>
                </label>

                {/* Subject to Backup */}
                <label className="flex gap-2 mb-3 cursor-pointer">
                  <input type="radio" name="taxWithholding" checked={taxWithholding === "subject"} onChange={() => setTaxWithholding("subject")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <div>
                    <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "6px" }}>Subject to Backup Withholding</p>
                    <ol style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.7", paddingLeft: "18px" }}>
                      <li>The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me), and</li>
                      <li>I am a U.S. citizen or other U.S. person (defined below), and</li>
                      <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                    </ol>
                  </div>
                </label>

                {/* Partnership checkbox */}
                <label className="flex gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={partnershipCheck} onChange={(e) => setPartnershipCheck(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>
                    Check this box if you are a partnership (including an LLC classified as a partnership for U.S. federal tax purposes) trust, or estate that has any foreign partners, owners, or beneficiaries, and you are providing this form to a partnership, trust, or estate.
                    You must check this box if you receive a Form W-8 (or documentary evidence) from any partner, owner, or beneficiary establishing foreign status or if you receive a Form W-9 from any partner, owner, or beneficiary that has checked this box.
                    Note a partnership that provides a Form W-9 and checks this box may be required to complete Schedules K-2 and K-3 (Form 1065). For more information, see the Partnership Instructions for Schedules K-2 and K-3 (Form 1065).
                  </p>
                </label>

                {/* Non-Resident Alien */}
                <label className="flex gap-2 cursor-pointer">
                  <input type="radio" name="taxWithholding" checked={taxWithholding === "non_resident"} onChange={() => setTaxWithholding("non_resident")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>
                    Non Residence Alien: I certify that I am not a U.S resident alien or other U.S. person for U.S. tax purpose and I am submitting the applicable Form W-8 with this Application to certify my foreign status and if applicable, claim tax treaty benefits.
                  </p>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate("/funding-details")} className="font-medium hover:bg-gray-50"
                  style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>
                  Previous
                </button>
                <button type="submit" className="text-white font-semibold hover:opacity-90"
                  style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}>
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#111" }}>
        <div className="px-10 pt-12 pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/"><img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto" }} /></Link>
            </div>
            <div className="flex flex-1 flex-wrap gap-12">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Company</h4>
                <ul className="flex flex-col gap-2.5">{["About","Services","Platforms","Pricing","Insights"].map((item) => (<li key={item}><Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>{item}</Link></li>))}</ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Legal</h4>
                <ul className="flex flex-col gap-2.5">{["Disclosures","Privacy Policy"].map((item) => (<li key={item}><a href="#" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>{item}</a></li>))}</ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Contact</h4>
                <div className="flex flex-col gap-2.5">
                  <a href="tel:8886020092" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>888-602-0092</a>
                  <a href="mailto:info@guardiantrading.com" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>info@guardiantrading.com</a>
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
            @2023 VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF <a href="https://www.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA</a> AND <a href="https://www.sipc.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>SIPC</a>. MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON <a href="https://brokercheck.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA'S BROKER CHECK</a>.
          </p>
          <p className="text-[11px] uppercase leading-relaxed" style={{ color: "#666", maxWidth: "900px", margin: "0 auto" }}>
            OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE <a href="#" style={{ color: "#5baad4" }}>CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>, ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT <a href="mailto:info@guardiantrading.com" style={{ color: "#5baad4" }}>INFO@GUARDIANTRADING.COM</a> TO RECEIVE A COPY OF THE ODD.
          </p>
        </div>
      </footer>
    </div>
  );
}
