import { useState, useEffect } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import { getCountries, getStates, getCities, type LocationOption } from "@/lib/location/locationService";
import OnboardingShell from "@/components/OnboardingShell";

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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}
      {required && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  hasError = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: LocationOption[];
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

interface FormErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  phoneNumber?: string;
}

export default function PersonalDetails() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(1);

  const sd = savedData as Record<string, string>;

  const [firstName,   setFirstName]   = useState(sd.firstName   ?? "");
  const [lastName,    setLastName]    = useState(sd.lastName     ?? "");
  const [address,     setAddress]     = useState(sd.address      ?? "");
  const [aptSuite,    setAptSuite]    = useState(sd.aptSuite     ?? "");
  const [country,     setCountry]     = useState(sd.country      ?? "");
  const [state,       setState]       = useState(sd.state        ?? "");
  const [city,        setCity]        = useState(sd.city         ?? "");
  const [zipCode,     setZipCode]     = useState(sd.zipCode      ?? "");
  const [phoneNumber, setPhoneNumber] = useState(sd.phoneNumber  ?? "");
  const [errors,      setErrors]      = useState<FormErrors>({});

  const [stateOptions, setStateOptions] = useState<LocationOption[]>([]);
  const [cityOptions,  setCityOptions]  = useState<string[]>([]);

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

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim())    newErrors.firstName   = "First name is required";
    if (!lastName.trim())     newErrors.lastName    = "Last name is required";
    if (!address.trim())      newErrors.address     = "Address is required";
    if (!country)             newErrors.country     = "Country is required";
    if (!state)               newErrors.state       = "State / province is required";
    if (!city)                newErrors.city        = "City is required";
    if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim()))
      newErrors.zipCode = "Enter a valid 5-digit ZIP code";
    if (!/^\+?[1-9]\d{6,14}$/.test(phoneNumber.replace(/[\s\-().]/g, "")))
      newErrors.phoneNumber = "Enter a valid phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await submit({ firstName, lastName, address, aptSuite, country, state, city, zipCode, phoneNumber });
  };

  const countryLabel = countries.find((c) => c.code === country)?.label ?? "";
  const stateLabel   = stateOptions.find((s) => s.code === state)?.label ?? "";

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

            {/* ── Name ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5 mb-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                  style={errors.firstName ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {errors.firstName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.firstName}</p>}
              </div>
              <div>
                <FieldLabel required>Last Name</FieldLabel>
                <input
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                  style={errors.lastName ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {errors.lastName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.lastName}</p>}
              </div>
            </div>

            {/* ── Address ──────────────────────────────────────────── */}
            <div className="mb-4">
              <FieldLabel required>Address</FieldLabel>
              <input
                value={address}
                onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
                style={errors.address ? errorBorderStyle : fieldStyle}
                className="focus:outline-none"
              />
              {errors.address && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.address}</p>}
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

            {/* ── Country → State → City cascade ───────────────────── */}
            <div className="grid grid-cols-3 gap-5 mb-4">

              {/* Country */}
              <div>
                <FieldLabel required>Country</FieldLabel>
                <SelectDropdown
                  value={country}
                  onChange={(v) => { setCountry(v); clearError("country"); }}
                  options={countries}
                  placeholder="Select country"
                  hasError={!!errors.country}
                />
                {errors.country && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.country}</p>}
              </div>

              {/* State / Province — disabled until country selected */}
              <div>
                <FieldLabel required>
                  {country === "US" ? "State" : country === "CA" ? "Province" : country === "AU" ? "State / Territory" : "State / Region"}
                </FieldLabel>
                <SelectDropdown
                  value={state}
                  onChange={(v) => { setState(v); clearError("state"); }}
                  options={stateOptions}
                  placeholder={country ? "Select state" : "Select country first"}
                  disabled={!country || stateOptions.length === 0}
                  hasError={!!errors.state}
                />
                {errors.state && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.state}</p>}
                {country && stateOptions.length === 0 && (
                  <p className="mt-1 text-xs" style={{ color: "#888" }}>No regions available — enter city manually below</p>
                )}
              </div>

              {/* City — disabled until state selected */}
              <div>
                <FieldLabel required>City</FieldLabel>
                {cityOptions.length > 0 ? (
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                      disabled={!state}
                      style={{
                        ...fieldStyle,
                        borderColor: errors.city ? "#e53e3e" : "#ccd3da",
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
                    onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                    placeholder={state ? "Enter city name" : "Select state first"}
                    disabled={!state && stateOptions.length > 0}
                    style={{
                      ...fieldStyle,
                      borderColor: errors.city ? "#e53e3e" : "#ccd3da",
                      opacity: (!state && stateOptions.length > 0) ? 0.5 : 1,
                    }}
                    className="focus:outline-none"
                  />
                )}
                {errors.city && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.city}</p>}
              </div>
            </div>

            {/* Location breadcrumb hint */}
            {(country || state || city) && (
              <p className="mb-4 text-xs" style={{ color: "#888" }}>
                {[countryLabel, stateLabel, city].filter(Boolean).join(" › ")}
              </p>
            )}

            {/* ── ZIP + Phone ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <FieldLabel required>ZIP / Postal Code</FieldLabel>
                <input
                  value={zipCode}
                  onChange={(e) => { setZipCode(e.target.value); clearError("zipCode"); }}
                  placeholder="12345"
                  style={errors.zipCode ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {errors.zipCode && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.zipCode}</p>}
              </div>
              <div>
                <FieldLabel required>Phone Number</FieldLabel>
                <input
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); clearError("phoneNumber"); }}
                  placeholder="+1 (555) 000-0000"
                  style={errors.phoneNumber ? errorBorderStyle : fieldStyle}
                  className="focus:outline-none"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* ── Navigation ───────────────────────────────────────── */}
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
