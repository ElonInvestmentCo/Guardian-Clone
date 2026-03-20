import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { verifyAccount, checkApplicationStatus } from "@/lib/saveStep";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";
import guardianReversedLogo from "@assets/img-guardian-reversed-291x63-1_1773948931249.png";

const STEPS = [
  { n: 1,  label: "PERSONAL\nDETAILS" },
  { n: 2,  label: "PROFESSIONAL\nDETAILS" },
  { n: 3,  label: "ID\nINFORMATION" },
  { n: 4,  label: "INCOME\nDETAILS" },
  { n: 5,  label: "RISK\nTOLERANCE" },
  { n: 6,  label: "FINANCIAL\nSITUATION" },
  { n: 7,  label: "INVESTMENT\nEXPERIENCE" },
  { n: 8,  label: "IDENTIFICATION\nPROOF UPLOAD" },
  { n: 9,  label: "FUNDING\nDETAILS" },
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

export default function ApplicationPending() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"pending" | "verified" | "checking">("pending");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for status every 15 seconds
  useEffect(() => {
    const poll = async () => {
      const result = await checkApplicationStatus();
      if (result.status === "verified") {
        setStatus("verified");
        setTimeout(() => navigate("/account-verified"), 1200);
      }
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleCheckStatus = async () => {
    setStatus("checking");
    const result = await checkApplicationStatus();
    if (result.status === "verified") {
      setStatus("verified");
      setTimeout(() => navigate("/account-verified"), 1200);
    } else {
      setStatus("pending");
    }
  };

  const handleSimulateApproval = async () => {
    setVerifying(true);
    setError(null);
    const result = await verifyAccount();
    if (result.success) {
      setStatus("verified");
      setTimeout(() => navigate("/account-verified"), 1200);
    } else {
      setError(result.error ?? "Verification failed");
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      {/* Top bar */}
      <div className="flex items-center justify-end px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/></svg>
          844-963-1512
        </a>
      </div>

      {/* Navbar */}
      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-6 h-[54px]">
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "38px", width: "auto" }} /></Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4]" style={{ fontSize: "13px", fontWeight: 500 }}>
                {link.name}
                {link.hasDropdown && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
              </Link>
            ))}
          </div>
          <button className="text-white font-medium px-5 py-1.5 border hover:bg-white/10" style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}>Logout</button>
        </div>
      </nav>

      {/* Step bar — all completed */}
      <div className="bg-white px-6 py-5" style={{ borderBottom: "1px solid #dde3e9" }}>
        <div className="flex items-start justify-between">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex flex-col items-center" style={{ flex: 1 }}>
              <div className="flex items-center w-full">
                <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : "#3a7bd5" }} />
                <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                  style={{ width: "28px", height: "28px", fontSize: "12px", background: "#3a7bd5", color: "white", border: "2px solid #3a7bd5" }}>
                  {step.n}
                </div>
                <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : "#3a7bd5" }} />
              </div>
              <p className="text-center mt-1.5 leading-tight whitespace-pre-line" style={{ fontSize: "9px", color: "#3a7bd5", fontWeight: 700, maxWidth: "70px" }}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>
          <div className="px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <p style={{ fontSize: "15px", color: "#3a7bd5", fontWeight: 600 }}>Application</p>
          </div>

          <div className="py-12 flex flex-col items-center" style={{ minHeight: "280px" }}>
            {status === "verified" ? (
              <>
                <span className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full font-bold text-white" style={{ background: "#28a745", fontSize: "15px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Verified
                </span>
                <h2 className="font-semibold mb-2" style={{ fontSize: "17px", color: "#333" }}>Your account has been successfully verified!</h2>
                <p style={{ fontSize: "13px", color: "#777" }}>Redirecting to your dashboard…</p>
              </>
            ) : (
              <>
                <span className="inline-block mb-5 px-4 py-1.5 rounded font-bold text-white" style={{ background: "#f59e0b", fontSize: "13px" }}>
                  Pending Review
                </span>
                <h2 className="font-semibold mb-2" style={{ fontSize: "17px", color: "#333" }}>
                  Your Application has been Successfully Submitted.
                </h2>
                <p className="mb-8 text-center" style={{ fontSize: "13px", color: "#777", maxWidth: "440px" }}>
                  Our team is reviewing your application. You will receive an email notification once your account is approved. This typically takes 1–2 business days.
                </p>

                {error && (
                  <p className="mb-4 px-4 py-2 rounded" style={{ fontSize: "12px", color: "#dc3545", background: "#fff5f5", border: "1px solid #fcc" }}>
                    {error}
                  </p>
                )}

                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleCheckStatus}
                    disabled={status === "checking"}
                    style={{ padding: "8px 24px", fontSize: "13px", border: "1.5px solid #3a7bd5", borderRadius: "3px", background: "white", color: "#3a7bd5", cursor: "pointer", fontWeight: 600 }}
                  >
                    {status === "checking" ? "Checking…" : "Check Verification Status"}
                  </button>

                  {/* Demo approval button */}
                  <button
                    onClick={handleSimulateApproval}
                    disabled={verifying}
                    style={{ padding: "8px 24px", fontSize: "12px", border: "1px dashed #aaa", borderRadius: "3px", background: "#f9fafb", color: "#666", cursor: verifying ? "not-allowed" : "pointer" }}
                  >
                    {verifying ? "Processing…" : "Simulate Admin Approval (Demo)"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#111" }}>
        <div className="px-10 pt-12 pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/"><img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto" }} /></Link>
            </div>
            <div className="flex flex-1 flex-wrap gap-12">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Company</h4>
                <ul className="flex flex-col gap-2.5">{["About","Services","Platforms","Pricing","Insights"].map((item) => (<li key={item}><Link href={`/${item.toLowerCase()}`} className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>{item}</Link></li>))}</ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Legal</h4>
                <ul className="flex flex-col gap-2.5">{["Disclosures","Privacy Policy"].map((item) => (<li key={item}><a href="#" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>{item}</a></li>))}</ul>
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#aaa" }}>Contact</h4>
                <div className="flex flex-col gap-2.5">
                  <a href="tel:8886020092" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>888-602-0092</a>
                  <a href="mailto:info@guardiantrading.com" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>info@guardiantrading.com</a>
                  <p className="text-[13px]" style={{ color: "#bbb" }}>1301 Route 36 Suite 109 Hazlet, NJ 07730</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-10 py-8 text-center">
          <p className="text-[13px] mb-1" style={{ color: "#aaa" }}>Guardian Trading – A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.</p>
          <p className="text-[13px] mb-4" style={{ color: "#aaa" }}>All securities and transactions are handled through Velocity.</p>
        </div>
      </footer>
    </div>
  );
}
