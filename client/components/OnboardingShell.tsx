import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";

const STEPS = [
  { n: 1,  label: "Personal\nDetails" },
  { n: 2,  label: "Professional\nDetails" },
  { n: 3,  label: "ID\nInformation" },
  { n: 4,  label: "Income\nDetails" },
  { n: 5,  label: "Risk\nTolerance" },
  { n: 6,  label: "Financial\nSituation" },
  { n: 7,  label: "Investment\nExperience" },
  { n: 8,  label: "ID Proof\nUpload" },
  { n: 9,  label: "Funding\nDetails" },
  { n: 10, label: "Disclosures" },
  { n: 11, label: "Signatures" },
];

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

interface OnboardingShellProps {
  currentStep?: number;
  children: React.ReactNode;
}

export default function OnboardingShell({ currentStep, children }: OnboardingShellProps) {
  const [, navigate] = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      <div className="hidden sm:flex items-center justify-end px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          844-963-1512
        </a>
      </div>

      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-3 sm:px-6 h-[50px] sm:h-[54px]">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src={guardianLogo} alt="Guardian Trading" className="h-[30px] sm:h-[38px] w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-0.5 text-white hover:text-[#5baad4] transition-colors whitespace-nowrap"
                style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.02em" }}
              >
                {link.name}
                {link.hasDropdown && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="text-white font-medium px-3 sm:px-5 py-1.5 border transition-colors hover:bg-white/10"
            style={{ fontSize: "12px", borderColor: "#5baad4", borderRadius: "3px" }}
          >
            Logout
          </button>
        </div>
      </nav>

      {currentStep !== undefined && (
        <div className="bg-white overflow-x-auto" style={{ borderBottom: "1px solid #dde3e9" }}>
          <div className="flex items-start px-2 sm:px-4 py-3 sm:py-4" style={{ minWidth: "580px" }}>
            {STEPS.map((step, i) => {
              const active = step.n === currentStep;
              const done   = step.n < currentStep;
              return (
                <div key={step.n} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center w-full">
                    <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : (done || active) ? "#3a7bd5" : "#ccd3da" }} />
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                      style={{
                        width: "26px", height: "26px", fontSize: "11px",
                        background: (active || done) ? "#3a7bd5" : "white",
                        color: (active || done) ? "white" : "#aaa",
                        border: `2px solid ${(active || done) ? "#3a7bd5" : "#ccd3da"}`,
                      }}
                    >
                      {step.n}
                    </div>
                    <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : done ? "#3a7bd5" : "#ccd3da" }} />
                  </div>
                  <p
                    className="text-center mt-1 leading-tight whitespace-pre-line"
                    style={{ fontSize: "8px", color: (active || done) ? "#3a7bd5" : "#999", fontWeight: (active || done) ? 700 : 400, maxWidth: "60px" }}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      <footer style={{ background: "#111" }}>
        <div className="px-4 sm:px-10 pt-8 sm:pt-12 pb-8 sm:pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/">
                <img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
              </Link>
            </div>
            <div className="flex flex-1 flex-wrap gap-8 sm:gap-12">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 sm:mb-4" style={{ color: "#aaa" }}>Company</h4>
                <ul className="flex flex-col gap-2">
                  {["About", "Services", "Platforms", "Pricing", "Insights"].map((item) => (
                    <li key={item}>
                      <Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 sm:mb-4" style={{ color: "#aaa" }}>Legal</h4>
                <ul className="flex flex-col gap-2">
                  {["Disclosures", "Privacy Policy"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 sm:mb-4" style={{ color: "#aaa" }}>Contact</h4>
                <div className="flex flex-col gap-2">
                  <a href="tel:8886020092" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>888-602-0092</a>
                  <a href="mailto:info@guardiiantrading.com" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>info@guardiiantrading.com</a>
                  <p className="text-[13px]" style={{ color: "#bbb" }}>1301 Route 36 Suite 109 Hazlet, NJ 07730</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-10 py-6 sm:py-8 text-center">
          <p className="text-[12px] sm:text-[13px] mb-1" style={{ color: "#aaa" }}>Guardian Trading - A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.</p>
          <p className="text-[12px] sm:text-[13px] mb-4 sm:mb-6" style={{ color: "#aaa" }}>All securities and transactions are handled through Velocity.</p>
          <p className="text-[10px] sm:text-[11px] uppercase leading-relaxed mb-4 sm:mb-5" style={{ color: "#666", maxWidth: "900px", margin: "0 auto 16px" }}>
            @2023 VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF{" "}
            <a href="https://www.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA</a>{" "}
            AND{" "}
            <a href="https://www.sipc.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>SIPC</a>.
            {" "}MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON{" "}
            <a href="https://brokercheck.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA'S BROKER CHECK</a>.
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase leading-relaxed" style={{ color: "#666", maxWidth: "900px", margin: "0 auto" }}>
            OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE{" "}
            <a href="#" style={{ color: "#5baad4" }}>CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>,
            {" "}ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT{" "}
            <a href="mailto:info@guardiiantrading.com" style={{ color: "#5baad4" }}>INFO@GUARDIIANTRADING.COM</a>
            {" "}TO RECEIVE A COPY OF THE ODD.
          </p>
        </div>
      </footer>
    </div>
  );
}
