import { useState } from "react";
import { Link, useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

const REGISTRATION_TYPES = ["Individual Account", "Limited Liability Company"];
const PRODUCTS = ["Stocks", "Stocks And Options"];
const HOW_HEARD = [
  "Google", "Facebook", "Linkedin", "Twitter", "Benzinga",
  "EliteTrader", "Instagram", "YouTube", "Word of Mouth", "Other",
];

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

export default function GeneralDetails() {
  const [registrationType, setRegistrationType] = useState("");
  const [product, setProduct] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [errors, setErrors] = useState<{
    registrationType?: string;
    product?: string;
    howHeard?: string;
  }>({});
  const [, navigate] = useLocation();

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

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
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

      {/* ── Main content ── */}
      <main className="flex-1 px-6 py-6">
        <div
          className="bg-white"
          style={{
            borderRadius: "2px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
            border: "1px solid #dde3e9",
            borderLeft: "4px solid #3a7bd5",
          }}
        >
          {/* Card header */}
          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1
              className="font-semibold"
              style={{ color: "#3a7bd5", fontSize: "20px" }}
            >
              General Details
            </h1>
          </div>

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
                  <div className="relative">
                    <select
                      value={registrationType}
                      onChange={(e) => {
                        setRegistrationType(e.target.value);
                        if (errors.registrationType)
                          setErrors((p) => ({ ...p, registrationType: undefined }));
                      }}
                      className="w-full appearance-none text-[13px] focus:outline-none"
                      style={{
                        background: "#e8edf2",
                        border: "1px solid #ccd3da",
                        borderRadius: "3px",
                        padding: "9px 32px 9px 10px",
                        color: registrationType ? "#333" : "#888",
                      }}
                    >
                      <option value="" disabled>Please Select</option>
                      {REGISTRATION_TYPES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                  {errors.registrationType && (
                    <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.registrationType}</p>
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
    </div>
  );
}
