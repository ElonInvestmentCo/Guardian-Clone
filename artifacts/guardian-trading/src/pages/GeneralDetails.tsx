import { useState } from "react";
import { useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
import OnboardingShell from "@/components/OnboardingShell";

const REGISTRATION_TYPES = ["Individual Account", "Limited Liability Company"];
const PRODUCTS = ["Stocks", "Stocks And Options"];
const HOW_HEARD = [
  "Google", "Facebook", "Linkedin", "Twitter", "Benzinga",
  "EliteTrader", "Instagram", "YouTube", "Word of Mouth", "Other",
];

export default function GeneralDetails() {
  const [registrationType, setRegistrationType] = useState("");
  const [product, setProduct] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [errors, setErrors] = useState<{
    registrationType?: string;
    product?: string;
    howHeard?: string;
  }>({});
  const [, navigate] = useLocation();

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!registrationType) newErrors.registrationType = "Please select a registration type";
    if (!product) newErrors.product = "Please select a product";
    if (!howHeard) newErrors.howHeard = "Please select an option";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    await saveSignupStep("general", { registrationType, product, howHeard });
    navigate("/personal-details");
  };

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
          <form onSubmit={handleNext} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

              {/* Registration Type */}
              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  Registration Type <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={registrationType}
                    onChange={(e) => {
                      setRegistrationType(e.target.value);
                      if (errors.registrationType) setErrors((p) => ({ ...p, registrationType: undefined }));
                    }}
                    className="w-full appearance-none text-[13px] focus:outline-none"
                    style={{ background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px", padding: "9px 32px 9px 10px", color: registrationType ? "#333" : "#888" }}
                  >
                    <option value="" disabled>Please Select</option>
                    {REGISTRATION_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.registrationType && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.registrationType}</p>}
              </div>

              {/* Product */}
              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  Product you want to trade <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={product}
                    onChange={(e) => {
                      setProduct(e.target.value);
                      if (errors.product) setErrors((p) => ({ ...p, product: undefined }));
                    }}
                    className="w-full appearance-none text-[13px] focus:outline-none"
                    style={{ background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px", padding: "9px 32px 9px 10px", color: product ? "#333" : "#888" }}
                  >
                    <option value="" disabled>Please Select</option>
                    {PRODUCTS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.product && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.product}</p>}
              </div>

              {/* How did you hear */}
              <div>
                <label className="block text-[13px] mb-1.5" style={{ color: "#555" }}>
                  How did you hear about us? <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={howHeard}
                    onChange={(e) => {
                      setHowHeard(e.target.value);
                      if (errors.howHeard) setErrors((p) => ({ ...p, howHeard: undefined }));
                    }}
                    className="w-full appearance-none text-[13px] focus:outline-none"
                    style={{ background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px", padding: "9px 32px 9px 10px", color: howHeard ? "#333" : "#888" }}
                  >
                    <option value="" disabled>Please Select</option>
                    {HOW_HEARD.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.howHeard && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.howHeard}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer" }}
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
