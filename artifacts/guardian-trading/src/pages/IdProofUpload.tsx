import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { saveSignupStep, uploadDocument } from "@/lib/saveStep";
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

const CURRENT_STEP = 8;

const NAV_LINKS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT US", href: "/about" },
  { name: "SERVICES", href: "/#services", hasDropdown: true },
  { name: "PLATFORMS", href: "/platforms" },
  { name: "PRICING", href: "/#pricing" },
  { name: "CONTACT US", href: "/contact" },
];

const ID_TYPES = [
  "Government Issued ID",
  "Driver's License",
  "Passport",
  "State ID",
];

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface SlotState {
  file: File | null;
  status: UploadStatus;
  savedPath: string | null;
  errorMsg: string | null;
}

function FileUploadBox({
  label,
  slot,
  role,
  onSlotChange,
}: {
  label: string;
  slot: SlotState;
  role: string;
  onSlotChange: (s: SlotState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    // Reset input so user can re-pick same filename
    e.target.value = "";

    // Client-side validation
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "pdf"].includes(ext)) {
      onSlotChange({ file, status: "error", savedPath: null, errorMsg: "Invalid file type. Allowed: JPG, PNG, PDF." });
      return;
    }
    if (file.size < 1024) {
      onSlotChange({ file, status: "error", savedPath: null, errorMsg: "File too small (minimum 1 KB)." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onSlotChange({ file, status: "error", savedPath: null, errorMsg: "File too large (maximum 8 MB)." });
      return;
    }

    onSlotChange({ file, status: "uploading", savedPath: null, errorMsg: null });

    const result = await uploadDocument(file, role);

    if (result.success) {
      onSlotChange({ file, status: "success", savedPath: result.path, errorMsg: null });
    } else {
      onSlotChange({ file, status: "error", savedPath: null, errorMsg: result.error });
    }
  };

  return (
    <div className="flex-1" style={{ border: "1px solid #dde3e9", borderRadius: "2px", padding: "14px 16px" }}>
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={slot.status === "uploading"}
          style={{
            padding: "5px 14px",
            fontSize: "12px",
            background: slot.status === "uploading" ? "#dde3e9" : "#edf1f5",
            border: "1px solid #ccd3da",
            borderRadius: "2px",
            cursor: slot.status === "uploading" ? "not-allowed" : "pointer",
            color: "#444",
            whiteSpace: "nowrap",
          }}
        >
          {slot.status === "uploading" ? "Uploading…" : "Choose File"}
        </button>

        {/* Status display */}
        <span style={{ fontSize: "12px", flex: 1 }}>
          {slot.status === "idle" && (
            <span style={{ color: "#aaa" }}>No file chosen</span>
          )}
          {slot.status === "uploading" && (
            <span style={{ color: "#5baad4" }}>Uploading {slot.file?.name}…</span>
          )}
          {slot.status === "success" && (
            <span style={{ color: "#28a745", display: "flex", alignItems: "center", gap: "5px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {slot.file?.name}
            </span>
          )}
          {slot.status === "error" && (
            <span style={{ color: "#dc3545" }}>
              {slot.errorMsg ?? "Upload failed"}
            </span>
          )}
        </span>

        {/* Re-upload button shown on error */}
        {slot.status === "error" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{ fontSize: "11px", color: "#3a7bd5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}
          >
            Retry
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpeg,.jpg,.png,.pdf"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
      <p style={{ fontSize: "11px", color: "#888" }}>
        Allowed file extensions: &nbsp;.jpeg, .jpg, .png, .pdf
      </p>
      <p style={{ fontSize: "11px", color: "#888" }}>File size: 1 KB – 8 MB.</p>
    </div>
  );
}

export default function IdProofUpload() {
  const [, navigate] = useLocation();
  const [idType, setIdType] = useState("Government Issued ID");

  const [frontSlot, setFrontSlot] = useState<SlotState>({ file: null, status: "idle", savedPath: null, errorMsg: null });
  const [backSlot,  setBackSlot]  = useState<SlotState>({ file: null, status: "idle", savedPath: null, errorMsg: null });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("idProofUpload", {
      idType,
      frontFile: frontSlot.savedPath ?? frontSlot.file?.name ?? null,
      backFile:  backSlot.savedPath  ?? backSlot.file?.name  ?? null,
      frontUploaded: frontSlot.status === "success",
      backUploaded:  backSlot.status  === "success",
    });
    navigate("/funding-details");
  };

  const anyUploading = frontSlot.status === "uploading" || backSlot.status === "uploading";

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
          <Link href="/" className="flex items-center flex-shrink-0">
            <img src={guardianLogo} alt="Guardian Trading" style={{ height: "38px", width: "auto", objectFit: "contain" }} />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="flex items-center gap-0.5 text-white hover:text-[#5baad4] transition-colors" style={{ fontSize: "13px", fontWeight: 500 }}>
                {link.name}
                {link.hasDropdown && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
          <button className="text-white font-medium px-5 py-1.5 border transition-colors hover:bg-white/10" style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Step progress bar */}
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

      {/* Main content */}
      <main className="flex-1 px-6 py-6">
        <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

          <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
              Identification Proof Upload
            </h1>
          </div>

          <div className="px-8 py-6">
            <p className="mb-5" style={{ fontSize: "12px", color: "#666", lineHeight: "1.6" }}>
              Government Issued ID. If Driver's License is used and the address is not the same as on the application please provide a utility bill with your name and address.
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* ID Type dropdown */}
              <div className="mb-5 relative">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  style={{ width: "100%", padding: "9px 36px 9px 12px", fontSize: "13px", color: "#444", background: "#f4f6f8", border: "1px solid #ccd3da", borderRadius: "2px", appearance: "none", cursor: "pointer" }}
                  className="focus:outline-none focus:border-[#3a7bd5]"
                >
                  {ID_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              <p className="mb-4" style={{ fontSize: "12px", color: "#555" }}>
                Please upload a copy of the Applicant's Government Issued ID (Front and Back). Accepted formats: JPG, PNG, PDF.
              </p>

              {/* Upload boxes */}
              <div className="flex gap-4 mb-5">
                <FileUploadBox label="Front" slot={frontSlot} role="id_front" onSlotChange={setFrontSlot} />
                <FileUploadBox label="Back"  slot={backSlot}  role="id_back"  onSlotChange={setBackSlot}  />
              </div>

              {/* Hints link */}
              <p className="mb-6">
                <a href="#" style={{ fontSize: "12px", color: "#3a7bd5", textDecoration: "underline" }}>
                  Image Hints and Tips
                </a>
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/investment-experience")}
                  className="font-medium hover:bg-gray-50 transition-colors"
                  style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={anyUploading}
                  className="text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ background: anyUploading ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: anyUploading ? "not-allowed" : "pointer", fontSize: "13px" }}
                >
                  {anyUploading ? "Uploading…" : "Next"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#111" }}>
        <div className="px-10 pt-12 pb-10" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-shrink-0 lg:w-[200px]">
              <Link href="/"><img src={guardianReversedLogo} alt="Guardian Trading" style={{ height: "36px", width: "auto", objectFit: "contain" }} /></Link>
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
