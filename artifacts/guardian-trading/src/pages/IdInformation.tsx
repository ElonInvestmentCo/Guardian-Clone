import { useState } from "react";
import { useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
import OnboardingShell from "@/components/OnboardingShell";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Other"];
const TAX_ID_TYPES = ["SSN", "EIN", "Foreign ID"];
const ID_TYPES = ["Passport", "Driver's License", "State ID", "Military ID"];
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

const selectStyle: React.CSSProperties = { ...fieldStyle, appearance: "none" as const, paddingRight: "28px", cursor: "pointer" };
const dateStyle: React.CSSProperties = { ...fieldStyle, paddingRight: "36px" };

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}{required && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder = "Please Select" }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle} className="focus:outline-none">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </div>
  );
}

function DateField({ value, onChange, placeholder = "MMM/DD/YYYY" }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={dateStyle} className="focus:outline-none" />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
    </div>
  );
}

export default function IdInformation() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    taxResidenceCountry: "United States",
    foreignIdType: "",
    taxIdType: "",
    dateOfBirth: "",
    taxId: "",
    idType: "",
    idNumber: "",
    issuingState: "",
    countryOfIssuance: "",
    issueDate: "",
    expirationDate: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("idInformation", { ...form });
    navigate("/income-details");
  };

  return (
    <OnboardingShell currentStep={3}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase mb-1" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
            ID Information
          </h1>
          <p className="font-semibold uppercase" style={{ color: "#3a7bd5", fontSize: "10px", letterSpacing: "0.05em" }}>
            Important Information About Procedures For Opening A New Account USA Patriot Act Information
          </p>
        </div>

        <div className="px-8 py-6">
          <p className="mb-5 leading-relaxed" style={{ fontSize: "12px", color: "#666" }}>
            To help the government fight the funding of terrorism and money-laundering activities, Federal law requires that Guardian verify your identity by obtaining your name, date of birth, address, and a government-issued identification number before opening your account. In certain circumstances, Guardian may obtain and verify this information with respect to any person(s) authorized to effect transactions in an account. For certain entities, such as trusts, estates, corporations, partnerships, or other organizations, identifying documentation is also required. Your account may be restricted and/or closed if Guardian cannot verify this information. Guardian will not be responsible for any losses or damages (including but not limited to lost opportunities) resulting from any failure to provide this information, or from any restriction placed upon, or closing of, your account.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            <div className="grid grid-cols-4 gap-5 mb-4">
              <div>
                <FieldLabel required>Country of Tax Residence</FieldLabel>
                <SelectField value={form.taxResidenceCountry} onChange={set("taxResidenceCountry")} options={COUNTRIES} />
              </div>
              <div>
                <FieldLabel>Foreign ID Type</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.foreignIdType} onChange={(e) => set("foreignIdType")(e.target.value)} />
              </div>
              <div>
                <FieldLabel required>Tax ID Type</FieldLabel>
                <SelectField value={form.taxIdType} onChange={set("taxIdType")} options={TAX_ID_TYPES} />
              </div>
              <div>
                <FieldLabel required>Date of Birth</FieldLabel>
                <DateField value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </div>
            </div>

            <div className="mb-5" style={{ maxWidth: "25%" }}>
              <FieldLabel required>Tax ID (SS# / EIN / Foreign ID)</FieldLabel>
              <input style={fieldStyle} className="focus:outline-none" value={form.taxId} onChange={(e) => set("taxId")(e.target.value)} />
            </div>

            <p className="mb-4 font-semibold" style={{ fontSize: "13px", color: "#444" }}>
              Valid Government Issued Photo ID
            </p>

            <div className="grid grid-cols-4 gap-5 mb-4">
              <div>
                <FieldLabel required>ID Type</FieldLabel>
                <SelectField value={form.idType} onChange={set("idType")} options={ID_TYPES} />
              </div>
              <div>
                <FieldLabel required>ID Number</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.idNumber} onChange={(e) => set("idNumber")(e.target.value)} />
              </div>
              <div>
                <FieldLabel required>Issuing State</FieldLabel>
                <SelectField value={form.issuingState} onChange={set("issuingState")} options={US_STATES} />
              </div>
              <div>
                <FieldLabel required>Country of Issuance</FieldLabel>
                <SelectField value={form.countryOfIssuance} onChange={set("countryOfIssuance")} options={COUNTRIES} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6" style={{ maxWidth: "50%" }}>
              <div>
                <FieldLabel required>Issue Date</FieldLabel>
                <DateField value={form.issueDate} onChange={set("issueDate")} />
              </div>
              <div>
                <FieldLabel required>Expiration Date</FieldLabel>
                <DateField value={form.expirationDate} onChange={set("expirationDate")} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/professional-details")}
                className="font-medium hover:bg-gray-50 transition-colors"
                style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}
              >
                Previous
              </button>
              <button
                type="submit"
                className="text-white font-semibold transition-opacity hover:opacity-90"
                style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}
              >
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
