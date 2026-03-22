import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { required, type FieldErrors, hasErrors } from "@/lib/validation";

const REGISTRATION_TYPES = ["Individual Account", "Limited Liability Company"];
const PRODUCTS = ["Stocks", "Stocks And Options"];
const HOW_HEARD = [
  "Google", "Facebook", "Linkedin", "Twitter", "Benzinga",
  "EliteTrader", "Instagram", "YouTube", "Word of Mouth", "Other",
];

type Fields = "registrationType" | "product" | "howHeard";

export default function GeneralDetails() {
  const { savedData, submit, isSubmitting, globalError } = useOnboardingStep(0);

  const [registrationType, setRegistrationType] = useState(
    (savedData.registrationType as string) ?? ""
  );
  const [product, setProduct] = useState((savedData.product as string) ?? "");
  const [howHeard, setHowHeard] = useState((savedData.howHeard as string) ?? "");
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [touched, setTouched] = useState<Partial<Record<Fields, boolean>>>({});

  const validate = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    const r1 = required(registrationType, "Registration type");
    if (r1) e.registrationType = r1;
    const r2 = required(product, "Product");
    if (r2) e.product = r2;
    const r3 = required(howHeard, "How you heard about us");
    if (r3) e.howHeard = r3;
    return e;
  };

  const validateField = (field: Fields) => {
    const allErrors = validate();
    setErrors((prev) => ({ ...prev, [field]: allErrors[field] }));
  };

  const markTouched = (field: Fields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ registrationType: true, product: true, howHeard: true });
    const newErrors = validate();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    await submit({ registrationType, product, howHeard });
  };

  const selectStyle = (hasError: boolean): React.CSSProperties => ({
    background: "#e8edf2",
    border: `1px solid ${hasError ? "#e53e3e" : "#ccd3da"}`,
    borderRadius: "3px",
    padding: "9px 32px 9px 10px",
    color: "#333",
    fontSize: "13px",
    width: "100%",
    appearance: "none" as const,
  });

  return (
    <OnboardingShell>
      <div
        className="bg-white"
        style={{
          borderRadius: "2px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.10)",
          border: "1px solid #dde3e9",
          borderLeft: "4px solid #3a7bd5",
        }}
      >
        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-semibold" style={{ color: "#3a7bd5", fontSize: "20px" }}>
            General Details
          </h1>
        </div>

        <div className="px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleNext} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  Registration Type <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={registrationType}
                    onChange={(e) => {
                      setRegistrationType(e.target.value);
                      if (touched.registrationType) setTimeout(() => validateField("registrationType"), 0);
                    }}
                    onBlur={() => markTouched("registrationType")}
                    className="w-full focus:outline-none"
                    style={selectStyle(!!errors.registrationType && !!touched.registrationType)}
                  >
                    <option value="" disabled>Please Select</option>
                    {REGISTRATION_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.registrationType && touched.registrationType && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.registrationType}</p>}
              </div>

              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  Product <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={product}
                    onChange={(e) => {
                      setProduct(e.target.value);
                      if (touched.product) setTimeout(() => validateField("product"), 0);
                    }}
                    onBlur={() => markTouched("product")}
                    className="w-full focus:outline-none"
                    style={selectStyle(!!errors.product && !!touched.product)}
                  >
                    <option value="" disabled>Please Select</option>
                    {PRODUCTS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.product && touched.product && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.product}</p>}
              </div>

              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  How Did You Hear About Us? <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={howHeard}
                    onChange={(e) => {
                      setHowHeard(e.target.value);
                      if (touched.howHeard) setTimeout(() => validateField("howHeard"), 0);
                    }}
                    onBlur={() => markTouched("howHeard")}
                    className="w-full focus:outline-none"
                    style={selectStyle(!!errors.howHeard && !!touched.howHeard)}
                  >
                    <option value="" disabled>Please Select</option>
                    {HOW_HEARD.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.howHeard && touched.howHeard && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.howHeard}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}
            >
              {isSubmitting ? "Saving…" : "Next"}
            </button>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
