import { useState, useRef, useEffect, useCallback } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { required, nameField, type FieldErrors, hasErrors } from "@/lib/validation";

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

type Fields = "consents" | "tradingPlan" | "signatureName" | "signature";

function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if (e instanceof TouchEvent) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
  }
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function restoreFromDataUrl(canvas: HTMLCanvasElement, dataUrl: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = dataUrl;
}

export default function Signatures() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(11);

  const sd = savedData as Record<string, unknown>;

  const [consents, setConsents] = useState<Record<string, boolean>>(
    (sd.consents as Record<string, boolean>) ??
    Object.fromEntries(DISCLOSURE_DOCS.map((d) => [d, false]))
  );
  const [tradingPlan,        setTradingPlan]        = useState((sd.tradingPlan        as string)  ?? "");
  const [electronicDelivery, setElectronicDelivery] = useState((sd.electronicDelivery as boolean) ?? false);
  const [signatureDataUrl,   setSignatureDataUrl]   = useState<string | null>((sd.signatureImage as string) || null);
  const [signatureName,      setSignatureName]      = useState((sd.signatureName      as string)  ?? "");

  const [showElectronicModal, setShowElectronicModal] = useState(false);
  const [electronicAgreed,    setElectronicAgreed]    = useState(false);
  const [showSignatureModal,  setShowSignatureModal]   = useState(false);
  const [showSubmitModal,     setShowSubmitModal]      = useState(false);
  const [errors, setErrors]     = useState<FieldErrors<Fields>>({});
  const [canUndo, setCanUndo]   = useState(false);
  const [canRedo, setCanRedo]   = useState(false);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const isDrawing    = useRef(false);
  const lastPos      = useRef<{ x: number; y: number } | null>(null);
  const historyStack = useRef<string[]>([]);
  const redoStack    = useRef<string[]>([]);
  const preStroke    = useRef<string | null>(null);

  const syncHistoryState = () => {
    setCanUndo(historyStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  };

  useEffect(() => {
    if (!showSignatureModal) return;

    let rafId: number;
    let removeListeners: (() => void) | null = null;

    rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.round(rect.width)  || 408;
      canvas.height = Math.round(rect.height) || 130;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      historyStack.current = [];
      redoStack.current    = [];
      preStroke.current    = null;
      syncHistoryState();

      const onStart = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        lastPos.current   = getPos(e, canvas);
        preStroke.current = canvas.toDataURL();
      };

      const onMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if (!isDrawing.current || !lastPos.current) return;
        const c = canvas.getContext("2d");
        if (!c) return;
        const pos = getPos(e, canvas);
        c.beginPath();
        c.moveTo(lastPos.current.x, lastPos.current.y);
        c.lineTo(pos.x, pos.y);
        c.strokeStyle = "#1c1c1c";
        c.lineWidth   = 2.5;
        c.lineCap     = "round";
        c.lineJoin    = "round";
        c.stroke();
        lastPos.current = pos;
      };

      const onEnd = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current   = null;
        if (preStroke.current) {
          historyStack.current.push(preStroke.current);
          if (historyStack.current.length > 30) historyStack.current.shift();
          preStroke.current = null;
        }
        redoStack.current = [];
        syncHistoryState();
      };

      canvas.addEventListener("mousedown",   onStart, { passive: false });
      canvas.addEventListener("mousemove",   onMove,  { passive: false });
      canvas.addEventListener("mouseup",     onEnd);
      canvas.addEventListener("mouseleave",  onEnd);
      canvas.addEventListener("touchstart",  onStart, { passive: false });
      canvas.addEventListener("touchmove",   onMove,  { passive: false });
      canvas.addEventListener("touchend",    onEnd,   { passive: false });
      canvas.addEventListener("touchcancel", onEnd,   { passive: false });

      removeListeners = () => {
        canvas.removeEventListener("mousedown",   onStart);
        canvas.removeEventListener("mousemove",   onMove);
        canvas.removeEventListener("mouseup",     onEnd);
        canvas.removeEventListener("mouseleave",  onEnd);
        canvas.removeEventListener("touchstart",  onStart);
        canvas.removeEventListener("touchmove",   onMove);
        canvas.removeEventListener("touchend",    onEnd);
        canvas.removeEventListener("touchcancel", onEnd);
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (removeListeners) removeListeners();
      isDrawing.current = false;
      lastPos.current   = null;
    };
  }, [showSignatureModal]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = canvas.toDataURL();
    historyStack.current.push(snap);
    if (historyStack.current.length > 30) historyStack.current.shift();
    redoStack.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    syncHistoryState();
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyStack.current.length === 0) return;
    const current  = canvas.toDataURL();
    const previous = historyStack.current.pop()!;
    redoStack.current.push(current);
    restoreFromDataUrl(canvas, previous);
    syncHistoryState();
  }, []);

  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStack.current.length === 0) return;
    const current = canvas.toDataURL();
    const next    = redoStack.current.pop()!;
    historyStack.current.push(current);
    restoreFromDataUrl(canvas, next);
    syncHistoryState();
  }, []);

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setShowSignatureModal(false);
    setErrors((p) => ({ ...p, signature: undefined }));
  };

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    const unconsented = DISCLOSURE_DOCS.filter((d) => !consents[d]);
    if (unconsented.length > 0) e.consents = `Please consent to all ${DISCLOSURE_DOCS.length} disclosure documents`;
    const tp = required(tradingPlan, "Trading plan selection");
    if (tp) e.tradingPlan = tp;
    if (!signatureDataUrl) e.signature = "Please draw your signature before submitting";
    const sn = nameField(signatureName, "Signature name");
    if (sn) e.signatureName = sn;
    return e;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAll();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    setShowSubmitModal(true);
  };

  const handleSubmitConfirm = async () => {
    setShowSubmitModal(false);
    await submit({ consents, tradingPlan, electronicDelivery, signatureName, hasSigned: !!signatureDataUrl, signatureImage: signatureDataUrl ?? "" });
  };

  return (
    <OnboardingShell currentStep={11}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Disclosures &amp; Signatures</h1>
        </div>

        <div className="px-4 sm:px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}
          {hasErrors(errors) && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              Please complete all required items below before submitting your application.
            </div>
          )}

          <form onSubmit={handleNext} noValidate>
            <p className="mb-5" style={{ fontSize: "12px", color: "#555" }}>Please select the disclosures below and the check the box noting you have read and understood these disclosures.</p>

            <div className="mb-6" style={{ border: `1px solid ${errors.consents ? "#e53e3e" : "#dde3e9"}`, borderRadius: "2px" }}>
              {DISCLOSURE_DOCS.map((doc, i) => (
                <div key={doc} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0" style={{ padding: "9px 14px", borderBottom: i < DISCLOSURE_DOCS.length - 1 ? "1px solid #eef1f4" : "none" }}>
                  <span style={{ fontSize: "12px", color: "#444", flex: 1 }}>{doc} *</span>
                  <div className="flex items-center gap-3 sm:gap-0">
                    <a href="#" style={{ fontSize: "12px", color: "#3a7bd5", textDecoration: "underline", marginRight: "24px" }}>View</a>
                    <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={consents[doc]} onChange={(e) => { setConsents((p) => ({ ...p, [doc]: e.target.checked })); setErrors((p) => ({ ...p, consents: undefined })); }} style={{ accentColor: "#3a7bd5", width: "13px", height: "13px" }} />
                      <span style={{ fontSize: "12px", color: "#555" }}>I provide my consent</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.consents && <p className="mb-4 text-xs" style={{ color: "#e53e3e" }}>{errors.consents}</p>}

            <div className="mb-4" style={{ border: errors.tradingPlan ? "1px solid #e53e3e" : "none", borderRadius: "2px", padding: errors.tradingPlan ? "12px" : "0" }}>
              <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Das Trader Guardian Trading <span style={{ color: "#e53e3e" }}>*</span></p>
              <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>Level 2 Software costs plus up to $165 in Add On Feeds will be waived for accounts generating $599 or more in commissions per month</p>
              <label className="flex gap-2 cursor-pointer">
                <input type="radio" name="tradingPlan" checked={tradingPlan === "das_190"} onChange={() => { setTradingPlan("das_190"); setErrors((p) => ({ ...p, tradingPlan: undefined })); }} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}><strong>Das Level 2 ($190):</strong> Regional Market Depth, Top Level Bids and Offers with Quoted Size for Major Listed Exchanges.</p>
              </label>
            </div>

            <div className="mb-4">
              <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Guardian Professional Trader</p>
              <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>For accounts Classified as Professional by either DasTrader or Sterling.</p>
              <label className="flex gap-2 cursor-pointer">
                <input type="radio" name="tradingPlan" checked={tradingPlan === "das_200"} onChange={() => { setTradingPlan("das_200"); setErrors((p) => ({ ...p, tradingPlan: undefined })); }} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}><strong>Das Level 2 ($200):</strong> Regional Market Depth, Top Level Bids and Offers with Quoted Size for Major Listed Exchanges.</p>
              </label>
            </div>

            <div className="mb-6">
              <p style={{ fontSize: "12px", color: "#444", fontWeight: 700, marginBottom: "3px" }}>Sterling Trader Guardian Trading</p>
              <p style={{ fontSize: "11.5px", color: "#666", marginBottom: "8px" }}>Level 1 Software costs plus up to $375 will be waived for accounts generating $799 or more in commissions per month.</p>
              <label className="flex gap-2 cursor-pointer">
                <input type="radio" name="tradingPlan" checked={tradingPlan === "sterling_275"} onChange={() => { setTradingPlan("sterling_275"); setErrors((p) => ({ ...p, tradingPlan: undefined })); }} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.6" }}><strong>Sterling Trader ($275):</strong> All in package of Sterling Trader Pro including Nasdaq Total View, NYSE/AMEX/ARCA, Nasdaq Level 1.</p>
              </label>
            </div>
            {errors.tradingPlan && <p className="mb-4 text-xs" style={{ color: "#e53e3e" }}>{errors.tradingPlan}</p>}

            <div className="mb-5" style={{ borderTop: "1px solid #eef1f4", paddingTop: "16px" }}>
              <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "4px" }}>Consent for mail delivery of statements and confirms otherwise they will be delivered electronically</p>
              <p className="mb-3" style={{ fontSize: "11.5px" }}>
                <a href="#" style={{ color: "#3a7bd5", textDecoration: "underline" }}>Additional charges will apply if you do NOT check the below box for electronic delivery of statements, confirmations and tax documents</a>
              </p>
              <label className="flex gap-2 cursor-pointer">
                <input type="checkbox" checked={electronicDelivery} onChange={(e) => setElectronicDelivery(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>Please check this box if you wish only to receive communications electronically, including trade confirmations, prospectuses, account statements, proxy materials, tax-related documents, and marketing and sales documents.</p>
              </label>
            </div>

            <div className="mb-6" style={{ borderTop: "1px solid #eef1f4", paddingTop: "16px" }}>
              <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65", marginBottom: "16px" }}>By signing below, I/We attest to the accuracy of the information provided on this form. I/We acknowledge that we have received, read and agree to the terms and conditions contained in the attached Account Agreement, including the arbitration clause.</p>
              <div className="flex items-center gap-3 mb-3">
                <p style={{ fontSize: "13px", color: "#333", fontWeight: 600 }}>ACCOUNT OWNER:</p>
                <span style={{ fontSize: "12px", color: "#777" }}>Signature <span style={{ color: "#e53e3e" }}>*</span></span>
              </div>

              {signatureDataUrl ? (
                <div className="mb-3">
                  <div style={{ border: "1px solid #dde3e9", borderRadius: "2px", padding: "6px", display: "inline-block", background: "#fafbfc" }}>
                    <img src={signatureDataUrl} alt="Your signature" style={{ height: "80px", maxWidth: "320px", objectFit: "contain", display: "block" }} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button type="button" onClick={() => setShowElectronicModal(true)} style={{ background: "none", border: "1px solid #ccd3da", borderRadius: "3px", padding: "5px 14px", fontSize: "12px", color: "#555", cursor: "pointer" }}>Redraw</button>
                    <button type="button" onClick={() => { setSignatureDataUrl(null); setErrors((p) => ({ ...p, signature: "Please draw your signature before submitting" })); }} style={{ background: "none", border: "none", fontSize: "12px", color: "#e53e3e", cursor: "pointer", textDecoration: "underline" }}>Clear Signature</button>
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => setShowElectronicModal(true)} style={{ background: "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "8px 20px", fontSize: "13px", cursor: "pointer", fontWeight: 600, marginBottom: "8px" }}>Sign Here</button>
                  {errors.signature && <p className="mb-2 mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.signature}</p>}
                </>
              )}

              <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65", marginBottom: "12px", marginTop: "8px" }}>By entering your full name, you are signing this Agreement electronically. You agree your electronic signature is the legal equivalent of your manual/handwritten signature on this Agreement.</p>
              <input type="text" placeholder="Your Full Name *" value={signatureName} onChange={(e) => { setSignatureName(e.target.value); setErrors((p) => ({ ...p, signatureName: undefined })); }} style={{ width: "100%", maxWidth: "360px", padding: "8px 10px", fontSize: "13px", border: `1px solid ${errors.signatureName ? "#e53e3e" : "#ccd3da"}`, borderRadius: "2px", color: "#444" }} />
              {errors.signatureName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.signatureName}</p>}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="font-medium hover:bg-gray-50" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>Previous</button>
              <button type="submit" disabled={isSubmitting} className="text-white font-semibold hover:opacity-90" style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}>
                {isSubmitting ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showElectronicModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl w-full max-w-[380px]" style={{ padding: "28px 28px 24px" }}>
            <h2 className="font-bold text-center mb-4" style={{ fontSize: "14px", color: "#333", letterSpacing: "0.04em", textTransform: "uppercase" }}>Electronic Records<br />and Signature<br />Disclosure</h2>
            <label className="flex gap-2 cursor-pointer mb-6">
              <input type="checkbox" checked={electronicAgreed} onChange={(e) => setElectronicAgreed(e.target.checked)} style={{ marginTop: "3px", flexShrink: 0, accentColor: "#3a7bd5" }} />
              <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.65" }}>By checking the box 'I agree to use Electronic Records and Signatures', you agree that you or the firm you represent will be legally bound by your electronic signature.</p>
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { if (!electronicAgreed) return; setShowElectronicModal(false); setShowSignatureModal(true); }} disabled={!electronicAgreed} style={{ background: electronicAgreed ? "#3a7bd5" : "#aaa", color: "white", border: "none", borderRadius: "3px", padding: "8px 20px", fontSize: "13px", cursor: electronicAgreed ? "pointer" : "not-allowed", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Continue
              </button>
              <button type="button" onClick={() => setShowElectronicModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#555" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl w-full max-w-[460px]" style={{ padding: "24px" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#333" }}>Draw Your Signature</h2>
              <button type="button" onClick={() => setShowSignatureModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#777", lineHeight: 1 }}>✕</button>
            </div>

            <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Draw your signature in the box below using your mouse or finger</p>

            <canvas
              ref={canvasRef}
              style={{
                border: "1.5px solid #b0bec5",
                borderRadius: "3px",
                width: "100%",
                height: "140px",
                cursor: "crosshair",
                touchAction: "none",
                background: "#fff",
                display: "block",
              }}
            />

            <div className="flex items-center justify-between mt-2 mb-4">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Undo last stroke"
                  style={{ background: "none", border: "1px solid #ccd3da", borderRadius: "3px", padding: "3px 10px", fontSize: "12px", color: canUndo ? "#444" : "#bbb", cursor: canUndo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-1"/></svg>
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Redo"
                  style={{ background: "none", border: "1px solid #ccd3da", borderRadius: "3px", padding: "3px 10px", fontSize: "12px", color: canRedo ? "#444" : "#bbb", cursor: canRedo ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h1"/></svg>
                  Redo
                </button>
              </div>
              <button type="button" onClick={clearCanvas} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#e53e3e", textDecoration: "underline" }}>Clear</button>
            </div>

            <button type="button" onClick={submitSignature} style={{ width: "100%", background: "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "10px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>
              Save Signature
            </button>
          </div>
        </div>
      )}

      {showSubmitModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="bg-white rounded shadow-xl w-full max-w-[380px]" style={{ padding: "28px" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#333" }}>Application Submission</h2>
              <button type="button" onClick={() => setShowSubmitModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#777", lineHeight: 1 }}>✕</button>
            </div>
            <p className="mb-6" style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>By submitting the application you will not be able to edit the application</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSubmitConfirm} disabled={isSubmitting} style={{ background: isSubmitting ? "#aaa" : "#3a7bd5", color: "white", border: "none", borderRadius: "3px", padding: "8px 24px", fontSize: "13px", cursor: isSubmitting ? "not-allowed" : "pointer", fontWeight: 600 }}>
                {isSubmitting ? "Submitting…" : "Yes"}
              </button>
              <button type="button" onClick={() => setShowSubmitModal(false)} style={{ background: "white", border: "1px solid #ccd3da", borderRadius: "3px", padding: "8px 24px", fontSize: "13px", cursor: "pointer", color: "#555" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </OnboardingShell>
  );
}
