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

/* ── Radio group with large tap targets ──────────────────────────────────── */
function RadioGroup({ name, options, value, onChange, disabled }: {
  name: string; options: string[]; value: string;
  onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: "2px" }}>
      {options.map((opt) => (
        <label
          key={opt}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minHeight: "44px",
            padding: "0 6px",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.38 : 1,
            borderRadius: "3px",
            userSelect: "none",
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => !disabled && onChange(opt)}
            disabled={disabled}
            style={{
              width: "16px",
              height: "16px",
              minWidth: "16px",
              accentColor: "#3a7bd5",
              flexShrink: 0,
              cursor: disabled ? "default" : "pointer",
            }}
          />
          <span style={{ fontSize: "13px", color: disabled ? "#aaa" : "#444", lineHeight: 1.2 }}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

/* ── Sub-fields label ────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "11px", fontWeight: 700, color: "#3a7bd5", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px", paddingLeft: "6px" }}>
      {children}
    </p>
  );
}

export default function InvestmentExperience() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(7);

  const [data, setData] = useState<InvState>(() =>
    initState((savedData.investments as Record<string, InvRow>) ?? undefined)
  );
  const [error, setError] = useState("");

  const toggle = (key: string) => {
    setData((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
    setError("");
  };
  const set = (key: string, field: keyof InvRow, value: string) => {
    setData((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enabledKeys = Object.entries(data).filter(([, row]) => row.enabled);
    if (enabledKeys.length === 0) {
      setError("Please select at least one investment type to proceed.");
      return;
    }
    const incomplete = enabledKeys.filter(([, row]) => !row.years || !row.transactions || !row.knowledge);
    if (incomplete.length > 0) {
      const names = incomplete.map(([k]) => INVESTMENTS.find((i) => i.key === k)?.label ?? k).join(", ");
      setError(`Please complete all fields for: ${names}`);
      return;
    }
    setError("");
    await submit({ investments: data });
  };

  return (
    <OnboardingShell currentStep={7}>
      <style>{`
        @media (min-width: 768px) {
          .inv-row-desktop { display: grid !important; }
          .inv-row-desktop-header { display: grid !important; }
          .inv-card-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .inv-row-desktop { display: none !important; }
          .inv-row-desktop-header { display: none !important; }
          .inv-card-mobile { display: block !important; }
        }
      `}</style>

      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            Investment Experience
          </h1>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: "#f0f4f8", border: "1px solid #dde3e9", borderRadius: "2px", padding: "10px 14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              We are collecting the information below to better understand your investment experience. Please check the boxes that best describe your investment experience to date.
            </p>
          </div>

          {globalError && (
            <div style={{ marginBottom: "14px", padding: "8px 14px", background: "#fff3f3", border: "1px solid #f5c6c6", borderRadius: "2px", color: "#c0392b", fontSize: "13px" }}>
              {globalError}
            </div>
          )}
          {error && (
            <div style={{ marginBottom: "14px", padding: "8px 14px", background: "#fff3f3", border: "1px solid #f5c6c6", borderRadius: "2px", color: "#c0392b", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Desktop table ──────────────────────────────────────────── */}
            <div style={{ border: "1px solid #dde3e9", borderRadius: "2px", overflow: "hidden" }}>
              <div
                className="inv-row-desktop-header"
                style={{ display: "none", gridTemplateColumns: "200px 1fr 1fr 1fr", padding: "8px 16px", background: "#f8fafc", borderBottom: "1px solid #dde3e9" }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Investment</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Year(s) Of Experience</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transaction(s) Per Year</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em" }}>Knowledge</span>
              </div>

              {INVESTMENTS.map(({ key, label }, idx) => {
                const row = data[key];
                const isLast = idx === INVESTMENTS.length - 1;
                const isIncomplete = row.enabled && (!row.years || !row.transactions || !row.knowledge);
                return (
                  <div
                    key={key}
                    className="inv-row-desktop"
                    style={{
                      display: "none",
                      gridTemplateColumns: "200px 1fr 1fr 1fr",
                      borderBottom: isLast ? "none" : "1px solid #dde3e9",
                      padding: "12px 16px",
                      alignItems: "flex-start",
                      background: isIncomplete && error ? "#fffbfb" : "transparent",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", minHeight: "44px", cursor: "pointer", paddingTop: "4px" }}>
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={() => toggle(key)}
                        style={{ width: "16px", height: "16px", minWidth: "16px", accentColor: "#3a7bd5", flexShrink: 0, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "13px", color: "#333", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>{label}</span>
                    </label>
                    <RadioGroup name={`years-${key}`} options={YEARS_OPTIONS} value={row.years} onChange={(v) => set(key, "years", v)} disabled={!row.enabled} />
                    <RadioGroup name={`tx-${key}`} options={TRANSACTIONS_OPTIONS} value={row.transactions} onChange={(v) => set(key, "transactions", v)} disabled={!row.enabled} />
                    <RadioGroup name={`know-${key}`} options={KNOWLEDGE_OPTIONS} value={row.knowledge} onChange={(v) => set(key, "knowledge", v)} disabled={!row.enabled} />
                  </div>
                );
              })}

              {/* ── Mobile cards ─────────────────────────────────────────── */}
              <div className="inv-card-mobile" style={{ display: "none" }}>
                {INVESTMENTS.map(({ key, label }, idx) => {
                  const row = data[key];
                  const isLast = idx === INVESTMENTS.length - 1;
                  const isIncomplete = row.enabled && (!row.years || !row.transactions || !row.knowledge);
                  return (
                    <div
                      key={key}
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #dde3e9",
                        background: isIncomplete && error ? "#fffbfb" : row.enabled ? "#fafcff" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Card header — always visible, 44px+ tap target */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          minHeight: "52px",
                          padding: "0 16px",
                          cursor: "pointer",
                          userSelect: "none",
                          borderLeft: row.enabled ? "3px solid #3a7bd5" : "3px solid transparent",
                          transition: "border-color 0.05s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={() => toggle(key)}
                          style={{ width: "18px", height: "18px", minWidth: "18px", accentColor: "#3a7bd5", flexShrink: 0, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "14px", color: "#333", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", flex: 1 }}>
                          {label}
                        </span>
                        {row.enabled && (
                          <span style={{ fontSize: "11px", color: "#3a7bd5", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {(!row.years || !row.transactions || !row.knowledge) ? "Incomplete" : "✓ Done"}
                          </span>
                        )}
                      </label>

                      {/* Sub-options — shown INSTANTLY when checked (no transition) */}
                      {row.enabled && (
                        <div style={{ padding: "0 16px 16px 16px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingTop: "4px" }}>
                            <div>
                              <FieldLabel>Experience</FieldLabel>
                              <RadioGroup name={`years-${key}`} options={YEARS_OPTIONS} value={row.years} onChange={(v) => set(key, "years", v)} disabled={false} />
                            </div>
                            <div>
                              <FieldLabel>Transactions/Yr</FieldLabel>
                              <RadioGroup name={`tx-${key}`} options={TRANSACTIONS_OPTIONS} value={row.transactions} onChange={(v) => set(key, "transactions", v)} disabled={false} />
                            </div>
                            <div>
                              <FieldLabel>Knowledge</FieldLabel>
                              <RadioGroup name={`know-${key}`} options={KNOWLEDGE_OPTIONS} value={row.knowledge} onChange={(v) => set(key, "knowledge", v)} disabled={false} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={goBack}
                style={{ padding: "10px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: 500 }}
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "10px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px", color: "white", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
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
