import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";

const ANNUAL_INCOME = [
  "$25,000 and under", "$25,001 - $50,000", "$50,001 - $100,000",
  "$100,001 - $250,000", "$250,001 - $500,000", "over $500,000",
];
const NET_WORTH = [
  "$25,000 and under", "$25,001 - $50,000", "$50,001 - $200,000",
  "$200,001 - $500,000", "$500,001 - $1,000,000", "over $1,000,000",
];
const LIQUID_NET_WORTH = [
  "$25,000 and under", "$25,001 - $50,000", "$50,001 - $200,000",
  "$200,001 - $500,000", "$500,001 - $1,000,000", "over $1,000,000",
];
const TAX_RATES = ["0 - 15", "16 - 25", "26 - 30", "31 - 35", "over 35"];

function SelectList({ label, options, selected, onSelect }: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <div className="flex-1">
      <p className="font-semibold mb-1" style={{ fontSize: "13px", color: "#333" }}>{label}</p>
      <div style={{ border: "1px solid #dde3e9", borderRadius: "2px", overflow: "hidden" }}>
        {options.map((opt, i) => {
          const isSel = selected === opt;
          const isEven = i % 2 === 0;
          return (
            <div key={opt} onClick={() => onSelect(opt)} className="cursor-pointer"
              style={{ padding: "7px 12px", fontSize: "13px", color: "#444", background: isSel ? "#cfe1f5" : isEven ? "#ffffff" : "#edf1f5", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.15s ease" }}>
              <span>{opt}</span>
              {isSel && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "8px" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IncomeDetails() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(4);

  const sd = savedData as Record<string, string>;
  const [annualIncome,   setAnnualIncome]   = useState(sd.annualIncome   ?? "$25,000 and under");
  const [netWorth,       setNetWorth]       = useState(sd.netWorth       ?? "$25,000 and under");
  const [liquidNetWorth, setLiquidNetWorth] = useState(sd.liquidNetWorth ?? "$25,000 and under");
  const [taxRate,        setTaxRate]        = useState(sd.taxRate        ?? "0 - 15");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({ annualIncome, netWorth, liquidNetWorth, taxRate });
  };

  return (
    <OnboardingShell currentStep={4}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Income Details</h1>
        </div>

        <div className="px-4 sm:px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <SelectList label="Annual Income" options={ANNUAL_INCOME} selected={annualIncome} onSelect={setAnnualIncome} />
              <SelectList label="Net Worth" options={NET_WORTH} selected={netWorth} onSelect={setNetWorth} />
              <SelectList label="Liquid Net Worth" options={LIQUID_NET_WORTH} selected={liquidNetWorth} onSelect={setLiquidNetWorth} />
              <SelectList label="Tax Rate Bracket (%)" options={TAX_RATES} selected={taxRate} onSelect={setTaxRate} />
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
