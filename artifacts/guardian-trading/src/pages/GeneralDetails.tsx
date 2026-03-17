import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Phone, ChevronDown } from "lucide-react";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

const REGISTRATION_TYPES = ["Individual Account", "Limited Liability Company"];
const PRODUCTS = ["Stocks", "Stocks And Options"];
const HOW_HEARD = [
  "Google",
  "Facebook",
  "Linkedin",
  "Twitter",
  "Benzinga",
  "EliteTrader",
  "Instagram",
  "YouTube",
  "Word of Mouth",
  "Other",
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

  return (
    <div className="relative" id={id}>
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
        <div className="absolute left-0 right-0 top-full z-20 bg-white border border-gray-300 border-t-0 shadow-md">
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
  const [registrationType, setRegistrationType] = useState("Individual Account");
  const [product, setProduct] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [errors, setErrors] = useState<{ product?: string; howHeard?: string }>({});
  const [, navigate] = useLocation();

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Services", href: "/#services" },
    { name: "Platforms", href: "/platforms" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Insights", href: "/#insights" },
    { name: "Contact Us", href: "/contact" },
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!product) newErrors.product = "Please select a product";
    if (!howHeard) newErrors.howHeard = "Please select an option";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a1a1a] py-1.5 px-4 flex items-center justify-end">
        <a
          href="tel:8449631512"
          className="flex items-center gap-1.5 text-white text-xs font-medium"
        >
          <Phone className="w-3 h-3" />
          844-963-1512
        </a>
      </div>

      {/* Navbar */}
      <nav className="bg-[#151515] border-b border-white/5">
        <div className="px-4 flex items-center justify-between h-[52px]">
          <Link href="/" className="flex items-center">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              className="h-8 w-auto object-contain"
              data-testid="img-logo"
            />
          </Link>

          <div className="flex items-center gap-3">
            <button
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
                className="block text-white text-sm py-2.5 border-b border-white/5"
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 px-4 py-5">
        <div className="max-w-sm mx-auto">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            {/* Blue top stripe */}
            <div className="h-1 bg-[#4a7fbd] w-full" />

            <div className="px-5 py-5">
              <h1 className="text-xl font-semibold text-[#4a7fbd] mb-5">General Details</h1>

              <form onSubmit={handleNext} noValidate>
                {/* Registration Type */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1.5">
                    Registration Type <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={registrationType}
                    onChange={setRegistrationType}
                    options={REGISTRATION_TYPES}
                    placeholder="Please Select"
                    id="registration-type"
                  />
                </div>

                {/* Product */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1.5">
                    Product you want to trade <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={product}
                    onChange={(v) => {
                      setProduct(v);
                      if (errors.product) setErrors((p) => ({ ...p, product: undefined }));
                    }}
                    options={PRODUCTS}
                    placeholder="Please Select"
                    id="product"
                  />
                  {errors.product && (
                    <p className="mt-1 text-xs text-red-500">{errors.product}</p>
                  )}
                </div>

                {/* How did you hear */}
                <div className="mb-6">
                  <label className="block text-xs text-gray-600 mb-1.5">
                    How did you hear about us? <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={howHeard}
                    onChange={(v) => {
                      setHowHeard(v);
                      if (errors.howHeard) setErrors((p) => ({ ...p, howHeard: undefined }));
                    }}
                    options={HOW_HEARD}
                    placeholder="Please Select"
                    id="how-heard"
                  />
                  {errors.howHeard && (
                    <p className="mt-1 text-xs text-red-500">{errors.howHeard}</p>
                  )}
                </div>

                {/* Next button */}
                <button
                  type="submit"
                  className="w-36 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold text-sm rounded transition-colors"
                  data-testid="button-next"
                >
                  Next
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] pt-10 pb-6 mt-8">
        <div className="px-5 max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              className="h-8 w-auto object-contain"
            />
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Company
              </h4>
              <ul className="flex flex-col gap-2">
                {["About", "Services", "Platforms", "Pricing", "Insights"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item.toLowerCase()}`} className="text-gray-400 text-sm hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Legal
              </h4>
              <ul className="flex flex-col gap-2">
                {["Disclosures", "Privacy Policy"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 text-sm hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Contact
            </h4>
            <div className="flex flex-col gap-1.5">
              <a href="tel:8886020092" className="text-gray-400 text-sm hover:text-white">
                888-602-0092
              </a>
              <a href="mailto:info@guardiantrading.com" className="text-gray-400 text-sm hover:text-white">
                info@guardiantrading.com
              </a>
              <p className="text-gray-400 text-sm">
                1301 Route 36 Suite 109 Hazlet, NJ 07730
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-5">
            <p className="text-gray-500 text-xs text-center">
              Guardian Trading ~ A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
