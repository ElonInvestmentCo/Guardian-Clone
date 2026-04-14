import { useState } from "react";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import OnboardingShell from "@/components/OnboardingShell";
import { required, depositAmount, type FieldErrors, hasErrors } from "@/lib/validation";

type YNVal = "yes" | "no" | "";

function YesNo({ value, onChange, hasError }: { value: YNVal; onChange: (v: YNVal) => void; hasError?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
      {(["yes", "no"] as const).map((opt) => (
        <label
          key={opt}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            minWidth: "72px",
            padding: "0 10px",
            cursor: "pointer",
            userSelect: "none",
            border: `1px solid ${value === opt ? "#3a7bd5" : "#dde3e9"}`,
            borderRadius: "3px",
            background: value === opt ? "#f0f6ff" : "white",
            transition: "border-color 0.05s, background 0.05s",
          }}
        >
          <input
            type="radio"
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ width: "15px", height: "15px", accentColor: "#3a7bd5", flexShrink: 0, cursor: "pointer" }}
          />
          <span style={{ fontSize: "13px", color: "#444", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {opt === "yes" ? "Yes" : "No"}
          </span>
        </label>
      ))}
      {hasError && <span style={{ fontSize: "11px", color: "#e53e3e", marginLeft: "4px", alignSelf: "center" }}>Required</span>}
    </div>
  );
}

