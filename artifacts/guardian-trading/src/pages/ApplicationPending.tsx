import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { checkApplicationStatus } from "@/lib/saveStep";
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

const STEP_PATHS = [
  "/general-details", "/personal-details", "/professional-details",
  "/id-information", "/income-details", "/risk-tolerance",
  "/financial-situation", "/investment-experience", "/id-proof-upload",
  "/funding-details", "/disclosures", "/signatures",
];

type AppStatus = "pending" | "verified" | "approved" | "rejected" | "resubmit" | "checking";

export default function ApplicationPending() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<AppStatus>("pending");
  const [checking, setChecking] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [resubmitFields, setResubmitFields] = useState<string[]>([]);
  const [resubmitNote, setResubmitNote] = useState<string | null>(null);

  const pollStatus = useCallback(async () => {
    const result = await checkApplicationStatus();
    const s = result.status as AppStatus;

    if (s === "rejected") {
      setRejectionReason(result.rejectionReason ?? null);
    }
    if (s === "resubmit") {
      setResubmitFields(result.resubmitFields ?? []);
      setResubmitNote(result.resubmitNote ?? null);
    }

    if (s === "approved") {
      setStatus("approved");
      setTimeout(() => navigate("/dashboard"), 1500);
      return true;
    }

    if (s === "verified" || s === "rejected" || s === "resubmit" || s === "pending") {
      setStatus(s);
    } else {
      setStatus("pending");
    }
    return false;
  }, [navigate]);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 8000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  const handleCheckStatus = async () => {
    setChecking(true);
    await pollStatus();
    setChecking(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("signupEmail");
    navigate("/login");
  };

  const handleResubmit = () => {
    navigate(STEP_PATHS[0]!);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#f4f4f4" }}>
      <div className="flex items-center justify-end px-4 sm:px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/></svg>
          844-963-1512
        </a>
      </div>

      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-[54px]">
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "34px", width: "auto" }} /></Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4]" style={{ fontSize: "13px", fontWeight: 500 }}>
                {link.name}
                {link.hasDropdown && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="text-white font-medium px-4 sm:px-5 py-1.5 border hover:bg-white/10"
            style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="bg-white" style={{ borderBottom: "1px solid #dde3e9" }}>
        <div className="overflow-x-auto">
          <div className="flex items-start px-3 sm:px-6 py-4 sm:py-5" style={{ minWidth: "600px" }}>
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center w-full">
                  <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : "#3a7bd5" }} />
                  <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{ width: "26px", height: "26px", fontSize: "11px", background: "#3a7bd5", color: "white" }}>
                    {step.n}
                  </div>
                  <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : "#3a7bd5" }} />
                </div>
                <p className="text-center mt-1 leading-tight whitespace-pre-line hidden sm:block"
                  style={{ fontSize: "8px", color: "#3a7bd5", fontWeight: 700, maxWidth: "60px" }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-6">
        <div className="bg-white max-w-2xl mx-auto" style={{ borderRadius: "3px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>
          <div className="px-5 sm:px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <p style={{ fontSize: "15px", color: "#3a7bd5", fontWeight: 600 }}>Application Status</p>
          </div>

          <div className="px-5 sm:px-8 py-8 sm:py-12 flex flex-col items-center" style={{ minHeight: "260px" }}>
            {status === "approved" && (
              <>
                <span className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded-full font-bold text-white" style={{ background: "#28a745", fontSize: "14px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Account Approved
                </span>
                <h2 className="font-semibold mb-2 text-center" style={{ fontSize: "17px", color: "#333" }}>Your account has been approved!</h2>
                <p className="text-center" style={{ fontSize: "13px", color: "#777" }}>Redirecting to your dashboard...</p>
              </>
            )}

            {status === "verified" && (
              <>
                <span className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded font-bold text-white" style={{ background: "#3a7bd5", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Under Review
                </span>
                <h2 className="font-semibold mb-2 text-center" style={{ fontSize: "17px", color: "#333" }}>Your Application is Under Review</h2>
                <p className="mb-8 text-center" style={{ fontSize: "13px", color: "#777", maxWidth: "440px" }}>
                  Our compliance team is currently reviewing your application. You will receive an email notification once a decision has been made.
                </p>
                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, color: "white", background: "#3a7bd5", border: "none", borderRadius: "4px", cursor: checking ? "not-allowed" : "pointer", opacity: checking ? 0.7 : 1 }}
                >
                  {checking ? "Checking..." : "Refresh Status"}
                </button>
              </>
            )}

            {status === "rejected" && (
              <>
                <span className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded font-bold text-white" style={{ background: "#dc3545", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Application Rejected
                </span>
                <h2 className="font-semibold mb-3 text-center" style={{ fontSize: "17px", color: "#333" }}>Your application was not approved</h2>
                {rejectionReason && (
                  <div className="mb-5 w-full max-w-md px-4 py-3 rounded" style={{ background: "#fff5f5", border: "1px solid #f5c6cb" }}>
                    <p style={{ fontSize: "12px", color: "#856404", fontWeight: 600, marginBottom: "4px" }}>Reason:</p>
                    <p style={{ fontSize: "13px", color: "#721c24" }}>{rejectionReason}</p>
                  </div>
                )}
                <p className="mb-6 text-center" style={{ fontSize: "13px", color: "#777", maxWidth: "440px" }}>
                  If you believe this was in error, please contact our support team or resubmit your application with corrected information.
                </p>
                <button
                  onClick={handleResubmit}
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, color: "white", background: "#3a7bd5", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Fix & Resubmit Application
                </button>
              </>
            )}

            {status === "resubmit" && (
              <>
                <span className="inline-flex items-center gap-2 mb-5 px-5 py-2 rounded font-bold text-white" style={{ background: "#e67e22", fontSize: "13px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Action Required
                </span>
                <h2 className="font-semibold mb-3 text-center" style={{ fontSize: "17px", color: "#333" }}>Additional Information Needed</h2>
                {resubmitNote && (
                  <div className="mb-4 w-full max-w-md px-4 py-3 rounded" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
                    <p style={{ fontSize: "13px", color: "#6d4c00" }}>{resubmitNote}</p>
                  </div>
                )}
                {resubmitFields.length > 0 && (
                  <div className="mb-5 w-full max-w-md px-4 py-3 rounded" style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}>
                    <p style={{ fontSize: "12px", color: "#495057", fontWeight: 600, marginBottom: "6px" }}>Fields requiring attention:</p>
                    <ul className="list-disc pl-5">
                      {resubmitFields.map((f) => (
                        <li key={f} style={{ fontSize: "13px", color: "#495057" }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mb-6 text-center" style={{ fontSize: "13px", color: "#777", maxWidth: "440px" }}>
                  Please review and update the information above, then resubmit your application for review.
                </p>
                <button
                  onClick={handleResubmit}
                  style={{ padding: "10px 28px", fontSize: "13px", fontWeight: 700, color: "white", background: "#e67e22", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  Continue Application
                </button>
              </>
            )}

            {(status === "pending" || status === "checking") && (
              <>
                <span className="inline-block mb-5 px-4 py-1.5 rounded font-bold text-white" style={{ background: "#f59e0b", fontSize: "13px" }}>
                  Pending Review
                </span>
                <h2 className="font-semibold mb-2 text-center" style={{ fontSize: "17px", color: "#333" }}>
                  Your Application has been Successfully Submitted
                </h2>
                <p className="mb-8 text-center" style={{ fontSize: "13px", color: "#777", maxWidth: "440px" }}>
                  Our team is reviewing your application. You will receive an email notification once your account is approved. This typically takes 1–2 business days.
                </p>

                <button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="flex items-center gap-2"
                  style={{
                    padding: "10px 28px",
                    fontSize: "13px",
                    border: "1.5px solid #3a7bd5",
                    borderRadius: "4px",
                    background: "white",
                    color: "#3a7bd5",
                    cursor: checking ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: checking ? 0.7 : 1,
                  }}
                >
                  {checking && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a7bd5" strokeWidth="2" className="animate-spin">
                      <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                  )}
                  {checking ? "Checking..." : "Check Verification Status"}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <footer style={{ background: "#111" }}>
        <div className="px-5 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-8 sm:gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/"><img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto" }} /></Link>
            </div>
            <div className="flex flex-1 flex-wrap gap-8 sm:gap-12">
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
                  <a href="mailto:info@guardiiantrading.com" className="text-[13px] hover:text-white" style={{ color: "#bbb" }}>info@guardiiantrading.com</a>
                  <p className="text-[13px]" style={{ color: "#bbb" }}>1301 Route 36 Suite 109 Hazlet, NJ 07730</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 sm:px-10 py-6 sm:py-8 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
          <p className="text-[13px] mb-1" style={{ color: "#aaa" }}>Guardian Trading – A Division of Velocity Clearing, LLC ("Velocity"). Member FINRA/ SIPC.</p>
          <p className="text-[13px] mb-4" style={{ color: "#aaa" }}>All securities and transactions are handled through Velocity.</p>
        </div>
      </footer>
    </div>
  );
}
