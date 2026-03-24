import { useState, useEffect, useRef } from "react";
import { Briefcase, User, UserCircle, Landmark, GraduationCap } from "lucide-react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { getCountries, getStates, getCities, getStateLabel, type LocationOption } from "@/lib/location/locationService";
import { required, nameField, addressField, phoneFormat, type FieldErrors, hasErrors } from "@/lib/validation";

const EMPLOYMENT_OPTIONS = [
  { key: "employed",      label: "Employed",      Icon: Briefcase },
  { key: "self-employed", label: "Self Employed",  Icon: User },
  { key: "retired",       label: "Retired",        Icon: UserCircle },
  { key: "unemployed",    label: "Unemployed",     Icon: Landmark },
  { key: "student",       label: "Student",        Icon: GraduationCap },
];

const NEEDS_EMPLOYER_FIELDS = ["employed", "self-employed"];

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px",
  padding: "9px 10px", color: "#333", fontSize: "13px", width: "100%",
};
const errorFieldStyle: React.CSSProperties = { ...fieldStyle, border: "1px solid #e53e3e" };

function FieldLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}{req && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function SearchableSelect({
  value, onChange, options, placeholder, disabled = false, hasError = false, onBlur,
}: {
  value: string; onChange: (v: string) => void; options: LocationOption[];
  placeholder: string; disabled?: boolean; hasError?: boolean; onBlur?: () => void;
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
        style={{
          ...fieldStyle,
          border: `1px solid ${hasError ? "#e53e3e" : "#ccd3da"}`,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          paddingRight: "28px",
          position: "relative",
        }}
        onClick={() => { if (!disabled) setOpen(!open); }}
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
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <ChevronDown />
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute z-50 w-full bg-white border overflow-y-auto"
          style={{ borderColor: "#ccd3da", borderRadius: "0 0 3px 3px", maxHeight: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", top: "100%", left: 0 }}
        >
          {filtered.map((o) => (
            <div
              key={o.code}
              className="cursor-pointer"
              style={{ padding: "7px 10px", fontSize: "13px", color: "#333", background: o.code === value ? "#e8edf2" : "white" }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.code); setOpen(false); setSearch(""); }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0f4f8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = o.code === value ? "#e8edf2" : "white"; }}
            >
              {o.label}
            </div>
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

type Fields = "employerName" | "positionTitle" | "employerAddress" | "country" | "city" | "state" | "yearsWithEmployer" | "phoneNumber";

export default function ProfessionalDetails() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(2);

  const sd = savedData as Record<string, string>;
  const [employment, setEmployment] = useState(sd.employmentStatus ?? "employed");
  const [form, setForm] = useState({
    employerName:      sd.employerName      ?? "",
    positionTitle:     sd.positionTitle     ?? "",
    employerAddress:   sd.employerAddress   ?? "",
    aptSuiteNo:        sd.aptSuiteNo        ?? "",
    country:           sd.country           ?? "",
    city:              sd.city              ?? "",
    state:             sd.state             ?? "",
    yearsWithEmployer: sd.yearsWithEmployer ?? "",
    phoneNumber:       sd.phoneNumber       ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const needsEmployer = NEEDS_EMPLOYER_FIELDS.includes(employment);

  const countries = getCountries();
  const stateOptions = form.country ? getStates(form.country) : [];
  const [cityOptions, setCityOptions] = useState<string[]>(form.state ? getCities(form.state) : []);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (!form.state) { setCityOptions([]); return; }
    setCityOptions(getCities(form.state));
  }, [form.state]);

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    if (!needsEmployer) return e;
    const en = nameField(form.employerName, "Employer name");
    if (en) e.employerName = en;
    const pt = required(form.positionTitle, "Position/Title");
    if (pt) e.positionTitle = pt;
    const ea = addressField(form.employerAddress, "Employer address");
    if (ea) e.employerAddress = ea;
    const cc = required(form.country, "Country");
    if (cc) e.country = cc;
    const ct = required(form.city, "City");
    if (ct) e.city = ct;
    if (stateOptions.length > 0) {
      const st = required(form.state, "State");
      if (st) e.state = st;
    }
    const yw = required(form.yearsWithEmployer, "Years with employer");
    if (yw) e.yearsWithEmployer = yw;
    else if (form.yearsWithEmployer.trim() && isNaN(Number(form.yearsWithEmployer.trim()))) {
      e.yearsWithEmployer = "Enter a valid number";
    }
    const ph = phoneFormat(form.phoneNumber);
    if (ph) e.phoneNumber = ph;
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
    if (needsEmployer) {
      const allTouched: Partial<Record<Fields, boolean>> = {};
      (["employerName", "positionTitle", "employerAddress", "country", "city", "state", "yearsWithEmployer", "phoneNumber"] as Fields[]).forEach((f) => { allTouched[f] = true; });
      setTouched(allTouched);
      const newErrors = validateAll();
      setErrors(newErrors);
      if (hasErrors(newErrors)) return;
    }
    const payload = needsEmployer
      ? { employmentStatus: employment, ...form }
      : { employmentStatus: employment };
    await submit(payload);
  };

  const cityLocationOptions: LocationOption[] = cityOptions.map((c) => ({ code: c, label: c }));

  return (
    <OnboardingShell currentStep={2}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-3" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-semibold mb-0.5" style={{ color: "#3a7bd5", fontSize: "20px" }}>Professional Details</h1>
          <p style={{ fontSize: "13px", color: "#555" }}>Are You Currently</p>
        </div>

        <div className="px-4 sm:px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {EMPLOYMENT_OPTIONS.map(({ key, label, Icon }) => {
              const sel = employment === key;
              return (
                <button key={key} type="button" onClick={() => { setEmployment(key); setErrors({}); setTouched({}); }}
                  className="flex flex-col items-center justify-center gap-2 py-5 transition-colors"
                  style={{ background: sel ? "#3a7bd5" : "#dce6f0", color: sel ? "white" : "#333", border: "none", borderRadius: "3px", cursor: "pointer", minHeight: "80px" }}
                >
                  <Icon size={28} strokeWidth={1.5} />
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {needsEmployer ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                  <div>
                    <FieldLabel req>Employer Name</FieldLabel>
                    <input style={showError("employerName") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.employerName} onChange={(e) => { set("employerName")(e.target.value); if (touched.employerName) setTimeout(() => validateField("employerName"), 0); }} onBlur={() => markTouched("employerName")} />
                    {showError("employerName") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.employerName}</p>}
                  </div>
                  <div>
                    <FieldLabel req>Position/Title</FieldLabel>
                    <input style={showError("positionTitle") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.positionTitle} onChange={(e) => { set("positionTitle")(e.target.value); if (touched.positionTitle) setTimeout(() => validateField("positionTitle"), 0); }} onBlur={() => markTouched("positionTitle")} />
                    {showError("positionTitle") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.positionTitle}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                  <div>
                    <FieldLabel req>Address Of Employer</FieldLabel>
                    <input style={showError("employerAddress") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.employerAddress} onChange={(e) => { set("employerAddress")(e.target.value); if (touched.employerAddress) setTimeout(() => validateField("employerAddress"), 0); }} onBlur={() => markTouched("employerAddress")} autoComplete="street-address" />
                    {showError("employerAddress") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.employerAddress}</p>}
                  </div>
                  <div>
                    <FieldLabel>Apt/Suite No</FieldLabel>
                    <input style={fieldStyle} className="focus:outline-none" value={form.aptSuiteNo} onChange={(e) => set("aptSuiteNo")(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-4">
                  <div>
                    <FieldLabel req>Country</FieldLabel>
                    <SearchableSelect
                      value={form.country}
                      onChange={(v) => { set("country")(v); set("state")(""); set("city")(""); if (touched.country) setTimeout(() => validateField("country"), 0); }}
                      onBlur={() => markTouched("country")}
                      options={countries}
                      placeholder="Select country"
                      hasError={!!showError("country")}
                    />
                    {showError("country") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.country}</p>}
                  </div>
                  <div>
                    <FieldLabel req={stateOptions.length > 0}>
                      {form.country ? getStateLabel(form.country) : "State/Province"}
                    </FieldLabel>
                    {stateOptions.length > 0 ? (
                      <SearchableSelect
                        value={form.state}
                        onChange={(v) => { set("state")(v); set("city")(""); if (touched.state) setTimeout(() => validateField("state"), 0); }}
                        onBlur={() => markTouched("state")}
                        options={stateOptions}
                        placeholder="Select state"
                        hasError={!!showError("state")}
                      />
                    ) : (
                      <input style={fieldStyle} className="focus:outline-none" value={form.state} onChange={(e) => set("state")(e.target.value)} placeholder={form.country ? "Enter state" : "Select country first"} />
                    )}
                    {showError("state") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.state}</p>}
                  </div>
                  <div>
                    <FieldLabel req>City</FieldLabel>
                    {cityOptions.length > 0 ? (
                      <SearchableSelect
                        value={form.city}
                        onChange={(v) => { set("city")(v); if (touched.city) setTimeout(() => validateField("city"), 0); }}
                        onBlur={() => markTouched("city")}
                        options={cityLocationOptions}
                        placeholder="Select city"
                        hasError={!!showError("city")}
                      />
                    ) : (
                      <input style={showError("city") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.city} onChange={(e) => { set("city")(e.target.value); if (touched.city) setTimeout(() => validateField("city"), 0); }} onBlur={() => markTouched("city")} placeholder="Enter city" />
                    )}
                    {showError("city") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.city}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-1">
                  <div>
                    <FieldLabel req>Years With Employer</FieldLabel>
                    <input style={showError("yearsWithEmployer") ? errorFieldStyle : fieldStyle} className="focus:outline-none" value={form.yearsWithEmployer} onChange={(e) => { set("yearsWithEmployer")(e.target.value); if (touched.yearsWithEmployer) setTimeout(() => validateField("yearsWithEmployer"), 0); }} onBlur={() => markTouched("yearsWithEmployer")} />
                    {showError("yearsWithEmployer") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.yearsWithEmployer}</p>}
                  </div>
                  <div>
                    <FieldLabel req>Phone Number</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center flex-1" style={{ ...(showError("phoneNumber") ? errorFieldStyle : fieldStyle), padding: 0, paddingLeft: "10px" }}>
                        <input type="tel" placeholder="(___) ___-____" value={form.phoneNumber} onChange={(e) => { set("phoneNumber")(e.target.value); if (touched.phoneNumber) setTimeout(() => validateField("phoneNumber"), 0); }} onBlur={() => markTouched("phoneNumber")} className="flex-1 focus:outline-none bg-transparent" style={{ fontSize: "13px", padding: "9px 8px", border: "none" }} />
                      </div>
                      <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: "20px", height: "20px", background: "#3a7bd5", fontSize: "11px", fontWeight: "bold" }}>i</div>
                    </div>
                    {showError("phoneNumber") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.phoneNumber}</p>}
                  </div>
                </div>
                <p className="mb-6" style={{ fontSize: "11px", color: "#999" }}>Phone numbers are checked for validity in the country that you are applying</p>
              </>
            ) : (
              <div className="mb-6 px-4 py-3" style={{ background: "#f0f4f8", border: "1px solid #dde3e9", borderRadius: "2px" }}>
                <p style={{ fontSize: "12px", color: "#555" }}>
                  No employer information is required for your selected status ({EMPLOYMENT_OPTIONS.find((o) => o.key === employment)?.label}).
                </p>
              </div>
            )}

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