function formatDeposit(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

type Fields = "initialDeposit" | "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8" | "q9" | "q10";

export default function Disclosures() {
  const { savedData, submit, goBack, isSubmitting, globalError } = useOnboardingStep(10);

  const sd = savedData as Record<string, unknown>;
  const [wantsMargin,      setWantsMargin]      = useState<YNVal>((sd.wantsMargin      as YNVal) ?? "no");
  const [initialDeposit,   setInitialDeposit]   = useState((sd.initialDeposit          as string) ?? "");
  const [q1,  setQ1]  = useState<YNVal>((sd.q1  as YNVal) ?? "");
  const [q2,  setQ2]  = useState<YNVal>((sd.q2  as YNVal) ?? "");
  const [q3,  setQ3]  = useState<YNVal>((sd.q3  as YNVal) ?? "");
  const [q4,  setQ4]  = useState<YNVal>((sd.q4  as YNVal) ?? "");
  const [q5,  setQ5]  = useState<YNVal>((sd.q5  as YNVal) ?? "");
  const [q6,  setQ6]  = useState<YNVal>((sd.q6  as YNVal) ?? "");
  const [q7,  setQ7]  = useState<YNVal>((sd.q7  as YNVal) ?? "");
  const [q8,  setQ8]  = useState<YNVal>((sd.q8  as YNVal) ?? "");
  const [q9,  setQ9]  = useState<YNVal>((sd.q9  as YNVal) ?? "");
  const [q10, setQ10] = useState<YNVal>((sd.q10 as YNVal) ?? "");
  const [taxWithholding, setTaxWithholding] = useState<"not_subject" | "subject" | "non_resident">(
    (sd.taxWithholding as "not_subject" | "subject" | "non_resident") ?? "not_subject"
  );
  const [partnershipCheck, setPartnershipCheck] = useState((sd.partnershipCheck as boolean) ?? false);
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});

  const qValues = { q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 };
  const qSetters = { q1: setQ1, q2: setQ2, q3: setQ3, q4: setQ4, q5: setQ5, q6: setQ6, q7: setQ7, q8: setQ8, q9: setQ9, q10: setQ10 };

  const validateAll = (): FieldErrors<Fields> => {
    const e: FieldErrors<Fields> = {};
    const dep = depositAmount(initialDeposit);
    if (dep) e.initialDeposit = dep;
    const qKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;
    for (const qk of qKeys) {
      const v = qValues[qk];
      const r = required(v, "This question");
      if (r) e[qk] = r;
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAll();
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;
    await submit({ wantsMargin, initialDeposit, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, taxWithholding, partnershipCheck });
  };

  const qStyle: React.CSSProperties = { fontSize: "12px", color: "#555", lineHeight: "1.55", marginBottom: "2px" };
  const blockStyle: React.CSSProperties = { marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #eef1f4" };

  const questions: Array<{ q: string; key: keyof typeof qValues }> = [
    { q: "Do you currently maintain an account at Guardian in which you have control, beneficial interest, or trading authority? *", key: "q1" },
    { q: "Do you have a relationship with an entity that currently maintains an account at Guardian, such as employee, officer, shareholder, member, partner or owner? *", key: "q2" },
    { q: "Are either you or an immediate family member an officer, director or at least a 10% shareholder in a publicly traded company? *", key: "q3" },
    { q: "Are either you or an immediate family member employed by FINRA, a registered broker dealer or a securities exchange? *", key: "q4" },
    { q: "Are you a senior officer of a bank, savings and loan institution, investment company, investment advisory firm, or other financial institution? *", key: "q5" },
    { q: "Are either you or an immediate relative or family member a senior political figure? *", key: "q6" },
  ];

  const questions2: Array<{ q: string; key: keyof typeof qValues }> = [
    { q: "If you are opening a day trading account with Guardian Trading, do you have $25,000 in available investment capital? *", key: "q8" },
    { q: "Does your sole objective with this account involve high risk? *", key: "q9" },
    { q: "Are you able to withstand losing more or all of your investment in your Guardian Trading account? *", key: "q10" },
  ];

  return (
    <OnboardingShell currentStep={10}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-4 sm:px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Disclosures</h1>
        </div>

        <div className="px-4 sm:px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>{globalError}</div>
          )}

          {hasErrors(errors) && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              Please complete all required fields below before proceeding.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-5">
              <p className="font-semibold mb-2" style={{ fontSize: "13px", color: "#333" }}>Borrowing Money to Buy Securities (Buying 'on Margin'). (Please read carefully)</p>
              <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "10px" }}>You choose to have a 'margin loan account' (commonly known as 'margin account') by checking the boxes below. To help you decide whether a margin loan account is right for you, please read the information below and the client agreement.</p>
              <p style={qStyle}>You wish to borrow funds in my account and would like to open a margin account: I have read the client agreement and disclosures understand my right and obligation under it. *</p>
              <YesNo value={wantsMargin} onChange={setWantsMargin} />
            </div>

            <div className="mb-5 p-3" style={{ background: "#fafbfc", border: "1px solid #e8edf2", borderRadius: "2px" }}>
              <p style={{ fontSize: "11.5px", color: "#666", lineHeight: "1.6" }}>
                <strong>Please Note:</strong> Day trading accounts are only offered to an account that maintains balance greater than $25,000. Therefore, Guardian requires an Initial deposit for such accounts of at least $30,000.
              </p>
            </div>

            <div style={blockStyle}>
              <p style={qStyle}>Please state your approximate initial deposit: <span style={{ color: "#e53e3e" }}>*</span></p>
              <input
                type="text"
                inputMode="numeric"
                value={initialDeposit}
                onChange={(e) => {
                  const formatted = formatDeposit(e.target.value);
                  setInitialDeposit(formatted);
                  setErrors((p) => ({ ...p, initialDeposit: undefined }));
                }}
                placeholder="30,000"
                style={{ marginTop: "6px", width: "100%", maxWidth: "360px", padding: "9px 12px", fontSize: "14px", border: `1px solid ${errors.initialDeposit ? "#e53e3e" : "#ccd3da"}`, borderRadius: "3px", color: "#333", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", minHeight: "44px", boxSizing: "border-box" }}
              />
              {errors.initialDeposit && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.initialDeposit}</p>}
            </div>

            {questions.map(({ q, key }) => (
              <div key={key} style={blockStyle}>
                <p style={qStyle}>{q}</p>
                <YesNo value={qValues[key] as YNVal} onChange={(v) => { qSetters[key](v); setErrors((p) => ({ ...p, [key]: undefined })); }} hasError={!!errors[key]} />
              </div>
            ))}

            <div style={blockStyle}>
              <p style={qStyle}>Have you read, reviewed, and agree to the 'Guardian Addendum to Customer Agreement fee Testing' form? <a href="#" style={{ color: "#3a7bd5", textDecoration: "underline" }}>View</a></p>
              <YesNo value={q7} onChange={(v) => { setQ7(v); setErrors((p) => ({ ...p, q7: undefined })); }} hasError={!!errors.q7} />
            </div>

            {questions2.map(({ q, key }) => (
              <div key={key} style={blockStyle}>
                <p style={qStyle}>{q}</p>
                <YesNo value={qValues[key] as YNVal} onChange={(v) => { qSetters[key](v); setErrors((p) => ({ ...p, [key]: undefined })); }} hasError={!!errors[key]} />
              </div>
            ))}

            <div className="mb-6">
              <div className="px-4 py-2 mb-4" style={{ background: "#e8edf2", borderRadius: "2px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#444" }}>Tax Withholding Certifications - Choose One</p>
              </div>
              <p className="mb-3" style={{ fontSize: "12px", color: "#555", fontWeight: 600 }}>U.S. Person: Under penalty of perjury, I certify that:</p>

              <label className="flex gap-2 mb-3 cursor-pointer">
                <input type="radio" name="taxWithholding" checked={taxWithholding === "not_subject"} onChange={() => setTaxWithholding("not_subject")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <div>
                  <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "6px" }}>Not Subject to Backup Withholding</p>
                  <ol style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.7", paddingLeft: "18px" }}>
                    <li>The number shown on this form is my correct taxpayer identification number, and</li>
                    <li>I am not subject to backup withholding, or exempt from backup withholding, and</li>
                    <li>I am a U.S. citizen or other U.S. person, and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ol>
                </div>
              </label>

              <label className="flex gap-2 mb-3 cursor-pointer">
                <input type="radio" name="taxWithholding" checked={taxWithholding === "subject"} onChange={() => setTaxWithholding("subject")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <div>
                  <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "6px" }}>Subject to Backup Withholding</p>
                  <ol style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.7", paddingLeft: "18px" }}>
                    <li>The number shown on this form is my correct taxpayer identification number, and</li>
                    <li>I am a U.S. citizen or other U.S. person, and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ol>
                </div>
              </label>

              <label className="flex gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={partnershipCheck} onChange={(e) => setPartnershipCheck(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>Check this box if you are a partnership, trust, or estate that has any foreign partners, owners, or beneficiaries providing this form. Note: a partnership that provides a Form W-9 and checks this box may be required to complete Schedules K-2 and K-3 (Form 1065).</p>
              </label>

              <label className="flex gap-2 cursor-pointer">
                <input type="radio" name="taxWithholding" checked={taxWithholding === "non_resident"} onChange={() => setTaxWithholding("non_resident")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>Non Residence Alien: I certify that I am not a U.S resident alien or other U.S. person for U.S. tax purpose and I am submitting the applicable Form W-8 with this Application to certify my foreign status and if applicable, claim tax treaty benefits.</p>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={goBack} className="font-medium hover:bg-gray-50" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>Previous</button>
              <button type="submit" disabled={isSubmitting} className="text-white font-semibold hover:opacity-90" style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}>
                {isSubmitting ? "Saving…" : "Next"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
