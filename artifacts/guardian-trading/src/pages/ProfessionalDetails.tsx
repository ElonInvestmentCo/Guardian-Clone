import { useState } from "react";
import { useLocation } from "wouter";
import { Briefcase, User, UserCircle, Landmark, GraduationCap } from "lucide-react";
import { saveSignupStep } from "@/lib/saveStep";
import OnboardingShell from "@/components/OnboardingShell";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Other"];
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

const EMPLOYMENT_OPTIONS = [
  { key: "employed",      label: "Employed",      Icon: Briefcase },
  { key: "self-employed", label: "Self Employed",  Icon: User },
  { key: "retired",       label: "Retired",        Icon: UserCircle },
  { key: "unemployed",    label: "Unemployed",     Icon: Landmark },
  { key: "student",       label: "Student",        Icon: GraduationCap },
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

const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  appearance: "none" as const,
  paddingRight: "28px",
  cursor: "pointer",
};

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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export default function ProfessionalDetails() {
  const [, navigate] = useLocation();
  const [employment, setEmployment] = useState("employed");
  const [form, setForm] = useState({
    employerName: "", positionTitle: "", employerAddress: "",
    aptSuiteNo: "", country: "", city: "", state: "",
    yearsWithEmployer: "", phoneNumber: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("professional", { employmentStatus: employment, ...form });
    navigate("/id-information");
  };

  return (
    <OnboardingShell currentStep={2}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-3" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-semibold mb-0.5" style={{ color: "#3a7bd5", fontSize: "20px" }}>Professional Details</h1>
          <p style={{ fontSize: "13px", color: "#555" }}>Are You Currently</p>
        </div>

        <div className="px-8 py-6">

          {/* Employment tiles */}
          <div className="flex gap-3 mb-6">
            {EMPLOYMENT_OPTIONS.map(({ key, label, Icon }) => {
              const sel = employment === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEmployment(key)}
                  className="flex-1 flex flex-col items-center justify-center gap-2 py-5 transition-colors"
                  style={{ background: sel ? "#3a7bd5" : "#dce6f0", color: sel ? "white" : "#333", border: "none", borderRadius: "3px", cursor: "pointer", minHeight: "80px" }}
                >
                  <Icon size={28} strokeWidth={1.5} />
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-5 mb-4">
              <div>
                <FieldLabel required>Employer Name</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.employerName} onChange={(e) => set("employerName")(e.target.value)} />
              </div>
              <div>
                <FieldLabel required>Position/Title</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.positionTitle} onChange={(e) => set("positionTitle")(e.target.value)} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-5 mb-4">
              <div>
                <FieldLabel required>Address Of Employer</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.employerAddress} onChange={(e) => set("employerAddress")(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Apt/Suite No</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.aptSuiteNo} onChange={(e) => set("aptSuiteNo")(e.target.value)} />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-3 gap-5 mb-4">
              <div>
                <FieldLabel required>Country</FieldLabel>
                <SelectField value={form.country} onChange={set("country")} options={COUNTRIES} />
              </div>
              <div>
                <FieldLabel required>City</FieldLabel>
                <SelectField value={form.city} onChange={set("city")} options={[]} />
              </div>
              <div>
                <FieldLabel required>State/Province</FieldLabel>
                <SelectField value={form.state} onChange={set("state")} options={US_STATES} />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-2 gap-5 mb-1">
              <div>
                <FieldLabel required>Year With Employer</FieldLabel>
                <input style={fieldStyle} className="focus:outline-none" value={form.yearsWithEmployer} onChange={(e) => set("yearsWithEmployer")(e.target.value)} />
              </div>
              <div>
                <FieldLabel required>Phone Number</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1" style={{ ...fieldStyle, padding: 0, paddingLeft: "10px" }}>
                    <input
                      type="tel"
                      placeholder="(___) ___-____"
                      value={form.phoneNumber}
                      onChange={(e) => set("phoneNumber")(e.target.value)}
                      className="flex-1 focus:outline-none bg-transparent"
                      style={{ fontSize: "13px", padding: "9px 8px", border: "none" }}
                    />
                  </div>
                  <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: "20px", height: "20px", background: "#3a7bd5", fontSize: "11px", fontWeight: "bold" }}>i</div>
                </div>
              </div>
            </div>
            <p className="mb-6" style={{ fontSize: "11px", color: "#999" }}>
              Phone numbers are checked for validity in the country that you are applying
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/personal-details")}
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
