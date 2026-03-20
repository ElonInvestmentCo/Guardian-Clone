import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
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
const CURRENT_STEP = 11;

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

const DISCLOSURE_DOCS = [
  "Account Terms & Conditions",
  "Day Trading Risk Disclosure",
  "Penny Stocks Disclosure",
  "Electronic Access & Trading Agreement",
  "Margin Disclosure Statement",
  "Stock Locate Agreement",
  "Margin Agreement",
  "Liquidation Notice",
];

export default function Signatures() {
  const [, navigate] = useLocation();

  // Disclosure consents
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(DISCLOSURE_DOCS.map((d) => [d, false]))
  );

  // Trading plan
  const [tradingPlan, setTradingPlan] = useState("");

  // Electronic delivery consent
  const [electronicDelivery, setElectronicDelivery] = useState(false);

  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");

  // Modals
  const [showElectronicModal, setShowElectronicModal] = useState(false);
  const [electronicAgreed, setElectronicAgreed] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [showSignatureModal]);

  const getXY = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) {
      const t = (e as React.TouchEvent).touches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    const m = e as React.MouseEvent;
    return { x: (m.clientX - rect.left) * sx, y: (m.clientY - rect.top) * sy };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getXY(e, canvas);
  };

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getXY(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { drawing.current = false; lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setShowSignatureModal(false);
  };

  const handleSignatureButtonClick = () => {
    setShowElectronicModal(true);
  };

  const handleElectronicContinue = () => {
    if (!electronicAgreed) return;
    setShowElectronicModal(false);
    setShowSignatureModal(true);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitModal(true);
  };

  const handleSubmitConfirm = async () => {
    await saveSignupStep("signatures", {
      consents,
      tradingPlan,
      electronicDelivery,
      signatureName,
      hasSigned: !!signatureDataUrl,
    });
    navigate("/application-submitted");
  };

  const sStyle: React.CSSProperties = { fontSize: "12px", color: "#555" };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>

      {/* Top bar */}
      <div className="flex items-center justify-end px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/>
          </svg>
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

      {/* Step bar */}
      <div className="bg-white px-6 py-5" style={{ borderBottom: "1px solid #dde3e9" }}>
        <div className="flex items-start justify-between">
          {STEPS.map((step, i) => {
            const active = step.n === CURRENT_STEP;
            const done   = step.n < CURRENT_STEP;
            return (
              <div key={step.n} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div className="flex items-center w-full">
                  <div className="flex-1 h-[2px]" style={{ background: i === 0 ? "transparent" : (done || active) ? "#3a7bd5" : "#ccd3da" }} />
                  <div className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{ width: "28px", height: "28px", fontSize: "12px",
                      background: (active || done) ? "#3a7bd5" : "white",
                      color: (active || done) ? "white" : "#aaa",
                      border: `2px solid ${(active || done) ? "#3a7bd5" : "#ccd3da"}` }}>
                    {step.n}
                  </div>
                  <div className="flex-1 h-[2px]" style={{ background: i === STEPS.length - 1 ? "transparent" : done ? "#3a7bd5" : "#ccd3da" }} />
                </div>
                <p className="text-center mt-1.5 leading-tight whitespace-pre-line"
                  style={{ fontSize: "9px", color: (active || done) ? "#3a7bd5" : "#999", fontWeight: (active || done) ? 700 : 400, maxWidth: "70px" }}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>
          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Disclosures &amp; Signatures</h1>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleNext} noValidate>

              {/* Instruction */}
              <p className="mb-5" style={{ fontSize: "12px", color: "#555" }}>
                Please select the disclosures below and the check the box noting you have read and understood these disclosures.
              </p>

              {/* Disclosures table */}
              <div className="mb-6" style={{ border: "1px solid #dde3e9", borderRadius: "2px" }}>
                {DISCLOSURE_DOCS.map((doc, i) => (
                  <div key={doc} className="flex items-center" style={{ padding: "9px 14px", borderBottom: i < DISCLOSURE_DOCS.length - 1 ? "1px solid #eef1f4" : "none" }}>
                    <span style={{ fontSize: "12px", color: "#444", flex: 1 }}>{doc} *</span>
                    <a href="#" style={{ fontSize: "12px", color: "#3a7bd5", textDecoration: "underline", marginRight: "24px" }}>View</a>
                    <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={consents[doc]}
                        onChange={(e) => setConsents((p) => ({ ...p, [doc]: e.target.checked }))}
                        style={{ accentColor: "#3a7bd5", width: "13px", height: "13px" }}
                      />
                      <span style={{ fontSize: "12px", color: "#555" }}>I provide my consent</span>
                    </label>
                  </div>
                ))}
              </div>

              {/* Das Trader Guardian Trading */}
              <div className="mb-4">
                <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Das Trader Guardian Trading</p>
                <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>
                  Level 2 Software costs plus up to $165 in Add On Feeds will be waived for accounts generating $599 or more in commissions per month
                </p>
                <label className="flex gap-2 cursor-pointer">
                  <input type="radio" name="tradingPlan" checked={tradingPlan === "das_190"} onChange={() => setTradingPlan("das_190")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}>
                    <strong>Das Level 2 ($190):</strong> Regional Market Depth, Top Level Bids and Offers with Quoted Size for Major Listed Exchanges, includes NMS Listed Level 1 data. Does not include Options or Pink Sheet level 1. Additional ECN Book Feeds, Pink Sheet (OTC) Level 2, and Options Level 2 are offered at additional cost.
                  </p>
                </label>
              </div>

              {/* Guardian Professional Trader */}
              <div className="mb-4">
                <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Guardian Professional Trader</p>
                <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>
                  For accounts Classified as Professional by either DasTrader or Sterling. Level 2 Software costs plus up to $150 in Add On Feeds will be waived for accounts generating $899 or more in commissions per month.
                </p>
                <label className="flex gap-2 cursor-pointer">
                  <input type="radio" name="tradingPlan" checked={tradingPlan === "das_200"} onChange={() => setTradingPlan("das_200")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}>
                    <strong>Das Level 2 ($200):</strong> Regional Market Depth, Top Level Bids and Offers with Quoted Size for Major Listed Exchanges, includes NMS Listed Level 1 data. Does not include Options or Pink Sheet level 1. Additional ECN Book Feeds, Pink Sheet (OTC) Level 2, and Options Level 2 are offered at additional cost.
                  </p>
                </label>
              </div>

              {/* Sterling Trader Guardian Trading */}
              <div className="mb-6">
                <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Sterling Trader Guardian Trading</p>
                <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>
                  Level 1 Software costs plus up to $375 will be waived for accounts generating $799 or more in commissions per month. Add On Data Waiver Not available.
                </p>
                <label className="flex gap-2 cursor-pointer">
                  <input type="radio" name="tradingPlan" checked={tradingPlan === "sterling_275"} onChange={() => setTradingPlan("sterling_275")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}>
                    <strong>Sterling Trader ($275):</strong> All in package of Sterling Trader Pro including Nasdaq Total View, NYSE/AMEX/ARCA, Nasdaq Level 1, Direct Edge A, Direct Edge X, Options and OTC data are additional cost.
                  </p>
                </label>
              </div>

              {/* Electronic delivery consent */}
              <div className="mb-5" style={{ borderTop: "1px solid #eef1f4", paddingTop: "16px" }}>
                <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "4px" }}>
                  Consent for mail delivery of statements and confirms otherwise they will be delivered electronically
                </p>
                <p className="mb-3" style={{ fontSize: "11.5px" }}>
                  <a href="#" style={{ color: "#3a7bd5", textDecoration: "underline" }}>
                    Additional charges will apply if you do NOT check the below box for electronic delivery of statements, confirmations and tax documents
                  </a>
                </p>
                <label className="flex gap-2 cursor-pointer">
                  <input type="checkbox" checked={electronicDelivery} onChange={(e) => setElectronicDelivery(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                  <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>
                    Please check this box if you wish only to receive communications electronically, including trade confirmations, prospectuses, account statements, proxy materials, tax-related documents, and marketing and sales documents. If you do not check this box, all such Communications will be delivered to you by standard mail.
                  </p>
                </label>
              </div>

              {/* Signature section */}
              <div className="mb-6" style={{ borderTop: "1px solid #eef1f4", paddingTop: "16px" }}>
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65", marginBottom: "16px" }}>
                  By signing below, I/We attest to the accuracy of the information provided on this form. I/We acknowledge that we have received, read and agree to the terms and conditions contained in the attached Account Agreement, including the arbitration clause. By executing this agreement, I/We agree to be bound by the terms and conditions contained here in.
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <p style={{ fontSize: "13px", color: "#333", fontWeight: 600 }}>ACCOUNT OWNER:</p>
                  <span style={{ fontSize: "12px", color: "#777" }}>Signature</span>
                </div>

                <button
                  type="button"
                  onClick={handleSignatureButtonClick}
                  style={{ background: "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "8px 20px", fontSize: "13px", cursor: "pointer", fontWeight: 600, marginBottom: "12px" }}
                >
                  Signature
                </button>

                {/* Show drawn signature image */}
                {signatureDataUrl && (
                  <div className="mb-4" style={{ border: "1px solid #dde3e9", borderRadius: "2px", padding: "4px", display: "inline-block" }}>
                    <img src={signatureDataUrl} alt="Signature" style={{ height: "80px", maxWidth: "300px", objectFit: "contain", display: "block" }} />
                  </div>
                )}

                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65", marginBottom: "12px" }}>
                  By entering your full name, you are signing this Agreement electronically. You agree your electronic signature is the legal equivalent of your manual/handwritten signature on this Agreement. By entering your name using any device, means or action, you consent to the legally binding terms and conditions of this Agreement. You further agree that your signature on this document (hereafter referred to as your 'E-Signature') is as valid as if you signed the document in writing. You also agree that no certification authority or other third-party verification is necessary to validate your E-Signature, and that the lack of such certification or third-party verification will not in any way affect the enforceability of your E-Signature or any resulting agreement between you and Guardian or any of its subsidiaries, affiliates or partners.
                </p>

                <input
                  type="text"
                  placeholder="Your Name"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  style={{ width: "100%", maxWidth: "360px", padding: "8px 10px", fontSize: "13px", border: "1px solid #ccd3da", borderRadius: "2px", color: "#444" }}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button type="button" onClick={() => navigate("/disclosures")} className="font-medium hover:bg-gray-50"
                  style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>
                  Previous
                </button>
                <button type="submit" className="text-white font-semibold hover:opacity-90"
                  style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}>
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ── Electronic Records Modal ── */}
      {showElectronicModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl" style={{ width: "380px", padding: "28px 28px 24px" }}>
            <h2 className="font-bold text-center mb-4" style={{ fontSize: "14px", color: "#333", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Electronic Records<br />and Signature<br />Disclosure
            </h2>
            <label className="flex gap-2 cursor-pointer mb-6">
              <input type="checkbox" checked={electronicAgreed} onChange={(e) => setElectronicAgreed(e.target.checked)} style={{ marginTop: "3px", flexShrink: 0, accentColor: "#3a7bd5" }} />
              <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.65" }}>
                By checking the box 'I agree to use Electronic Records and Signatures, you agree that you or the firm you represent will be legally bound by your electronic signature.
              </p>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleElectronicContinue}
                disabled={!electronicAgreed}
                style={{
                  background: electronicAgreed ? "#3a7bd5" : "#aaa",
                  color: "white", border: "none", borderRadius: "3px",
                  padding: "8px 20px", fontSize: "13px", cursor: electronicAgreed ? "pointer" : "not-allowed", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Continue
              </button>
              <button type="button" onClick={() => setShowElectronicModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#555" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Signature Drawing Modal ── */}
      {showSignatureModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl" style={{ width: "460px", padding: "24px" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#333" }}>Signature</h2>
              <button type="button" onClick={() => setShowSignatureModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#777", lineHeight: 1 }}>✕</button>
            </div>

            {/* Dropdown (decorative) */}
            <div className="relative mb-4">
              <select style={{ width: "100%", padding: "7px 32px 7px 10px", fontSize: "13px", border: "1px solid #ccd3da", borderRadius: "2px", appearance: "none", background: "white", color: "#444", cursor: "pointer" }}>
                <option>Draw Signature</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Draw your New Signature</p>

            <canvas
              ref={canvasRef}
              width={400}
              height={130}
              style={{ border: "1px solid #dde3e9", borderRadius: "2px", width: "100%", height: "130px", cursor: "crosshair", touchAction: "none", background: "#fff" }}
              onMouseDown={startDraw}
              onMouseMove={doDraw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={doDraw}
              onTouchEnd={stopDraw}
            />

            <div className="flex justify-end mt-1 mb-4">
              <button type="button" onClick={clearCanvas} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#3a7bd5", textDecoration: "underline" }}>Clear</button>
            </div>

            <button type="button" onClick={submitSignature}
              style={{ width: "100%", background: "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "10px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
              Submit Signature
            </button>
          </div>
        </div>
      )}

      {/* ── Application Submission Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl" style={{ width: "380px", padding: "28px" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#333" }}>Application Submission</h2>
              <button type="button" onClick={() => setShowSubmitModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#777", lineHeight: 1 }}>✕</button>
            </div>
            <p className="mb-6" style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
              By submitting the application you will not be able to edit the application
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSubmitConfirm}
                style={{ background: "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
                Yes
              </button>
              <button type="button" onClick={() => setShowSubmitModal(false)}
                style={{ background: "white", color: "#555", border: "1px solid #ccd3da", borderRadius: "3px", padding: "8px 24px", fontSize: "13px", cursor: "pointer" }}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p className="text-[13px] mb-6" style={{ color: "#aaa" }}>All securities and transactions are handled through Velocity.</p>
          <p className="text-[11px] uppercase leading-relaxed mb-5" style={{ color: "#666", maxWidth: "900px", margin: "0 auto 20px" }}>
            @2023 VELOCITY CLEARING, LLC IS REGISTERED WITH THE SEC AND A MEMBER OF <a href="https://www.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA</a> AND <a href="https://www.sipc.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>SIPC</a>. MARKET VOLATILITY AND VOLUME MAY DELAY SYSTEMS ACCESS AND TRADE EXECUTION. CHECK THE BACKGROUND OF VELOCITY CLEARING ON <a href="https://brokercheck.finra.org" target="_blank" rel="noreferrer" style={{ color: "#5baad4" }}>FINRA'S BROKER CHECK</a>.
          </p>
          <p className="text-[11px] uppercase leading-relaxed" style={{ color: "#666", maxWidth: "900px", margin: "0 auto" }}>
            OPTIONS INVOLVE RISK AND ARE NOT SUITABLE FOR ALL INVESTORS. FOR MORE INFORMATION READ THE <a href="#" style={{ color: "#5baad4" }}>CHARACTERISTICS AND RISKS OF STANDARDIZED OPTIONS</a>, ALSO KNOWN AS THE OPTIONS DISCLOSURE DOCUMENT (ODD). ALTERNATIVELY, PLEASE CONTACT <a href="mailto:info@guardiantrading.com" style={{ color: "#5baad4" }}>INFO@GUARDIANTRADING.COM</a> TO RECEIVE A COPY OF THE ODD.
          </p>
        </div>
      </footer>
    </div>
  );
}
