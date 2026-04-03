import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { getApiBase } from "@/lib/api";
import guardianLogo from "@assets/img-guardian-reversed-291x63-1_1773972882381.png";
import spinnerImg from "@assets/spinner-clean.png";

const FIELD_TO_STEP: Record<string, { step: string; fields: { key: string; label: string; type?: string; options?: string[] }[] }> = {
  "Personal Details": {
    step: "personal",
    fields: [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "address", label: "Residential Address" },
      { key: "aptSuite", label: "Apt/Suite" },
      { key: "country", label: "Country" },
      { key: "state", label: "State/Province" },
      { key: "city", label: "City" },
      { key: "zipCode", label: "ZIP Code" },
      { key: "phoneNumber", label: "Phone Number" },
    ],
  },
  "Professional Details": {
    step: "professional",
    fields: [
      { key: "employmentStatus", label: "Employment Status", type: "select", options: ["Employed", "Self-Employed", "Retired", "Unemployed", "Student"] },
      { key: "employerName", label: "Employer Name" },
      { key: "positionTitle", label: "Position/Title" },
      { key: "employerAddress", label: "Employer Address" },
      { key: "country", label: "Country" },
      { key: "city", label: "City" },
      { key: "yearsWithEmployer", label: "Years with Employer" },
      { key: "phoneNumber", label: "Phone Number" },
    ],
  },
  "ID Information": {
    step: "idInformation",
    fields: [
      { key: "taxResidenceCountry", label: "Country of Tax Residence" },
      { key: "taxIdType", label: "Tax ID Type", type: "select", options: ["SSN", "EIN", "Foreign Tax ID"] },
      { key: "taxId", label: "Tax ID" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "idType", label: "ID Type", type: "select", options: ["Passport", "Driver's License", "State ID", "National ID"] },
      { key: "idNumber", label: "ID Number" },
      { key: "countryOfIssuance", label: "Country of Issuance" },
      { key: "issueDate", label: "Issue Date", type: "date" },
      { key: "expirationDate", label: "Expiration Date", type: "date" },
    ],
  },
  "Income Details": {
    step: "income",
    fields: [
      { key: "annualIncome", label: "Annual Income", type: "select", options: ["Under $25,000", "$25,000 - $50,000", "$50,000 - $100,000", "$100,000 - $200,000", "$200,000 - $500,000", "Over $500,000"] },
      { key: "netWorth", label: "Net Worth", type: "select", options: ["Under $50,000", "$50,000 - $100,000", "$100,000 - $500,000", "$500,000 - $1,000,000", "Over $1,000,000"] },
      { key: "liquidNetWorth", label: "Liquid Net Worth", type: "select", options: ["Under $25,000", "$25,000 - $50,000", "$50,000 - $100,000", "$100,000 - $500,000", "Over $500,000"] },
      { key: "taxRate", label: "Tax Rate Bracket" },
    ],
  },
  "Risk Tolerance": {
    step: "riskTolerance",
    fields: [
      { key: "riskTolerance", label: "Risk Tolerance", type: "select", options: ["Conservative", "Moderate", "Aggressive", "Speculative"] },
    ],
  },
  "Financial Situation": {
    step: "financialSituation",
    fields: [
      { key: "annualExpense", label: "Annual Expenses" },
      { key: "specialExpense", label: "Special Expenses" },
      { key: "liquidityNeeds", label: "Liquidity Needs", type: "select", options: ["Very Important", "Somewhat Important", "Not Important"] },
      { key: "investmentTimeHorizon", label: "Time Horizon", type: "select", options: ["Short-term (< 3 years)", "Medium-term (3-10 years)", "Long-term (> 10 years)"] },
    ],
  },
  "Investment Experience": {
    step: "investmentExperience",
    fields: [
      { key: "experienceNotes", label: "Additional Notes on Investment Experience", type: "textarea" },
    ],
  },
  "ID Proof Upload": {
    step: "idProofUpload",
    fields: [],
  },
  "Funding Details": {
    step: "fundingDetails",
    fields: [
      { key: "bankName", label: "Bank Name" },
      { key: "abaSwift", label: "ABA/SWIFT Code" },
      { key: "accountName", label: "Account Name" },
      { key: "accountNumber", label: "Account Number" },
      { key: "accountType", label: "Account Type", type: "select", options: ["Checking", "Savings"] },
    ],
  },
  "Disclosures": {
    step: "disclosures",
    fields: [
      { key: "taxWithholding", label: "Tax Withholding", type: "select", options: ["Yes", "No"] },
      { key: "initialDeposit", label: "Initial Deposit Amount" },
    ],
  },
  "Signatures": {
    step: "signatures",
    fields: [
      { key: "signatureName", label: "Full Name Signature" },
    ],
  },
};

