import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";

const ANNUAL_EXPENSE_OPTIONS = ["$50,000 and under","$50,001 - $100,000","$100,001 - $250,000","$250,001 - $500,000","over $500,000"];
const SPECIAL_EXPENSE_OPTIONS = ["$50,000 and under","$50,001 - $100,000","$100,001 - $250,000","$250,001 - $500,000","over $500,000"];
const LIQUIDITY_OPTIONS = ["Very important","Important","Some what Important","Does not matter"];
const TIME_HORIZON_OPTIONS = ["Under 1 year","1 - 2","3 - 5","6 - 10","11 - 20","Over 20"];

function SelectList({ label, options, selected, onSelect, error }: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void; error?: string;
}) {
  return (
    <div className="flex-1">
      {label && <p className="font-bold mb-2 uppercase" style={{ fontSize: "12px", color: "#444", letterSpacing: "0.04em" }}>{label}</p>}
      <div style={{ border: `1px solid ${error ? "#e53e3e" : "#dde3e9"}`, borderRadius: "2px", overflow: "hidden" }}>
        {options.map((opt, i) => {
          const isSel = selected === opt;
          return (
            <div key={opt} onClick={() => onSelect(opt)} className="cursor-pointer"
              style={{ padding: "7px 12px", fontSize: "13px", color: "#444", background: isSel ? "#cfe1f5" : i % 2 === 0 ? "#ffffff" : "#edf1f5", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s ease" }}>
              <span>{opt}</span>
              {isSel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "8px" }}><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{error}</p>}
    </div>
  );
}

export default function FinancialSituation() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(6);

  const sd = savedData as Record<string, string>;
  const [annualExpense, setAnnualExpense] = useState(sd.annualExpense          ?? "");
  const [specialExpense, setSpecialExpense] = useState(sd.specialExpense       ?? "");
  const [liquidity, setLiquidity]           = useState(sd.liquidityNeeds       ?? "");
  const [timeHorizon, setTimeHorizon]       = useState(sd.investmentTimeHorizon ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!annualExpense)  newErrors.annualExpense  = "Required";
    if (!specialExpense) newErrors.specialExpense = "Required";
    if (!liquidity)      newErrors.liquidity      = "Required";
    if (!timeHorizon)    newErrors.timeHorizon    = "Required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    await submit({ annualExpense, specialExpense, liquidityNeeds: liquidity, investmentTimeHorizon: timeHorizon });
  };

  return (
    <OnboardingShell currentStep={6}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Financial Situation</h1>
        </div>

        <div className="px-8 py-6">
          <p className="mb-5" style={{ fontSize: "12px", color: "#777" }}>Financial Situation and Needs, Liquidity Considerations and Tax Status</p>

          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex gap-4 mb-6">
              <SelectList label="Annual Expenses" options={ANNUAL_EXPENSE_OPTIONS} selected={annualExpense} onSelect={(v) => { setAnnualExpense(v); setErrors((p) => ({ ...p, annualExpense: "" })); }} error={errors.annualExpense} />
              <SelectList label="SPECIAL EXPENSES (future & non-recurring)" options={SPECIAL_EXPENSE_OPTIONS} selected={specialExpense} onSelect={(v) => { setSpecialExpense(v); setErrors((p) => ({ ...p, specialExpense: "" })); }} error={errors.specialExpense} />
              <SelectList label="Liquidity Needs" options={LIQUIDITY_OPTIONS} selected={liquidity} onSelect={(v) => { setLiquidity(v); setErrors((p) => ({ ...p, liquidity: "" })); }} error={errors.liquidity} />
            </div>

            <div className="mb-7" style={{ maxWidth: "360px" }}>
              <p className="mb-2" style={{ fontSize: "13px", color: "#444", fontWeight: 500 }}>The expected period you plan to achieve your financial goal(s)</p>
              <SelectList label="" options={TIME_HORIZON_OPTIONS} selected={timeHorizon} onSelect={(v) => { setTimeHorizon(v); setErrors((p) => ({ ...p, timeHorizon: "" })); }} error={errors.timeHorizon} />
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
