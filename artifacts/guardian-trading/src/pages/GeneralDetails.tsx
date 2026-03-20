import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Phone, ChevronDown } from "lucide-react";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";
import { useAuth } from "@/context/AuthContext";

const REGISTRATION_TYPES = ["Individual Account", "Limited Liability Company"];
const PRODUCTS = ["Stocks", "Stocks And Options"];
const HOW_HEARD = [
  "Google", "Facebook", "Linkedin", "Twitter", "Benzinga",
  "EliteTrader", "Instagram", "YouTube", "Word of Mouth", "Other",
];

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Please Select",
  id,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" id={id} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-[#4a7fbd]"
        style={{ borderBottomColor: open ? "#4a7fbd" : undefined }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 bg-white border border-gray-300 border-t-0 shadow-md">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GeneralDetails() {
  const [registrationType, setRegistrationType] = useState("");
  const [product, setProduct] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [errors, setErrors] = useState<{
    registrationType?: string;
    product?: string;
    howHeard?: string;
  }>({});
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Services", href: "/#services" },
    { name: "Platforms", href: "/platforms" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Insights", href: "/#insights" },
    { name: "Contact Us", href: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!registrationType) newErrors.registrationType = "Please select a registration type";
    if (!product) newErrors.product = "Please select a product";
    if (!howHeard) newErrors.howHeard = "Please select an option";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    navigate("/personal-details");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      {/* ── Top phone bar ── */}
      <div
        className="flex items-center justify-end px-6 py-1.5"
        style={{ background: "#5baad4" }}
      >
        <a
          href="tel:8449631512"
          className="flex items-center gap-1.5 text-white text-[13px] font-semibold"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/>
          </svg>
          844-963-1512
        </a>
      </div>

      {/* ── Navbar ── */}
      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-6 h-[54px]">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              className="object-contain"
              style={{ height: "38px", width: "auto" }}
            />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="border border-[#4a7fbd] text-white text-sm px-4 py-1.5 hover:bg-[#4a7fbd]/20 transition-colors"
              data-testid="button-logout"
            >
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-1"
              data-testid="button-mobile-menu"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="bg-[#151515] border-t border-white/5 px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-0.5 text-white text-[13px] font-medium hover:text-[#5baad4] transition-colors"
                style={{ letterSpacing: "0.02em" }}
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

          {/* Logout */}
          <button
            className="text-white text-[13px] font-medium px-5 py-1.5 border transition-colors hover:bg-white/10"
            style={{ borderColor: "#5baad4", borderRadius: "3px" }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 px-4 py-5">
        <div className="max-w-sm mx-auto">
          <div className="bg-white border border-gray-200 shadow-sm overflow-visible">
            {/* Blue top stripe */}
            <div className="h-1 bg-[#4a7fbd] w-full" />

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleNext} noValidate>

              {/* Three dropdowns in a row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Registration Type */}
                <div>
                  <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                    Registration Type <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <CustomSelect
                    value={registrationType}
                    onChange={(v) => {
                      setRegistrationType(v);
                      if (errors.registrationType)
                        setErrors((p) => ({ ...p, registrationType: undefined }));
                    }}
                    options={REGISTRATION_TYPES}
                    placeholder="Please Select"
                    id="registration-type"
                  />
                  {errors.registrationType && (
                    <p className="mt-1 text-xs text-red-500">{errors.registrationType}</p>
                  )}
                </div>

                {/* Product */}
                <div>
                  <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                    Product you want to trade <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={product}
                      onChange={(e) => {
                        setProduct(e.target.value);
                        if (errors.product) setErrors((p) => ({ ...p, product: undefined }));
                      }}
                      className="w-full appearance-none text-[13px] focus:outline-none"
                      style={{
                        background: "#e8edf2",
                        border: "1px solid #ccd3da",
                        borderRadius: "3px",
                        padding: "9px 32px 9px 10px",
                        color: product ? "#333" : "#888",
                      }}
                    >
                      <option value="" disabled>Please Select</option>
                      {PRODUCTS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                  {errors.product && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.product}</p>
                  )}
                </div>

                {/* How did you hear */}
                <div>
                  <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                    How did you hear about us? <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={howHeard}
                      onChange={(e) => {
                        setHowHeard(e.target.value);
                        if (errors.howHeard) setErrors((p) => ({ ...p, howHeard: undefined }));
                      }}
                      className="w-full appearance-none text-[13px] focus:outline-none"
                      style={{
                        background: "#e8edf2",
                        border: "1px solid #ccd3da",
                        borderRadius: "3px",
                        padding: "9px 32px 9px 10px",
                        color: howHeard ? "#333" : "#888",
                      }}
                    >
                      <option value="" disabled>Please Select</option>
                      {HOW_HEARD.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                  {errors.howHeard && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.howHeard}</p>
                  )}
                </div>
              </div>

              {/* Next button */}
              <button
                type="submit"
                className="text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "#3a7bd5",
                  borderRadius: "3px",
                  padding: "9px 28px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* ── Dark Footer ── */}
      <footer style={{ background: "#111" }}>
        {/* Top section */}
        <div className="px-10 pt-12 pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-10">

            {/* Logo */}
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/">
                <img
                  src={guardianReversedLogo}
                  alt="Guardian Trading"
                  style={{ height: "36px", width: "auto", objectFit: "contain" }}
                />
              </Link>
            </div>

            {/* Columns */}
            <div className="flex flex-1 flex-wrap gap-12">

              {/* Company */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>
                  Company
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {["About", "Services", "Platforms", "Pricing", "Insights"].map((item) => (
                    <li key={item}>
                      <Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>
                  Legal
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {["Disclosures", "Privacy Policy"].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>
                  Contact
                </h4>
                <div className="flex flex-col gap-2.5">
                  <a href="tel:8886020092" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>
                    888-602-0092
                  </a>
                  <a href="mailto:info@guardiantrading.com" className="text-[13px] hover:text-white transition-colors" style={{ color: "#bbb" }}>
                    info@guardiantrading.com
                  </a>
                  <p className="text-[13px]" style={{ color: "#bbb" }}>
                    1301 Route 36 Suite 109 Hazlet, NJ 07730
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom legal section */}
        <div className="px-10 py-8 text-center">
          <p className="text-[13px] mb-1" style={{ color: "#aaa" }}>
            Guardian Trading – A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.
          </p>
          <p className="text-[13px] mb-6" style={{ color: "#aaa" }}>
            All securities and transactions are handled through Velocity.
          </p>

          <p className="text-[11px] uppercase leading-relaxed mb-5" style={{ color: "#666", maxWidth: "900px", margin: "0 auto 20px" }}>
            @2023 VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF{" "}
            <a href="https://www.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA</a>{" "}
            AND{" "}
            <a href="https://www.sipc.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>SIPC</a>.
            {" "}MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON{" "}
            <a href="https://brokercheck.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA'S BROKER CHECK</a>.
          </p>

          <p className="text-[11px] uppercase leading-relaxed" style={{ color: "#666", maxWidth: "900px", margin: "0 auto" }}>
            OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE{" "}
            <a href="#" style={{ color: "#5baad4" }}>CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>,
            {" "}ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT{" "}
            <a href="mailto:info@guardiantrading.com" style={{ color: "#5baad4" }}>INFO@GUARDIANTRADING.COM</a>
            {" "}TO RECEIVE A COPY OF THE ODD.
          </p>
        </div>
      </footer>
    </div>
  );
}