export default function KycResubmit() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitFields, setResubmitFields] = useState<string[]>([]);
  const [resubmitReason, setResubmitReason] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [existingData, setExistingData] = useState<Record<string, Record<string, unknown>>>({});

  const email = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("signupEmail") ?? "" : "";

  useEffect(() => {
    if (!email) { navigate("/login"); return; }
    const base = getApiBase();

    Promise.all([
      fetch(`${base}/api/user/kyc-status/${encodeURIComponent(email)}`).then((r) => r.json()),
      fetch(`${base}/api/signup/get-progress?email=${encodeURIComponent(email)}`).then((r) => r.json()),
    ]).then(([statusData, progressData]) => {
      if (statusData.status !== "resubmit_required" && statusData.status !== "resubmit") {
        if (statusData.status === "reviewing") { navigate("/kyc/reviewing"); return; }
        if (statusData.status === "approved") { navigate("/dashboard"); return; }
        navigate("/application-pending");
        return;
      }
      setResubmitFields(statusData.resubmitFields ?? []);
      setResubmitReason(statusData.resubmitReason ?? statusData.resubmitNote ?? "");
      
      const steps = (progressData.steps ?? {}) as Record<string, Record<string, unknown>>;
      setExistingData(steps);

      const initial: Record<string, Record<string, string>> = {};
      for (const fieldName of (statusData.resubmitFields ?? []) as string[]) {
        const mapping = FIELD_TO_STEP[fieldName];
        if (!mapping) continue;
        const stepName = mapping.step;
        const stepData = steps[stepName] ?? {};
        initial[stepName] = {};
        for (const f of mapping.fields) {
          initial[stepName]![f.key] = String(stepData[f.key] ?? "");
        }
      }
      setFormData(initial);
      setLoading(false);
    }).catch(() => {
      navigate("/application-pending");
    });
  }, [email]);

  const handleFieldChange = (step: string, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [step]: { ...(prev[step] ?? {}), [key]: value },
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const base = getApiBase();
      const mergedData: Record<string, Record<string, unknown>> = {};
      for (const [step, fields] of Object.entries(formData)) {
        mergedData[step] = { ...(existingData[step] ?? {}), ...fields };
      }

      const res = await fetch(`${base}/api/user/kyc-resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, data: mergedData }),
      });
      if (res.ok) {
        navigate("/kyc/reviewing");
      } else {
        const body = await res.json().catch(() => ({}));
        alert((body as Record<string, string>).error ?? "Submission failed. Please try again.");
        setSubmitting(false);
      }
    } catch {
      alert("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f4f4f4" }}>
        <img src={spinnerImg} alt="Loading" className="spinner-img-rotate" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4f4f4" }}>
      <div className="flex items-center justify-end px-4 sm:px-6 py-1.5" style={{ background: "#5baad4" }}>
        <a href="tel:8449631512" className="flex items-center gap-1.5 text-white font-semibold" style={{ fontSize: "13px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.49 15.49 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C9.61 21 3 14.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57-.11.35-.02.74-.25 1.02l-2.2 2.2z"/></svg>
          844-963-1512
        </a>
      </div>

      <nav style={{ background: "#1c2e3e" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 h-[54px]">
          <Link href="/"><img src={guardianLogo} alt="Guardian Trading" style={{ height: "34px", width: "auto" }} /></Link>
          <button
            onClick={() => { sessionStorage.removeItem("signupEmail"); navigate("/login"); }}
            className="text-white font-medium px-4 sm:px-5 py-1.5 border hover:bg-white/10"
            style={{ fontSize: "13px", borderColor: "#5baad4", borderRadius: "3px" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-8">
        <div className="bg-white max-w-2xl mx-auto" style={{ borderRadius: "3px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9" }}>
          <div className="px-5 sm:px-8 pt-5 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p style={{ fontSize: "17px", color: "#e67e22", fontWeight: 700 }}>Action Required — Information Correction</p>
            </div>
          </div>

          {resubmitReason && (
            <div className="mx-5 sm:mx-8 mt-5" style={{ padding: "14px 18px", background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: "4px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#6D4C00", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason for Resubmission</p>
              <p style={{ fontSize: "14px", color: "#5D4037", lineHeight: 1.6 }}>{resubmitReason}</p>
            </div>
          )}

          <div className="px-5 sm:px-8 py-6">
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "24px", lineHeight: 1.6 }}>
              Our compliance team has reviewed your application and requires corrections to the following sections. Please update the fields below and resubmit for review.
            </p>

            {resubmitFields.map((fieldName) => {
              const mapping = FIELD_TO_STEP[fieldName];
              if (!mapping || mapping.fields.length === 0) {
                return (
                  <div key={fieldName} style={{ marginBottom: "24px", padding: "16px", background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: "4px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#333", marginBottom: "8px" }}>{fieldName}</h3>
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      {fieldName === "ID Proof Upload" 
                        ? "Please re-upload your identification documents through the onboarding flow."
                        : "Please review and correct this section."}
                    </p>
                  </div>
                );
              }

              return (
                <div key={fieldName} style={{ marginBottom: "24px", padding: "16px", background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: "4px", borderLeft: "4px solid #3a7bd5" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#333", marginBottom: "16px" }}>{fieldName}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "14px" }}>
                    {mapping.fields.map((f) => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#555", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {f.label}
                        </label>
                        {f.type === "select" && f.options ? (
                          <select
                            value={formData[mapping.step]?.[f.key] ?? ""}
                            onChange={(e) => handleFieldChange(mapping.step, f.key, e.target.value)}
                            style={{
                              width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB",
                              borderRadius: "4px", fontSize: "13px", color: "#333",
                              background: "white", outline: "none",
                            }}
                          >
                            <option value="">Select...</option>
                            {f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            value={formData[mapping.step]?.[f.key] ?? ""}
                            onChange={(e) => handleFieldChange(mapping.step, f.key, e.target.value)}
                            rows={3}
                            style={{
                              width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB",
                              borderRadius: "4px", fontSize: "13px", color: "#333",
                              resize: "vertical", outline: "none",
                            }}
                          />
                        ) : (
                          <input
                            type={f.type ?? "text"}
                            value={formData[mapping.step]?.[f.key] ?? ""}
                            onChange={(e) => handleFieldChange(mapping.step, f.key, e.target.value)}
                            style={{
                              width: "100%", padding: "8px 10px", border: "1px solid #D1D5DB",
                              borderRadius: "4px", fontSize: "13px", color: "#333",
                              outline: "none",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "12px 40px", fontSize: "14px", fontWeight: 700,
                  color: "white", background: submitting ? "#999" : "#3a7bd5",
                  border: "none", borderRadius: "4px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  minWidth: "200px",
                }}
              >
                {submitting ? "Submitting..." : "Submit Corrections"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
