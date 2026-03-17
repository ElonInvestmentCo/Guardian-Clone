import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";

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

  // Close mobile menu on route change
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
          scrolled ? "bg-background/80 backdrop-blur-lg border-b border-white/5 py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-8 h-8 text-primary group-hover:text-blue-400 transition-colors" />
            <span className="font-display font-bold text-xl tracking-tight text-white">
              GUARDIAN<span className="text-primary">TRADING</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => console.log("Login clicked")}
                className="text-sm font-medium text-white hover:text-primary transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => console.log("Open Account clicked")}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Open Account
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2 focus:outline-none"
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
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 pb-6 px-6 flex flex-col justify-between md:hidden"
          >
            <div className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-3xl font-display font-bold text-white hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4 mt-12 mb-8">
              <button 
                onClick={() => console.log("Open Account clicked")}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl text-lg shadow-lg shadow-primary/25 active:scale-95 transition-transform"
              >
                Open Account
              </button>
              <button 
                onClick={() => console.log("Learn More clicked")}
                className="w-full py-4 bg-transparent border-2 border-primary/50 text-white font-bold rounded-xl text-lg hover:bg-primary/10 active:scale-95 transition-all"
              >
                Learn More
              </button>
              <button 
                onClick={() => console.log("Login clicked")}
                className="w-full py-4 text-muted-foreground font-medium rounded-xl text-lg hover:text-white transition-colors"
              >
                Client Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
