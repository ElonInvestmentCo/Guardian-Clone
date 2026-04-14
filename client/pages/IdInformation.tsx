import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { getCountries, getStates, type LocationOption } from "@/lib/location/locationService";
import { required, ssnFormat, idNumber, dateOfBirth, dateFormat, idExpirationDate, type FieldErrors, hasErrors } from "@/lib/validation";
import { useDateMask } from "@/lib/useDateMask";

const TAX_ID_TYPES = ["SSN", "EIN", "Foreign ID"];
const ID_TYPES = ["Passport", "Driver's License", "State ID", "Military ID"];

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px",
  padding: "9px 10px", color: "#333", fontSize: "13px", width: "100%",
};
const errorFieldStyle: React.CSSProperties = { ...fieldStyle, border: "1px solid #e53e3e" };
const selectStyle: React.CSSProperties = { ...fieldStyle, appearance: "none" as const, paddingRight: "28px", cursor: "pointer" };

function FieldLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}{req && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

function ChevronDown() {
  return (
    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </div>
  );
}

function SearchableSelect({
  value, onChange, options, placeholder, hasError = false, onBlur,
}: {
  value: string; onChange: (v: string) => void; options: LocationOption[];
  placeholder: string; hasError?: boolean; onBlur?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.code === value)?.label ?? "";

  return (
    <div className="relative">
      <div
        className="flex items-center"
        style={{ ...fieldStyle, border: `1px solid ${hasError ? "#e53e3e" : "#ccd3da"}`, cursor: "pointer", paddingRight: "28px", position: "relative" }}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => { setTimeout(() => { setOpen(false); setSearch(""); onBlur?.(); }, 150); }}
            placeholder={placeholder}
            style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", color: "#333", padding: 0 }}
          />
        ) : (
          <span style={{ color: value ? "#333" : "#999", fontSize: "13px" }}>
            {selectedLabel || placeholder}
          </span>
        )}
      </div>
      <ChevronDown />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border overflow-y-auto" style={{ borderColor: "#ccd3da", borderRadius: "0 0 3px 3px", maxHeight: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", top: "100%", left: 0 }}>
          {filtered.map((o) => (
            <div key={o.code} className="cursor-pointer" style={{ padding: "7px 10px", fontSize: "13px", color: "#333", background: o.code === value ? "#e8edf2" : "white" }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); setSearch(""); }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f4f8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.code === value ? "#e8edf2" : "white"; }}
            >{o.label}</div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 w-full bg-white border" style={{ borderColor: "#ccd3da", borderRadius: "0 0 3px 3px", top: "100%", left: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
          <div style={{ padding: "7px 10px", fontSize: "12px", color: "#999" }}>No results found</div>
        </div>
      )}
    </div>
  );
}

function MaskedDateInput({
  value, onChange, onBlur, placeholder, hasError,
}: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder: string; hasError?: boolean;
}) {
  const { inputRef, handleChange } = useDateMask(value, onChange);
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        style={{ ...(hasError ? errorFieldStyle : fieldStyle), paddingRight: "36px" }}
        className="focus:outline-none"
      />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
      </div>
    </div>
  );
}

type Fields = "taxResidenceCountry" | "taxIdType" | "taxId" | "dateOfBirth" | "idType" | "idNumber" | "issuingState" | "countryOfIssuance" | "issueDate" | "expirationDate";

