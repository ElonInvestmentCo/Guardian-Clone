import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "About", href: "/about" },
    { name: "Platforms", href: "/platforms" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-lg border-b border-white/5 py-3"
            : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src={guardianLogo}
              alt="Guardian Trading"
              className="h-10 w-auto object-contain brightness-110"
              data-testid="img-logo"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                  data-testid={`link-nav-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-white hover:text-primary transition-colors px-3 py-2"
                data-testid="link-login"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 border border-primary/60 text-white text-sm font-medium hover:bg-primary/10 transition-all"
                data-testid="link-client-portal"
              >
                Client Portal BETA
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25"
                data-testid="link-create-account"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 focus:outline-none"
            data-testid="button-mobile-menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl pt-24 pb-6 px-6 flex flex-col justify-between md:hidden"
          >
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-3xl font-bold text-white hover:text-primary transition-colors uppercase tracking-wide"
                  data-testid={`link-mobile-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4 mt-12 mb-8">
              <Link
                href="/signup"
                className="w-full py-4 bg-primary text-white font-bold text-lg text-center block shadow-lg shadow-primary/25 active:scale-95 transition-transform"
                data-testid="link-mobile-open-account"
              >
                Open Account
              </Link>
              <Link
                href="/login"
                className="w-full py-4 bg-transparent border-2 border-primary/50 text-white font-bold text-lg text-center block hover:bg-primary/10 active:scale-95 transition-all"
                data-testid="link-mobile-learn-more"
              >
                Learn More
              </Link>
              <Link
                href="/login"
                className="w-full py-4 text-muted-foreground font-medium text-lg text-center block hover:text-white transition-colors"
                data-testid="link-mobile-login"
              >
                Client Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
