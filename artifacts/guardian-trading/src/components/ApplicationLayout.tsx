import { useState } from "react";
import { Link } from "wouter";
import { Menu, Phone } from "lucide-react";
const LOGO_URL = "https://assets.guardiiantrading.com/logo.svg";

const NAV_LINKS = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/#services" },
  { name: "Platforms", href: "/platforms" },
  { name: "Pricing", href: "/#pricing" },
  { name: "Insights", href: "/#insights" },
  { name: "Contact Us", href: "/contact" },
];

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="px-4 flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center">
            <img src={LOGO_URL} alt="Guardian Trading Logo" className="h-[56px] w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <button className="border border-[#4a7fbd] text-white text-sm px-4 py-1.5 hover:bg-[#4a7fbd]/20 transition-colors">
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-1"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="bg-[#151515] border-t border-white/5 px-4 pb-4">
            {NAV_LINKS.map((link) => (
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

      {/* Page content */}
      <main className="flex-1 px-4 py-5">
        <div className="max-w-sm mx-auto">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-[#4a7fbd] w-full" />
            <div className="px-5 py-5">{children}</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] pt-10 pb-6 mt-8">
        <div className="px-5 max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <img src={LOGO_URL} alt="Guardian Trading Logo" className="h-[56px] w-auto object-contain" />
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Company</h4>
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
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Legal</h4>
              <ul className="flex flex-col gap-2">
                {["Disclosures", "Privacy Policy"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 text-sm hover:text-white">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mb-8">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Contact</h4>
            <div className="flex flex-col gap-1.5">
              <a href="tel:8886020092" className="text-gray-400 text-sm hover:text-white">888-602-0092</a>
              <a href="mailto:info@guardiiantrading.com" className="text-gray-400 text-sm hover:text-white">
                info@guardiiantrading.com
              </a>
              <p className="text-gray-400 text-sm">1301 Route 36 Suite 109 Hazlet, NJ 07730</p>
            </div>
          </div>
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

export function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="block text-xs text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm text-gray-700 bg-transparent focus:outline-none focus:border-[#4a7fbd] placeholder-gray-400"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Please Select",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-0 py-2 border-0 border-b border-gray-300 text-sm bg-transparent focus:outline-none focus:border-[#4a7fbd] text-gray-700"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export function NavButtons({
  onPrev,
  onNext,
  showPrev = false,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
}) {
  return (
    <div className={`flex mt-5 ${showPrev ? "gap-3" : ""}`}>
      {showPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="w-28 py-2.5 border border-gray-300 text-gray-600 font-semibold text-sm rounded hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
      )}
      <button
        type="submit"
        className="w-36 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold text-sm rounded transition-colors"
      >
        Next
      </button>
    </div>
  );
}
