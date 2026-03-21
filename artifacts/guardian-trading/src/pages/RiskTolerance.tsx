import { useState } from "react";
import { useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
import OnboardingShell from "@/components/OnboardingShell";

const RISK_OPTIONS = [
  { key: "conservative", label: "Conservative", desc: "I want to preserve my initial principal in this account, with minimal risk, even if that means this account does not generate significant income or returns and may not keep pace with inflation." },
  { key: "moderately-conservative", label: "Moderately Conservative", desc: "I am willing to accept low risk to my initial principal, including low volatility, to seek a modest level of portfolio returns." },
  { key: "moderate", label: "Moderate", desc: "I am willing to accept some risk to my initial principal and tolerate some volatility to seek higher returns, and I understand I could lose a portion of the money invested." },
  { key: "moderately-aggressive", label: "Moderately Aggressive", desc: "I am willing to accept high risk to my initial principal, including high volatility, to seek high returns over time and understand I could lose a substantial amount of the money invested." },
  { key: "significant", label: "Significant Risk", desc: "I am willing to accept maximum risk to my initial principal to aggressively seek maximum returns, and I understand I could lose most, or all, of the money invested." },
];

const STRATEGIES = [
  { key: "income", label: "Income", desc: "Focus on investments that generate income" },
  { key: "growth", label: "Growth of Account", desc: "Focus on Investments that are looking to grow in value" },
  { key: "speculation", label: "Speculation", desc: "Focus on assets with a chance of significant value increased. Ability to sustain high losses to achieve this objective" },
  { key: "trading", label: "Trading", desc: "Looking to employ strategies on short term opportunities. This strategy tends to yield high turnover, and high risk" },
  { key: "capital", label: "Capital Preservation", desc: "Primary goal is to preserve capital and prevent loss in a portfolio" },
];

const PRIORITY_OPTIONS = ["1", "2", "3", "4", "5"];

const selectStyle: React.CSSProperties = {
  background: "#e8edf2", border: "1px solid #ccd3da", borderRadius: "3px",
  padding: "7px 28px 7px 10px", color: "#555", fontSize: "13px",
  appearance: "none" as const, cursor: "pointer", width: "160px",
};

export default function RiskTolerance() {
  const [, navigate] = useLocation();
  const [selectedRisk, setSelectedRisk] = useState<string>("");
  const [hasEducation, setHasEducation] = useState<string>("");
  const [priorities, setPriorities] = useState<Record<string, string>>({
    income: "", growth: "", speculation: "", trading: "", capital: "",
  });
  const [riskError, setRiskError] = useState<string>("");
  const [priorityError, setPriorityError] = useState<string>("");

  const usedPriorities = Object.values(priorities).filter(Boolean);

  const handlePriorityChange = (key: string, value: string) => {
    setPriorities((p) => ({ ...p, [key]: value }));
    setPriorityError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!selectedRisk) { setRiskError("Please select a risk tolerance option before proceeding."); valid = false; } else { setRiskError(""); }
    const allAssigned = STRATEGIES.every(({ key }) => priorities[key] !== "");
    const uniqueValues = new Set(Object.values(priorities).filter(Boolean));
    if (!allAssigned || uniqueValues.size !== STRATEGIES.length) {
      setPriorityError("Please assign a unique priority (1–5) to every strategy."); valid = false;
    } else { setPriorityError(""); }
    if (!valid) return;
    await saveSignupStep("riskTolerance", { riskTolerance: selectedRisk, hasFinancialEducation: hasEducation, strategyPriorities: priorities });
    navigate("/financial-situation");
  };

  return (
    <OnboardingShell currentStep={5}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
            Risk Tolerance
          </h1>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} noValidate>

            <p className="mb-5 leading-relaxed" style={{ fontSize: "12px", color: "#555" }}>
              <strong>We consider day trading to be a high-risk trading strategy.</strong>{" "}
              Please ensure that you have read and understand the accompanying Day Trading Risk Disclosure Statement before submitting your new account documentation. It is in your best interest to carefully consider whether or not you have a significant risk tolerance before proceeding with this form.
            </p>

            <div className="mb-5" style={{ border: "1px solid #dde3e9", borderRadius: "2px", padding: "16px 20px" }}>
              <p className="font-semibold mb-1" style={{ fontSize: "15px", color: "#333" }}>Investment Risk Tolerance</p>
              <p className="mb-4" style={{ fontSize: "12px", color: "#777" }}>Please select the degree of risk you are willing to take with the assets in this account</p>
              <div className="flex flex-col gap-3">
                {RISK_OPTIONS.map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-4 cursor-pointer" style={{ padding: "10px 12px", borderRadius: "3px", border: `1px solid ${selectedRisk === key ? "#3a7bd5" : "#dde3e9"}`, background: selectedRisk === key ? "#eef4fc" : "white", transition: "background 0.15s, border-color 0.15s" }}>
                    <input type="radio" name="riskTolerance" value={key} checked={selectedRisk === key} onChange={() => { setSelectedRisk(key); setRiskError(""); }} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "13px", color: "#333", fontWeight: 600, marginBottom: "2px" }}>{label}</p>
                      <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.5" }}>{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {riskError && <p className="mt-2 text-xs" style={{ color: "#e53e3e" }}>{riskError}</p>}
            </div>

            <div className="mb-5">
              <p className="mb-2" style={{ fontSize: "13px", color: "#444" }}>
                Have you had education in trading/financial markets?<span style={{ color: "#e53e3e" }}>*</span>
              </p>
              <div className="flex items-center gap-6">
                {["Yes", "No"].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="education" value={opt} checked={hasEducation === opt} onChange={() => setHasEducation(opt)} style={{ width: "14px", height: "14px", accentColor: "#3a7bd5" }} />
                    <span style={{ fontSize: "13px", color: "#555" }}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-4" style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
                Please detail the trading strategy you are looking to employ at Guardian On a scale of 1-5 in terms of priority, 5 being the highest, and 1 being the lowest in terms of priority, please review and evaluate the below.{" "}
                <span style={{ color: "#e53e3e" }}>*</span>
              </p>
              <div className="flex flex-col gap-3">
                {STRATEGIES.map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      <select value={priorities[key]} onChange={(e) => handlePriorityChange(key, e.target.value)} style={{ ...selectStyle, borderColor: priorityError && !priorities[key] ? "#e53e3e" : "#ccd3da" }} className="focus:outline-none">
                        <option value="" disabled>Please Select</option>
                        {PRIORITY_OPTIONS.map((o) => {
                          const takenByOther = usedPriorities.includes(o) && priorities[key] !== o;
                          return <option key={o} value={o} disabled={takenByOther} style={{ color: takenByOther ? "#bbb" : "#555" }}>{o}</option>;
                        })}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#555" }}>
                      <strong style={{ color: "#333" }}>{label}</strong>{" "}<span>: {desc}</span>
                    </p>
                  </div>
                ))}
              </div>
              {priorityError && <p className="mt-2 text-xs" style={{ color: "#e53e3e" }}>{priorityError}</p>}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/income-details")} className="font-medium hover:bg-gray-50 transition-colors" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>
                Previous
              </button>
              <button type="submit" className="text-white font-semibold transition-opacity hover:opacity-90" style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}>
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
