import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { required, nameField, abaSwiftCode, accountNumber as validateAccountNum, type FieldErrors, hasErrors } from "@/lib/validation";

const FUNDING_LEFT  = ["Wages/Income","Gift","Inheritance","Insurance Payout","Savings","Other"];
const FUNDING_RIGHT = ["Pension or Retirement","Sale of an Asset","Social Security Benefits","Funds from another account"];
const ACCOUNT_TYPES = ["Checking","Savings","Money Market","Other"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #ccd3da",
  borderRadius: "2px", color: "#444", background: "white", outline: "none",
};

type Fields = "sources" | "bankName" | "abaSwift" | "accountNumber" | "accountName";

export default function FundingDetails() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(9);

  const sd = savedData as Record<string, unknown>;
  const [sources,       setSources]       = useState<Set<string>>(new Set((sd.fundingSources as string[]) ?? []));
  const [otherText,     setOtherText]     = useState((sd.otherDescription as string) ?? "");
  const [bankName,      setBankName]      = useState((sd.bankName         as string) ?? "");
  const [abaSwift,      setAbaSwift]      = useState((sd.abaSwift         as string) ?? "");
  const [accountNumber, setAccountNumber] = useState((sd.accountNumber    as string) ?? "");
  const [accountName,   setAccountName]   = useState((sd.accountName      as string) ?? "");
  const [accountType,   setAccountType]   = useState((sd.accountType      as string) ?? "Checking");
  const [errors,        setErrors]        = useState<FieldErrors<Fields>>({});

  const toggleSource = (src: string) => { setSources((prev) => {
    const next = new Set(prev); next.has(src) ? next.delete(src) : next.add(src); return next;
  }); setErrors((p) => ({ ...p, sources: undefined })); };

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    if (sources.size === 0) e.sources = "Please select at least one funding source.";
    const bn = nameField(bankName, "Bank name");
    if (bn) e.bankName = bn;
    const ab = abaSwiftCode(abaSwift);
    if (ab) e.abaSwift = ab;
    const an = required(accountName, "Account name");
    if (an) e.accountName = an;
    const acn = validateAccountNum(accountNumber);
    if (acn) e.accountNumber = acn;
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAll();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    await submit({
      fundingSources:   Array.from(sources),
      otherDescription: otherText,
      bankName,
      abaSwift,
      accountNumber,
      accountName,
      accountType,
    });
  };

  return (
    <OnboardingShell currentStep={9}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Funding Details</h1>
        </div>

        <div className="px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <p className="mb-3" style={{ fontSize: "13px", color: "#444", fontWeight: 500 }}>I am funding this account with (check all that apply)</p>

            <div className="flex gap-10 mb-3">
              <div className="flex flex-col gap-2.5" style={{ minWidth: "220px" }}>
                {FUNDING_LEFT.map((src) => (
                  <label key={src} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sources.has(src)} onChange={() => toggleSource(src)} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#444" }}>{src}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5">
                {FUNDING_RIGHT.map((src) => (
                  <label key={src} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={sources.has(src)} onChange={() => toggleSource(src)} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#444" }}>{src}</span>
                  </label>
                ))}
              </div>
            </div>

            {sources.has("Other") ? (
              <div className="mb-4" style={{ maxWidth: "480px" }}>
                <input type="text" placeholder="Please describe other funding source" value={otherText} onChange={(e) => setOtherText(e.target.value)} style={{ ...inputStyle, background: "#f4f6f8" }} />
              </div>
            ) : (
              <div className="mb-4" style={{ height: "34px", background: "#f0f2f5", border: "1px solid #dde3e9", borderRadius: "2px", maxWidth: "480px" }} />
            )}
            {errors.sources && <p className="mb-3 text-xs" style={{ color: "#e53e3e" }}>{errors.sources}</p>}

            <div className="flex gap-4 mb-4">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#555", display: "block", marginBottom: "4px" }}>Name of the bank you will be funding your account from <span style={{ color: "#e53e3e" }}>*</span></label>
                <input type="text" value={bankName} onChange={(e) => { setBankName(e.target.value); setErrors((p) => ({ ...p, bankName: undefined })); }} style={{ ...inputStyle, borderColor: errors.bankName ? "#e53e3e" : "#ccd3da" }} />
                {errors.bankName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.bankName}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#555", display: "block", marginBottom: "4px" }}>ABA / SWIFT <span style={{ color: "#e53e3e" }}>*</span></label>
                <input type="text" value={abaSwift} onChange={(e) => { setAbaSwift(e.target.value); setErrors((p) => ({ ...p, abaSwift: undefined })); }} style={{ ...inputStyle, borderColor: errors.abaSwift ? "#e53e3e" : "#ccd3da" }} />
                {errors.abaSwift && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.abaSwift}</p>}
              </div>
            </div>

            <div className="flex gap-4 mb-6">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#555", display: "block", marginBottom: "4px" }}>Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#555", display: "block", marginBottom: "4px" }}>Account Name <span style={{ color: "#e53e3e" }}>*</span></label>
                <input type="text" value={accountName} onChange={(e) => { setAccountName(e.target.value); setErrors((p) => ({ ...p, accountName: undefined })); }} style={{ ...inputStyle, borderColor: errors.accountName ? "#e53e3e" : "#ccd3da" }} />
                {errors.accountName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.accountName}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", color: "#555", display: "block", marginBottom: "4px" }}>Account Type <span style={{ color: "#e53e3e" }}>*</span></label>
                <div className="relative">
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: "32px", cursor: "pointer", background: "#f4f6f8" }} className="focus:outline-none">
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
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
