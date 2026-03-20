import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import guardianLogo from "@assets/image_1773968210300.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Services", href: "/#services" },
    { name: "Platforms", href: "/platforms" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Insights", href: "/#insights" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#151515] border-b border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-[56px]">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              className="h-11 w-auto object-contain"
              style={{ filter: "brightness(1.15) contrast(1.1)" }}
              data-testid="img-logo"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[13px] text-[#aaa] hover:text-white transition-colors"
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Right Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] text-white hover:text-primary transition-colors px-2"
              data-testid="link-login"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="text-[13px] text-white border border-[#4a7fbd] hover:bg-[#4a7fbd]/20 transition-colors px-4 py-1.5"
              data-testid="link-client-portal"
            >
              Client Portal BETA
            </Link>
            <Link
              href="/signup"
              className="text-[13px] text-white bg-[#4a7fbd] hover:bg-[#3d6fad] transition-colors px-4 py-1.5"
              data-testid="link-create-account"
            >
              Create Account
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2"
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-[#151515] pt-14 flex flex-col lg:hidden">
          <div className="flex flex-col px-6 py-6 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white text-lg py-3 border-b border-white/5"
                data-testid={`link-mobile-${link.name.toLowerCase()}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="px-6 mt-4 flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3 border border-[#4a7fbd] text-white text-center text-sm font-medium"
              data-testid="link-mobile-client-portal"
            >
              Client Portal BETA
            </Link>
            <Link
              href="/signup"
              className="w-full py-3 bg-[#4a7fbd] text-white text-center text-sm font-medium"
              data-testid="link-mobile-create-account"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
