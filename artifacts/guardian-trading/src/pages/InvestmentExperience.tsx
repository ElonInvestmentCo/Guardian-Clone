import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";

const INVESTMENTS = [
  { key: "stocks",      label: "Stocks" },
  { key: "fixedIncome", label: "Fixed Income" },
  { key: "options",     label: "Options" },
  { key: "futures",     label: "Futures" },
];

const YEARS_OPTIONS        = ["1-5", "5+"];
const TRANSACTIONS_OPTIONS = ["0-5", "6-15", "16+"];
const KNOWLEDGE_OPTIONS    = ["None", "Limited", "Good", "Extensive"];

type InvRow = { enabled: boolean; years: string; transactions: string; knowledge: string };
type InvState = Record<string, InvRow>;

function initState(saved?: Record<string, InvRow>): InvState {
  return Object.fromEntries(
    INVESTMENTS.map(({ key }) => [
      key,
      saved?.[key] ?? { enabled: false, years: "", transactions: "", knowledge: "" },
    ])
  );
}

function RadioGroup({ name, options, value, onChange, disabled }: {
  name: string; options: string[]; value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2" style={{ cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.38 : 1 }}>
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => !disabled && onChange(opt)} disabled={disabled} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", color: disabled ? "#aaa" : "#555" }}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export default function InvestmentExperience() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(7);

  const [data, setData] = useState<InvState>(() =>
    initState((savedData.investments as Record<string, InvRow>) ?? undefined)
  );

  const toggle = (key: string) => setData((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  const set    = (key: string, field: keyof InvRow, value: string) => setData((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({ investments: data });
  };

  return (
    <OnboardingShell currentStep={7}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Investment Experience</h1>
        </div>

        <div className="px-8 py-6">
          <div className="mb-6 px-4 py-3" style={{ background: "#f0f4f8", border: "1px solid #dde3e9", borderRadius: "2px" }}>
            <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
              We are collecting the information below to better understand your investment experience. Please check the boxes that best describe your investment experience to date.
            </p>
          </div>

          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ border: "1px solid #dde3e9", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", borderBottom: "1px solid #dde3e9", padding: "8px 16px", background: "#f8fafc" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#555" }}>Investment</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#555" }}>Year(s) Of Experience</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#555" }}>Transaction(s) Per Year</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#555" }}>Knowledge</span>
              </div>
              {INVESTMENTS.map(({ key, label }, idx) => {
                const row = data[key];
                const isLast = idx === INVESTMENTS.length - 1;
                return (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 1fr", borderBottom: isLast ? "none" : "1px solid #dde3e9", padding: "14px 16px", alignItems: "flex-start" }}>
                    <label className="flex items-center gap-2 cursor-pointer" style={{ paddingTop: "1px" }}>
                      <input type="checkbox" checked={row.enabled} onChange={() => toggle(key)} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#444", fontWeight: 500 }}>{label}</span>
                    </label>
                    <RadioGroup name={`years-${key}`} options={YEARS_OPTIONS} value={row.years} onChange={(v) => set(key, "years", v)} disabled={!row.enabled} />
                    <RadioGroup name={`tx-${key}`} options={TRANSACTIONS_OPTIONS} value={row.transactions} onChange={(v) => set(key, "transactions", v)} disabled={!row.enabled} />
                    <RadioGroup name={`know-${key}`} options={KNOWLEDGE_OPTIONS} value={row.knowledge} onChange={(v) => set(key, "knowledge", v)} disabled={!row.enabled} />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
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