export default function IdInformation() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(3);

  const sd = savedData as Record<string, string>;
  const [form, setForm] = useState({
    taxResidenceCountry: sd.taxResidenceCountry ?? "",
    foreignIdType:       sd.foreignIdType       ?? "",
    taxIdType:           sd.taxIdType           ?? "",
    dateOfBirth:         sd.dateOfBirth         ?? "",
    taxId:               sd.taxId               ?? "",
    idType:              sd.idType              ?? "",
    idNumber:            sd.idNumber            ?? "",
    issuingState:        sd.issuingState        ?? "",
    countryOfIssuance:   sd.countryOfIssuance   ?? "",
    issueDate:           sd.issueDate           ?? "",
    expirationDate:      sd.expirationDate      ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const countries = getCountries();
  const issuingStateOptions = form.countryOfIssuance ? getStates(form.countryOfIssuance) : getStates("US");

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    const r1 = required(form.taxResidenceCountry, "Country of tax residence");
    if (r1) e.taxResidenceCountry = r1;
    const r2 = required(form.taxIdType, "Tax ID type");
    if (r2) e.taxIdType = r2;
    const r3 = ssnFormat(form.taxId, form.taxIdType || "SSN");
    if (r3) e.taxId = r3;
    const r4 = dateOfBirth(form.dateOfBirth);
    if (r4) e.dateOfBirth = r4;
    const r5 = required(form.idType, "ID type");
    if (r5) e.idType = r5;
    const r6 = idNumber(form.idNumber);
    if (r6) e.idNumber = r6;
    if (issuingStateOptions.length > 0) {
      const r7 = required(form.issuingState, "Issuing state");
      if (r7) e.issuingState = r7;
    }
    const r8 = required(form.countryOfIssuance, "Country of issuance");
    if (r8) e.countryOfIssuance = r8;
    const r9 = dateFormat(form.issueDate, "Issue date");
    if (r9) e.issueDate = r9;
    const r10 = idExpirationDate(form.expirationDate);
    if (r10) e.expirationDate = r10;
    return e;
  };

  const validateField = (field: Fields) => {
    const allErrors = validateAll();
    setErrors((prev) => ({ ...prev, [field]: allErrors[field] }));
  };

  const markTouched = (field: Fields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const showError = (field: Fields) => errors[field] && touched[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Partial<Record<Fields, boolean>> = {};
    (["taxResidenceCountry", "taxIdType", "taxId", "dateOfBirth", "idType", "idNumber", "issuingState", "countryOfIssuance", "issueDate", "expirationDate"] as Fields[]).forEach((f) => { allTouched[f] = true; });
    setTouched(allTouched);
    const newErrors = validateAll();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    await submit({ ...form });
  };

  return (
    <OnboardingShell currentStep={3}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase mb-1" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>ID Information</h1>
          <p className="font-semibold uppercase" style={{ color: "#3a7bd5", fontSize: "10px", letterSpacing: "0.05em" }}>
            Important Information About Procedures For Opening A New Account USA Patriot Act Information
          </p>
        </div>

        <div className="px-4 sm:px-8 py-6">
          <p className="mb-5 leading-relaxed" style={{ fontSize: "12px", color: "#666" }}>
            To help the government fight the funding of terrorism and money-laundering activities, Federal law requires that Guardian verify your identity by obtaining your name, date of birth, address, and a government-issued identification number before opening your account.
          </p>

          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
              <div>
                <FieldLabel req>Country of Tax Residence</FieldLabel>
                <SearchableSelect
                  value={form.taxResidenceCountry}
                  onChange={(v) => { set("taxResidenceCountry")(v); if (touched.taxResidenceCountry) setTimeout(() => validateField("taxResidenceCountry"), 0); }}
                  onBlur={() => markTouched("taxResidenceCountry")}
                  options={countries}
                  placeholder="Please Select"
                  hasError={!!showError("taxResidenceCountry")}
                />
                {showError("taxResidenceCountry") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.taxResidenceCountry}</p>}
              </div>
              <div>
                <FieldLabel>Foreign ID Type</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.foreignIdType} onChange={(e) => set("foreignIdType")(e.target.value)} />
              </div>
              <div>
                <FieldLabel req>Tax ID Type</FieldLabel>
                <div className="relative">
                  <select value={form.taxIdType} onChange={(e) => { set("taxIdType")(e.target.value); if (touched.taxIdType) setTimeout(() => validateField("taxIdType"), 0); }} onBlur={() => markTouched("taxIdType")} style={{ ...selectStyle, border: `1px solid ${showError("taxIdType") ? "#e53e3e" : "#ccd3da"}` }} className="focus:outline-none">
                    <option value="" disabled>Please Select</option>
                    {TAX_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown />
                </div>
                {showError("taxIdType") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.taxIdType}</p>}
              </div>
              <div>
                <FieldLabel req>Date of Birth</FieldLabel>
                <MaskedDateInput
                  value={form.dateOfBirth}
                  onChange={(v) => { set("dateOfBirth")(v); if (touched.dateOfBirth) setTimeout(() => validateField("dateOfBirth"), 0); }}
                  onBlur={() => markTouched("dateOfBirth")}
                  placeholder="MM/DD/YYYY"
                  hasError={!!showError("dateOfBirth")}
                />
                {showError("dateOfBirth") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.dateOfBirth}</p>}
              </div>
            </div>
            <div className="mb-5 sm:max-w-[50%] lg:max-w-[25%]">
              <FieldLabel req>Tax ID (SS# / EIN / Foreign ID)</FieldLabel>
              <input style={showError("taxId") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.taxId} onChange={(e) => { set("taxId")(e.target.value); if (touched.taxId) setTimeout(() => validateField("taxId"), 0); }} onBlur={() => markTouched("taxId")} placeholder={form.taxIdType === "SSN" ? "123-45-6789" : form.taxIdType === "EIN" ? "12-3456789" : ""} />
              {showError("taxId") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.taxId}</p>}
            </div>

            <p className="mb-4 font-semibold" style={{ fontSize: "13px", color: "#444" }}>Valid Government Issued Photo ID</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">
              <div>
                <FieldLabel req>ID Type</FieldLabel>
                <div className="relative">
                  <select value={form.idType} onChange={(e) => { set("idType")(e.target.value); if (touched.idType) setTimeout(() => validateField("idType"), 0); }} onBlur={() => markTouched("idType")} style={{ ...selectStyle, border: `1px solid ${showError("idType") ? "#e53e3e" : "#ccd3da"}` }} className="focus:outline-none">
                    <option value="" disabled>Please Select</option>
                    {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown />
                </div>
                {showError("idType") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.idType}</p>}
              </div>
              <div>
                <FieldLabel req>ID Number</FieldLabel>
                <input style={showError("idNumber") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.idNumber} onChange={(e) => { set("idNumber")(e.target.value); if (touched.idNumber) setTimeout(() => validateField("idNumber"), 0); }} onBlur={() => markTouched("idNumber")} />
                {showError("idNumber") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.idNumber}</p>}
              </div>
              <div>
                <FieldLabel req>Issuing State</FieldLabel>
                {issuingStateOptions.length > 0 ? (
                  <SearchableSelect
                    value={form.issuingState}
                    onChange={(v) => { set("issuingState")(v); if (touched.issuingState) setTimeout(() => validateField("issuingState"), 0); }}
                    onBlur={() => markTouched("issuingState")}
                    options={issuingStateOptions}
                    placeholder="Please Select"
                    hasError={!!showError("issuingState")}
                  />
                ) : (
                  <input style={showError("issuingState") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.issuingState} onChange={(e) => { set("issuingState")(e.target.value); if (touched.issuingState) setTimeout(() => validateField("issuingState"), 0); }} onBlur={() => markTouched("issuingState")} placeholder="Enter issuing state" />
                )}
                {showError("issuingState") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.issuingState}</p>}
              </div>
              <div>
                <FieldLabel req>Country of Issuance</FieldLabel>
                <SearchableSelect
                  value={form.countryOfIssuance}
                  onChange={(v) => { set("countryOfIssuance")(v); if (touched.countryOfIssuance) setTimeout(() => validateField("countryOfIssuance"), 0); }}
                  onBlur={() => markTouched("countryOfIssuance")}
                  options={countries}
                  placeholder="Please Select"
                  hasError={!!showError("countryOfIssuance")}
                />
                {showError("countryOfIssuance") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.countryOfIssuance}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 lg:max-w-[50%]">
              <div>
                <FieldLabel req>Issue Date</FieldLabel>
                <MaskedDateInput
                  value={form.issueDate}
                  onChange={(v) => { set("issueDate")(v); if (touched.issueDate) setTimeout(() => validateField("issueDate"), 0); }}
                  onBlur={() => markTouched("issueDate")}
                  placeholder="MM/DD/YYYY"
                  hasError={!!showError("issueDate")}
                />
                {showError("issueDate") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.issueDate}</p>}
              </div>
              <div>
                <FieldLabel req>Expiration Date</FieldLabel>
                <MaskedDateInput
                  value={form.expirationDate}
                  onChange={(v) => { set("expirationDate")(v); if (touched.expirationDate) setTimeout(() => validateField("expirationDate"), 0); }}
                  onBlur={() => markTouched("expirationDate")}
                  placeholder="MM/DD/YYYY"
                  hasError={!!showError("expirationDate")}
                />
                {showError("expirationDate") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.expirationDate}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="font-medium hover:bg-gray-50 transition-colors" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>Previous</button>
              <button type="submit" disabled={isSubmitting} className="text-white font-semibold transition-opacity hover:opacity-90" style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}>
                {isSubmitting ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
