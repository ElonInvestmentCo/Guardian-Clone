import { Link } from "wouter";
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

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

export default function ApplicationPending() {
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
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "38px", width: "auto" }} /></Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4]" style={{ fontSize: "13px", fontWeight: 500 }}>
                {link.name}
                {link.hasDropdown && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
              </Link>
            ))}
          </div>
          <button className="text-white font-medium px-5 py-1.5 border hover:bg-white/10" style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}>Logout</button>
        </div>
      </nav>

      {/* Step bar — all completed */}
      <div className="bg-white px-6 py-5" style={{ borderBottom: "1px solid #dde3e9" }}>
        <div className="flex items-start justify-between">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex flex-col items-center" style={{ flex: 1 }}>
              <div className="flex items-center w-full">
                <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : "#3a7bd5" }} />
                <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                  style={{ width: "28px", height: "28px", fontSize: "12px", background: "#3a7bd5", color: "white", border: "2px solid #3a7bd5" }}>
                  {step.n}
                </div>
                <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : "#3a7bd5" }} />
              </div>
              <p className="text-center mt-1.5 leading-tight whitespace-pre-line"
                style={{ fontSize: "9px", color: "#3a7bd5", fontWeight: 700, maxWidth: "70px" }}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>
          <div className="px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <p style={{ fontSize: "15px", color: "#3a7bd5", fontWeight: 600 }}>Application</p>
          </div>
          <div className="py-16 flex flex-col items-center" style={{ minHeight: "220px" }}>
            <span className="inline-block mb-5 px-4 py-1.5 rounded font-bold text-white"
              style={{ background: "#28a745", fontSize: "13px", letterSpacing: "0.03em" }}>
              Pending
            </span>
            <h2 className="font-semibold" style={{ fontSize: "18px", color: "#333" }}>
              Your Application has been Successfully Submitted.
            </h2>
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
