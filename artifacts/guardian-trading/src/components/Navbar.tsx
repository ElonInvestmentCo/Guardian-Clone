import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "About",      href: "/about" },
    { name: "Services",   href: "/#services" },
    { name: "Platforms",  href: "/platforms" },
    { name: "Pricing",    href: "/#pricing" },
    { name: "Insights",   href: "/#insights" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      {/* ── Desktop / Tablet Navbar ─────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50"
        style={{
          background: "#000000",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          height: "85px",
        }}
      >
        <div
          className="w-full h-full flex items-center justify-between"
          style={{ padding: "0 32px" }}
        >
          {/* ── Logo ─────────────────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              style={{ height: "56px", width: "auto", objectFit: "contain" }}
              data-testid="img-logo"
            />
          </Link>

          {/* ── Desktop Nav Links ─────────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center" style={{ gap: "36px" }}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors"
                style={{
                  fontSize: "15.5px",
                  fontWeight: 600,
                  color: "#c8d4e0",
                  letterSpacing: "0.01em",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#c8d4e0"; }}
                data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ── Desktop Right Buttons ─────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center" style={{ gap: "12px" }}>
            {/* Login */}
            <Link
              href="/login"
              style={{
                fontSize: "15px", fontWeight: 600,
                color: "#ffffff",
                textDecoration: "none",
                padding: "0 8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#76d0f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
              data-testid="link-login"
            >
              Login
            </Link>

            {/* Client Portal BETA */}
            <Link
              href="/login"
              style={{
                fontSize: "15px", fontWeight: 600,
                color: "#ffffff",
                border: "1.5px solid #3a6fa8",
                borderRadius: "4px",
                padding: "9px 20px",
                textDecoration: "none",
                transition: "background 0.2s, border-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(74,127,189,0.18)";
                el.style.borderColor = "#5a90c8";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "transparent";
                el.style.borderColor = "#3a6fa8";
              }}
              data-testid="link-client-portal"
            >
              Client Portal BETA
            </Link>

            {/* Create Account */}
            <Link
              href="/signup"
              style={{
                fontSize: "15px", fontWeight: 700,
                color: "#ffffff",
                background: "#2a6abf",
                borderRadius: "4px",
                padding: "9px 22px",
                textDecoration: "none",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1e5aaa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#2a6abf"; }}
              data-testid="link-create-account"
            >
              Create Account
            </Link>
          </div>

          {/* ── Mobile Toggle ────────────────────────────────────────────────── */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2"
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ──────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col lg:hidden"
          style={{ background: "#000000", paddingTop: "85px" }}
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
