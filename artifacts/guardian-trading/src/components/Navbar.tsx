import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import clientPortalBtn from "@assets/Guardian_Trading_-_Google_Chrome_3_21_2026_7_06_36_PM_1774120107443.png";
import createAccountBtn from "@assets/Guardian_Trading_-_Google_Chrome_3_21_2026_7_06_36_PM_1774120031345.png";
import logoSrc from "@assets/guardian_logo_reversed.png";
import logoMobileSrc from "@assets/guardian_mobile_logo.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "About",      href: "/about" },
    { name: "Services",   href: "/services/trading-services" },
    { name: "Platforms",  href: "/platforms" },
    { name: "Pricing",    href: "/equities-options" },
    { name: "Insights",   href: "/blog" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  const headerBg = scrolled ? "#000000" : "#151515";

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50"
        style={{
          background: headerBg,
          transition: "background 0.35s ease",
        }}
      >
        <div
          className="w-full flex items-center justify-between"
          style={{ height: "78px", paddingLeft: "clamp(16px, 4vw, 56px)", paddingRight: "clamp(16px, 4vw, 44px)" }}
        >
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src={logoSrc}
              alt="Guardian Trading Logo"
              className="hidden sm:block h-[58px]"
              style={{ width: "auto", objectFit: "contain" }}
              data-testid="img-logo"
            />
            <img
              src={logoMobileSrc}
              alt="Guardian Trading Logo"
              className="block sm:hidden h-[50px]"
              style={{ width: "auto", objectFit: "contain" }}
              data-testid="img-logo-mobile"
            />
          </Link>

          <div className="hidden lg:flex items-center" style={{ gap: "26px" }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="gt-nav-link"
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center" style={{ gap: "12px" }}>
            <Link
              href="/login"
              className="gt-login-link"
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#3f88c4",
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                transition: "color 0.2s ease",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#5da0d6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#3f88c4"; }}
              data-testid="link-login"
            >
              Login
            </Link>

            <Link
              href="/login"
              style={{ display: "inline-block", lineHeight: 0, textDecoration: "none" }}
              data-testid="link-client-portal"
            >
              <img
                src={clientPortalBtn}
                alt="Client Portal BETA"
                style={{
                  height: "42px",
                  width: "auto",
                  display: "block",
                  imageRendering: "auto",
                  filter: "contrast(1.08) brightness(1.06)",
                  transition: "filter 0.2s, transform 0.15s",
                  borderRadius: "0",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLImageElement).style.filter = "contrast(1.15) brightness(1.18)";
                  (e.currentTarget as HTMLImageElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLImageElement).style.filter = "contrast(1.08) brightness(1.06)";
                  (e.currentTarget as HTMLImageElement).style.transform = "translateY(0)";
                }}
              />
            </Link>

            <Link
              href="/signup"
              style={{ display: "inline-block", lineHeight: 0, textDecoration: "none" }}
              data-testid="link-create-account"
            >
              <img
                src={createAccountBtn}
                alt="Create Account"
                style={{
                  height: "42px",
                  width: "auto",
                  display: "block",
                  imageRendering: "auto",
                  filter: "contrast(1.08) brightness(1.06)",
                  transition: "filter 0.2s, transform 0.15s",
                  borderRadius: "0",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLImageElement).style.filter = "contrast(1.15) brightness(1.18)";
                  (e.currentTarget as HTMLImageElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLImageElement).style.filter = "contrast(1.08) brightness(1.06)";
                  (e.currentTarget as HTMLImageElement).style.transform = "translateY(0)";
                }}
              />
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2"
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col lg:hidden"
          style={{ background: "#151515", paddingTop: "78px" }}
        >
          <div className="flex flex-col px-8 py-4 gap-0">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                style={{
                  color: "white", fontSize: "17px", fontWeight: 600,
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  textDecoration: "none",
                  display: "block",
                }}
                data-testid={`link-mobile-${link.name.toLowerCase()}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="px-8 mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              style={{
                display: "block", padding: "14px",
                background: "#3f88c4",
                color: "white", textAlign: "center",
                fontSize: "15px", fontWeight: 600,
                textDecoration: "none", borderRadius: "6px",
              }}
              data-testid="link-mobile-login"
            >
              Login
            </Link>
            <Link
              href="/login"
              style={{
                display: "block", padding: "14px",
                border: "1.5px solid #3a6fa8",
                color: "white", textAlign: "center",
                fontSize: "15px", fontWeight: 600,
                textDecoration: "none", borderRadius: "4px",
              }}
              data-testid="link-mobile-client-portal"
            >
              Client Portal BETA
            </Link>
            <Link
              href="/signup"
              style={{
                display: "block", padding: "14px",
                background: "#2a6abf",
                color: "white", textAlign: "center",
                fontSize: "15px", fontWeight: 700,
                textDecoration: "none", borderRadius: "4px",
              }}
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
