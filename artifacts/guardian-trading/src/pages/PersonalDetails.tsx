import { useState, useEffect } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import { getCountries, getStates, getCities, type LocationOption } from "@/lib/location/locationService";
import OnboardingShell from "@/components/OnboardingShell";
import { nameField, addressField, phoneFormat, zipCode as validateZip, required, type FieldErrors, hasErrors } from "@/lib/validation";

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

const errorBorderStyle: React.CSSProperties = {
  ...fieldStyle,
  borderColor: "#e53e3e",
};

function FieldLabel({ children, required: isReq }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}
      {isReq && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function SelectDropdown({
  value, onChange, options, placeholder, disabled = false, hasError = false, onBlur,
}: {
  value: string; onChange: (v: string) => void; options: LocationOption[];
  placeholder: string; disabled?: boolean; hasError?: boolean; onBlur?: () => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        style={{
          ...fieldStyle,
          borderColor: hasError ? "#e53e3e" : "#ccd3da",
          appearance: "none",
          paddingRight: "28px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
        className="focus:outline-none"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <ChevronDown />
      </div>
    </div>
  );
}

type Fields = "firstName" | "lastName" | "address" | "country" | "state" | "city" | "zipCode" | "phoneNumber";

export default function PersonalDetails() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(1);

  const sd = savedData as Record<string, string>;

  const [firstName, setFirstName] = useState(sd.firstName ?? "");
  const [lastName, setLastName] = useState(sd.lastName ?? "");
  const [address, setAddress] = useState(sd.address ?? "");
  const [aptSuite, setAptSuite] = useState(sd.aptSuite ?? "");
  const [country, setCountry] = useState(sd.country ?? "");
  const [state, setState] = useState(sd.state ?? "");
  const [city, setCity] = useState(sd.city ?? "");
  const [zipCodeVal, setZipCode] = useState(sd.zipCode ?? "");
  const [phoneNumber, setPhoneNumber] = useState(sd.phoneNumber ?? "");
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});

  const [stateOptions, setStateOptions] = useState<LocationOption[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const countries = getCountries();

  useEffect(() => {
    if (!country) { setStateOptions([]); setState(""); setCity(""); return; }
    const states = getStates(country);
    setStateOptions(states);
    setState("");
    setCity("");
  }, [country]);

  useEffect(() => {
    if (!state) { setCityOptions([]); setCity(""); return; }
    setCityOptions(getCities(state));
    setCity("");
  }, [state]);

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    const fn = nameField(firstName, "First name");
    if (fn) e.firstName = fn;
    const ln = nameField(lastName, "Last name");
    if (ln) e.lastName = ln;
    const addr = addressField(address, "Address");
    if (addr) e.address = addr;
    const cty = required(country, "Country");
    if (cty) e.country = cty;
    if (stateOptions.length > 0) {
      const st = required(state, "State / province");
      if (st) e.state = st;
    }
    const ct = required(city, "City");
    if (ct) e.city = ct;
    const zp = validateZip(zipCodeVal, country || "US");
    if (zp) e.zipCode = zp;
    const ph = phoneFormat(phoneNumber);
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

  const handleChange = (field: Fields, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Partial<Record<Fields, boolean>> = {};
    (["firstName", "lastName", "address", "country", "state", "city", "zipCode", "phoneNumber"] as Fields[]).forEach((f) => { allTouched[f] = true; });
    setTouched(allTouched);
    const newErrors = validateAll();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    await submit({ firstName, lastName, address, aptSuite, country, state, city, zipCode: zipCodeVal, phoneNumber });
  };

  const countryLabel = countries.find((c) => c.code === country)?.label ?? "";
  const stateLabel = stateOptions.find((s) => s.code === state)?.label ?? "";

  const showError = (field: Fields) => errors[field] && touched[field];

  return (
    <OnboardingShell currentStep={1}>
      <div
        className="bg-white"
        style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}
      >
        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
            Personal Details
          </h1>
        </div>

        <div className="px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="grid grid-cols-2 gap-5 mb-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input
                  value={firstName}
                  onChange={(e) => handleChange("firstName", e.target.value, setFirstName)}
                  onBlur={() => markTouched("firstName")}
                  style={showError("firstName") ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {showError("firstName") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.firstName}</p>}
              </div>
              <div>
                <FieldLabel required>Last Name</FieldLabel>
                <input
                  value={lastName}
                  onChange={(e) => handleChange("lastName", e.target.value, setLastName)}
                  onBlur={() => markTouched("lastName")}
                  style={showError("lastName") ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {showError("lastName") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.lastName}</p>}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel required>Address</FieldLabel>
              <input
                value={address}
                onChange={(e) => handleChange("address", e.target.value, setAddress)}
                onBlur={() => markTouched("address")}
                placeholder="Street address"
                style={showError("address") ? errorBorderStyle : fieldStyle}
                className="focus:outline-none"
              />
              {showError("address") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.address}</p>}
            </div>

            <div className="mb-5">
              <FieldLabel>Apt / Suite (optional)</FieldLabel>
              <input
                value={aptSuite}
                onChange={(e) => setAptSuite(e.target.value)}
                style={fieldStyle}
                className="focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-5 mb-4">

              <div>
                <FieldLabel required>Country</FieldLabel>
                <SelectDropdown
                  value={country}
                  onChange={(v) => { setCountry(v); if (touched.country) setTimeout(() => validateField("country"), 0); }}
                  onBlur={() => markTouched("country")}
                  options={countries}
                  placeholder="Select country"
                  hasError={!!showError("country")}
                />
                {showError("country") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.country}</p>}
              </div>

              <div>
                <FieldLabel required>
                  {country === "US" ? "State" : country === "CA" ? "Province" : country === "AU" ? "State / Territory" : "State / Region"}
                </FieldLabel>
                <SelectDropdown
                  value={state}
                  onChange={(v) => { setState(v); if (touched.state) setTimeout(() => validateField("state"), 0); }}
                  onBlur={() => markTouched("state")}
                  options={stateOptions}
                  placeholder={country ? "Select state" : "Select country first"}
                  disabled={!country || stateOptions.length === 0}
                  hasError={!!showError("state")}
                />
                {showError("state") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.state}</p>}
                {country && stateOptions.length === 0 && (
                  <p className="mt-1 text-xs" style={{ color: "#888" }}>No regions available — enter city manually below</p>
                )}
              </div>

              <div>
                <FieldLabel required>City</FieldLabel>
                {cityOptions.length > 0 ? (
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => { setCity(e.target.value); if (touched.city) setTimeout(() => validateField("city"), 0); }}
                      onBlur={() => markTouched("city")}
                      disabled={!state}
                      style={{
                        ...fieldStyle,
                        borderColor: showError("city") ? "#e53e3e" : "#ccd3da",
                        appearance: "none",
                        paddingRight: "28px",
                        cursor: !state ? "not-allowed" : "pointer",
                        opacity: !state ? 0.5 : 1,
                      }}
                      className="focus:outline-none"
                    >
                      <option value="" disabled>{state ? "Select city" : "Select state first"}</option>
                      {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"><ChevronDown /></div>
                  </div>
                ) : (
                  <input
                    value={city}
                    onChange={(e) => handleChange("city", e.target.value, setCity)}
                    onBlur={() => markTouched("city")}
                    placeholder={state ? "Enter city name" : "Select state first"}
                    disabled={!state && stateOptions.length > 0}
                    style={{
                      ...fieldStyle,
                      borderColor: showError("city") ? "#e53e3e" : "#ccd3da",
                      opacity: (!state && stateOptions.length > 0) ? 0.5 : 1,
                    }}
                    className="focus:outline-none"
                  />
                )}
                {showError("city") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.city}</p>}
              </div>
            </div>

            {(country || state || city) && (
              <p className="mb-4 text-xs" style={{ color: "#888" }}>
                {[countryLabel, stateLabel, city].filter(Boolean).join(" › ")}
              </p>
            )}

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <FieldLabel required>ZIP / Postal Code</FieldLabel>
                <input
                  value={zipCodeVal}
                  onChange={(e) => handleChange("zipCode", e.target.value, setZipCode)}
                  onBlur={() => markTouched("zipCode")}
                  placeholder={country === "CA" ? "K1A 0B1" : country === "GB" ? "SW1A 1AA" : "12345"}
                  style={showError("zipCode") ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {showError("zipCode") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.zipCode}</p>}
              </div>
              <div>
                <FieldLabel required>Phone Number</FieldLabel>
                <input
                  value={phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value, setPhoneNumber)}
                  onBlur={() => markTouched("phoneNumber")}
                  placeholder="+1 (555) 000-0000"
                  style={showError("phoneNumber") ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {showError("phoneNumber") && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="font-medium hover:bg-gray-50 transition-colors"
                style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-white font-semibold transition-opacity hover:opacity-90"
                style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                {isSubmitting ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
