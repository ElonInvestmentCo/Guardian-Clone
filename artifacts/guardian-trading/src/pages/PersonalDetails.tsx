import { useState } from "react";
import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Other"];
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const STEPS = [
  { n: 1, label: "PERSONAL\nDETAILS" },
  { n: 2, label: "PROFESSIONAL\nDETAILS" },
  { n: 3, label: "ID\nINFORMATION" },
  { n: 4, label: "INCOME\nDETAILS" },
  { n: 5, label: "RISK\nTOLERANCE" },
  { n: 6, label: "FINANCIAL\nSITUATION" },
  { n: 7, label: "INVESTMENT\nEXPERIENCE" },
  { n: 8, label: "IDENTIFICATION\nPROOF UPLOAD" },
  { n: 9, label: "FUNDING\nDETAILS" },
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

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  appearance: "none" as const,
  paddingRight: "28px",
  cursor: "pointer",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children} {required && <span style={{ color: "#e53e3e" }}>*</span>}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder = "Please Select" }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle} className="focus:outline-none">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export default function PersonalDetails() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", aptSuite: "",
    country: "United States", city: "", state: "", zipCode: "",
    mailingDifferent: false, phoneNumber: "", numDependents: "",
    altPhoneNumber: "", maritalStatus: "Single", trustedContact: "",
  });
  const set = (key: keyof typeof form) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/professional-details");
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
            const active = step.n === 1;
            const done = step.n < 1;
            return (
              <div key={step.n} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="flex items-center w-full">
                  {/* Left connector */}
                  <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : done || active ? "#3a7bd5" : "#ccd3da" }} />
                  {/* Circle */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{
                      width: "28px", height: "28px", fontSize: "12px",
                      background: active ? "#3a7bd5" : done ? "#3a7bd5" : "white",
                      color: active || done ? "white" : "#aaa",
                      border: `2px solid ${active || done ? "#3a7bd5" : "#ccd3da"}`,
                    }}
                  >
                    {step.n}
                  </div>
                  {/* Right connector */}
                  <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : done ? "#3a7bd5" : "#ccd3da" }} />
                </div>
                {/* Label */}
                <p
                  className="text-center mt-1.5 leading-tight whitespace-pre-line"
                  style={{ fontSize: "9px", color: active ? "#3a7bd5" : "#999", fontWeight: active ? 700 : 400, maxWidth: "70px" }}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{
          borderRadius: "2px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
          border: "1px solid #dde3e9",
          borderLeft: "4px solid #3a7bd5",
        }}>
          {/* Card header */}
          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1 className="font-semibold" style={{ color: "#3a7bd5", fontSize: "20px" }}>Personal Details</h1>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} noValidate>

              {/* Row 1: First Name | Last Name */}
              <div className="grid grid-cols-2 gap-5 mb-4">
                <div>
                  <FieldLabel required>First Name</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} />
                </div>
                <div>
                  <FieldLabel required>Last Name</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} />
                </div>
              </div>

              {/* Row 2: Address | Apt/Suite */}
              <div className="grid gap-5 mb-4" style={{ gridTemplateColumns: "3fr 1fr" }}>
                <div>
                  <FieldLabel required>Address</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.address} onChange={(e) => set("address")(e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Apt/Suite</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.aptSuite} onChange={(e) => set("aptSuite")(e.target.value)} />
                </div>
              </div>

              {/* Row 3: Country | City | State | Zip */}
              <div className="grid grid-cols-4 gap-5 mb-4">
                <div>
                  <FieldLabel required>Country</FieldLabel>
                  <SelectField value={form.country} onChange={set("country") as (v: string) => void} options={COUNTRIES} />
                </div>
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <SelectField value={form.city} onChange={set("city") as (v: string) => void} options={[]} placeholder="Please Select" />
                </div>
                <div>
                  <FieldLabel required>State/Province</FieldLabel>
                  <SelectField value={form.state} onChange={set("state") as (v: string) => void} options={US_STATES} placeholder="Please Select" />
                </div>
                <div>
                  <FieldLabel required>Zip Code</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.zipCode} onChange={(e) => set("zipCode")(e.target.value)} />
                </div>
              </div>

              {/* Mailing Address Checkbox */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  id="mailing-diff"
                  type="checkbox"
                  checked={form.mailingDifferent}
                  onChange={(e) => set("mailingDifferent")(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#3a7bd5" }}
                />
                <label htmlFor="mailing-diff" style={{ fontSize: "12px", color: "#555", cursor: "pointer" }}>
                  Mailing Address (If Different)
                </label>
              </div>

              {/* Row 4: Phone | Dependents */}
              <div className="grid grid-cols-2 gap-5 mb-1">
                <div>
                  <FieldLabel required>Phone Number</FieldLabel>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center flex-1 relative" style={{ ...fieldStyle, padding: 0, paddingLeft: "10px" }}>
                      <span style={{ fontSize: "13px", color: "#555", flexShrink: 0, paddingRight: "4px" }}>+1</span>
                      <input
                        type="tel"
                        placeholder="(___) ___-____"
                        value={form.phoneNumber}
                        onChange={(e) => set("phoneNumber")(e.target.value)}
                        className="flex-1 focus:outline-none bg-transparent"
                        style={{ fontSize: "13px", padding: "9px 8px 9px 0", border: "none" }}
                      />
                    </div>
                    <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: "20px", height: "20px", background: "#3a7bd5", fontSize: "11px", fontWeight: "bold" }}>i</div>
                  </div>
                </div>
                <div>
                  <FieldLabel required>Number Of Dependents</FieldLabel>
                  <input style={fieldStyle} className="focus:outline-none" value={form.numDependents} onChange={(e) => set("numDependents")(e.target.value)} />
                </div>
              </div>
              <p className="mb-4" style={{ fontSize: "11px", color: "#999" }}>
                Phone numbers are checked for validity in the country that you are applying
              </p>

              {/* Alternate Phone */}
              <div className="mb-1" style={{ maxWidth: "50%" }}>
                <FieldLabel>Alternate Phone Number</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1" style={{ ...fieldStyle, padding: 0, paddingLeft: "10px" }}>
                    <span style={{ fontSize: "13px", color: "#555", flexShrink: 0, paddingRight: "4px" }}>+1</span>
                    <input
                      type="tel"
                      placeholder="(___) ___-____"
                      value={form.altPhoneNumber}
                      onChange={(e) => set("altPhoneNumber")(e.target.value)}
                      className="flex-1 focus:outline-none bg-transparent"
                      style={{ fontSize: "13px", padding: "9px 8px 9px 0", border: "none" }}
                    />
                  </div>
                  <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: "20px", height: "20px", background: "#3a7bd5", fontSize: "11px", fontWeight: "bold" }}>i</div>
                </div>
              </div>
              <p className="mb-4" style={{ fontSize: "11px", color: "#999" }}>
                Phone numbers are checked for validity in the country that you are applying
              </p>

              {/* Marital Status */}
              <div className="mb-4">
                <FieldLabel required>Are You</FieldLabel>
                <div className="flex items-center gap-6">
                  {["Single", "Married", "Divorced", "Widowed"].map((status) => (
                    <label key={status} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="maritalStatus"
                        value={status}
                        checked={form.maritalStatus === status}
                        onChange={() => set("maritalStatus")(status)}
                        style={{ width: "14px", height: "14px", accentColor: "#3a7bd5" }}
                      />
                      <span style={{ fontSize: "13px", color: "#555" }}>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Trusted Contact */}
              <div className="mb-6">
                <FieldLabel required>Would you like to add a Trusted Contact Person</FieldLabel>
                <div className="flex items-center gap-6">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="trustedContact"
                        value={opt}
                        checked={form.trustedContact === opt}
                        onChange={() => set("trustedContact")(opt)}
                        style={{ width: "14px", height: "14px", accentColor: "#3a7bd5" }}
                      />
                      <span style={{ fontSize: "13px", color: "#555" }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Next button */}
              <button
                type="submit"
                className="text-white font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}
              >
                Next
              </button>
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
                  {["About", "Services", "Platforms", "Pricing", "Insights"].map((item) => (
                    <li key={item}><Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Legal</h4>
                <ul className="flex flex-col gap-2.5">
                  {["Disclosures", "Privacy Policy"].map((item) => (
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
