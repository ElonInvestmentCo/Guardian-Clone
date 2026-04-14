import { useState, useRef } from "react";
import { uploadDocument } from "@/lib/saveStep";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";

const ID_TYPES = ["Government Issued ID", "Driver's License", "Passport", "State ID"];

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface SlotState {
  file: File | null;
  status: UploadStatus;
  savedPath: string | null;
  errorMsg: string | null;
}

function FileUploadBox({ slot, role, onSlotChange, label, hasError }: {
  slot: SlotState; role: string; onSlotChange: (s: SlotState) => void; label: string; hasError: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    e.target.value = "";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "pdf"].includes(ext)) {
      onSlotChange({ file, status: "error", savedPath: null, errorMsg: "Invalid file type. Allowed: JPG, PNG, PDF." }); return;
    }
    if (file.size < 1024) { onSlotChange({ file, status: "error", savedPath: null, errorMsg: "File too small (minimum 1 KB)." }); return; }
    if (file.size > 8 * 1024 * 1024) { onSlotChange({ file, status: "error", savedPath: null, errorMsg: "File too large (maximum 8 MB)." }); return; }
    onSlotChange({ file, status: "uploading", savedPath: null, errorMsg: null });
    const result = await uploadDocument(file, role);
    if (result.success) { onSlotChange({ file, status: "success", savedPath: result.path, errorMsg: null }); }
    else { onSlotChange({ file, status: "error", savedPath: null, errorMsg: result.error }); }
  };

  return (
    <div className="flex-1" style={{ border: `1px solid ${hasError ? "#e53e3e" : "#dde3e9"}`, borderRadius: "2px", padding: "14px 16px" }}>
      <p className="mb-2" style={{ fontSize: "11px", fontWeight: 600, color: "#444" }}>{label}</p>
      <div className="flex items-center gap-3 mb-2">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={slot.status === "uploading"} style={{ padding: "5px 14px", fontSize: "12px", background: slot.status === "uploading" ? "#dde3e9" : "#edf1f5", border: "1px solid #ccd3da", borderRadius: "2px", cursor: slot.status === "uploading" ? "not-allowed" : "pointer", color: "#444", whiteSpace: "nowrap" }}>
          {slot.status === "uploading" ? "Uploading…" : "Choose File"}
        </button>
        <span style={{ fontSize: "12px", flex: 1 }}>
          {slot.status === "idle"      && <span style={{ color: "#aaa" }}>No file chosen</span>}
          {slot.status === "uploading" && <span style={{ color: "#5baad4" }}>Uploading {slot.file?.name}…</span>}
          {slot.status === "success"   && <span style={{ color: "#28a745", display: "flex", alignItems: "center", gap: "5px" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{slot.file?.name ?? slot.savedPath ?? "Previously uploaded"}</span>}
          {slot.status === "error"     && <span style={{ color: "#dc3545" }}>{slot.errorMsg ?? "Upload failed"}</span>}
        </span>
        {slot.status === "error" && (
          <button type="button" onClick={() => inputRef.current?.click()} style={{ fontSize: "11px", color: "#3a7bd5", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap" }}>Retry</button>
        )}
        <input ref={inputRef} type="file" accept=".jpeg,.jpg,.png,.pdf" style={{ display: "none" }} onChange={handleFileChange} />
      </div>
      <p style={{ fontSize: "11px", color: "#888" }}>Allowed: .jpeg, .jpg, .png, .pdf — Size: 1 KB – 8 MB.</p>
    </div>
  );
}

export default function IdProofUpload() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(8);

  const [idType,    setIdType]    = useState((savedData.idType as string) ?? "");
  const [frontSlot, setFrontSlot] = useState<SlotState>(() => {
    if (savedData.frontUploaded && savedData.frontFile) {
      return { file: null, status: "success", savedPath: savedData.frontFile as string, errorMsg: null };
    }
    return { file: null, status: "idle", savedPath: null, errorMsg: null };
  });
  const [backSlot,  setBackSlot]  = useState<SlotState>(() => {
    if (savedData.backUploaded && savedData.backFile) {
      return { file: null, status: "success", savedPath: savedData.backFile as string, errorMsg: null };
    }
    return { file: null, status: "idle", savedPath: null, errorMsg: null };
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idType) {
      setError("Please select an ID type.");
      return;
    }
    if (frontSlot.status !== "success") {
      setError("Please upload the front of your ID document.");
      return;
    }
    if (backSlot.status !== "success") {
      setError("Please upload the back of your ID document.");
      return;
    }

    setError("");
    await submit({
      idType,
      frontFile:     frontSlot.savedPath ?? frontSlot.file?.name ?? null,
      backFile:      backSlot.savedPath  ?? backSlot.file?.name  ?? null,
      frontUploaded: frontSlot.status === "success",
      backUploaded:  backSlot.status  === "success",
    });
  };

  const anyUploading = frontSlot.status === "uploading" || backSlot.status === "uploading";

  return (
    <OnboardingShell currentStep={8}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Identification Proof Upload</h1>
        </div>

        <div className="px-4 sm:px-8 py-6">
          <p className="mb-5" style={{ fontSize: "12px", color: "#666", lineHeight: "1.6" }}>
            Government Issued ID. If Driver's License is used and the address is not the same as on the application please provide a utility bill with your name and address.
          </p>

          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}

          {error && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5 relative">
              <select value={idType} onChange={(e) => { setIdType(e.target.value); setError(""); }} style={{ width: "100%", padding: "9px 36px 9px 12px", fontSize: "13px", color: idType ? "#444" : "#999", background: "#f4f6f8", border: "1px solid #ccd3da", borderRadius: "2px", appearance: "none", cursor: "pointer" }} className="focus:outline-none focus:border-[#3a7bd5]">
                <option value="" disabled>Please Select</option>
                {ID_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>

            <p className="mb-4" style={{ fontSize: "12px", color: "#555" }}>Please upload a copy of the Applicant's Government Issued ID (Front and Back). <span style={{ color: "#e53e3e" }}>*</span></p>

            <div className="flex flex-col sm:flex-row gap-4 mb-5">
              <FileUploadBox slot={frontSlot} role="id_front" onSlotChange={(s) => { setFrontSlot(s); setError(""); }} label="Front of ID" hasError={!!error && frontSlot.status !== "success"} />
              <FileUploadBox slot={backSlot}  role="id_back"  onSlotChange={(s) => { setBackSlot(s); setError(""); }} label="Back of ID" hasError={!!error && backSlot.status !== "success"} />
            </div>

            <p className="mb-6"><a href="#" style={{ fontSize: "12px", color: "#3a7bd5", textDecoration: "underline" }}>Image Hints and Tips</a></p>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="font-medium hover:bg-gray-50 transition-colors" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>Previous</button>
              <button type="submit" disabled={anyUploading || isSubmitting} className="text-white font-semibold transition-opacity hover:opacity-90" style={{ background: (anyUploading || isSubmitting) ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: (anyUploading || isSubmitting) ? "not-allowed" : "pointer", fontSize: "13px" }}>
                {anyUploading ? "Uploading…" : isSubmitting ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
