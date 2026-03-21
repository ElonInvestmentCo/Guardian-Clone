import { useState } from "react";
import { useLocation } from "wouter";
import { saveSignupStep } from "@/lib/saveStep";
import OnboardingShell from "@/components/OnboardingShell";

type YNVal = "yes" | "no" | "";

function YesNo({ value, onChange }: { value: YNVal; onChange: (v: YNVal) => void }) {
  return (
    <div className="flex items-center gap-5 mt-1.5">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={value === "yes"} onChange={() => onChange("yes")} style={{ accentColor: "#3a7bd5" }} />
        <span style={{ fontSize: "12px", color: "#555" }}>Yes</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input type="radio" checked={value === "no"} onChange={() => onChange("no")} style={{ accentColor: "#3a7bd5" }} />
        <span style={{ fontSize: "12px", color: "#555" }}>No</span>
      </label>
    </div>
  );
}

export default function Disclosures() {
  const [, navigate] = useLocation();
  const [wantsMargin, setWantsMargin] = useState<YNVal>("no");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [q1, setQ1] = useState<YNVal>("");
  const [q2, setQ2] = useState<YNVal>("");
  const [q3, setQ3] = useState<YNVal>("");
  const [q4, setQ4] = useState<YNVal>("");
  const [q5, setQ5] = useState<YNVal>("");
  const [q6, setQ6] = useState<YNVal>("");
  const [q7, setQ7] = useState<YNVal>("");
  const [q8, setQ8] = useState<YNVal>("");
  const [q9, setQ9] = useState<YNVal>("");
  const [q10, setQ10] = useState<YNVal>("");
  const [taxWithholding, setTaxWithholding] = useState<"not_subject" | "subject" | "non_resident">("not_subject");
  const [partnershipCheck, setPartnershipCheck] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSignupStep("disclosures", { wantsMargin, initialDeposit, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, taxWithholding, partnershipCheck });
    navigate("/signatures");
  };

  const qStyle: React.CSSProperties = { fontSize: "12px", color: "#555", lineHeight: "1.55", marginBottom: "2px" };
  const blockStyle: React.CSSProperties = { marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #eef1f4" };

  return (
    <OnboardingShell currentStep={10}>
      <div className="bg-white" style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}>

        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>Disclosures</h1>
        </div>

        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-5">
              <p className="font-semibold mb-2" style={{ fontSize: "13px", color: "#333" }}>Borrowing Money to Buy Securities (Buying 'on Margin'). (Please read carefully)</p>
              <p style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "10px" }}>You choose to have a 'margin loan account' (commonly known as 'margin account') by checking the boxes below. To help you decide whether a margin loan account is right for you, please read the information below and the client agreement.</p>
              <p style={qStyle}>You wish to borrow funds in my account and would like to open a margin account: I have read the client agreement and disclosures understand my right and obligation under it. *</p>
              <YesNo value={wantsMargin} onChange={setWantsMargin} />
            </div>

            <div className="mb-5 p-3" style={{ background: "#fafbfc", border: "1px solid #e8edf2", borderRadius: "2px" }}>
              <p style={{ fontSize: "11.5px", color: "#666", lineHeight: "1.6" }}>
                <strong>Please Note:</strong> Please Day trading accounts are only offered to an account that maintains balance greater than $25,000. Therefore, Guardian requires an Initial deposit for such accounts of at least $30,000.
              </p>
            </div>

            <div style={blockStyle}>
              <p style={qStyle}>Please state your approximate initial deposit: *</p>
              <input type="text" value={initialDeposit} onChange={(e) => setInitialDeposit(e.target.value)} style={{ marginTop: "6px", width: "100%", maxWidth: "360px", padding: "7px 10px", fontSize: "13px", border: "1px solid #ccd3da", borderRadius: "2px", color: "#444" }} />
            </div>

            {[
              { q: "Do you currently maintain an account at Guardian in which you have control, beneficial interest, or trading authority? *", val: q1, set: setQ1 },
              { q: "Do you have a relationship with an entity that currently maintains an account at Guardian, such as employee, officer, shareholder, member, partner or owner? *", val: q2, set: setQ2 },
              { q: "Are either you or an immediate family member an officer, director or at least a 10% shareholder in a publicly traded company? *", val: q3, set: setQ3 },
              { q: "Are either you or an immediate family member employed by FINRA, a registered broker dealer or a securities exchange? *", val: q4, set: setQ4 },
              { q: "Are you a senior officer of a bank, savings and loan institution, investment company, investment advisory firm, or other financial institution? *", val: q5, set: setQ5 },
              { q: "Are either you or an immediate relative or family member a senior political figure? *", val: q6, set: setQ6 },
            ].map(({ q, val, set }, idx) => (
              <div key={idx} style={blockStyle}>
                <p style={qStyle}>{q}</p>
                <YesNo value={val} onChange={set} />
              </div>
            ))}

            <div style={blockStyle}>
              <p style={qStyle}>Have you read, reviewed, and agree to the 'Guardian Addendum to Customer Agreement fee Testing' form? <a href="#" style={{ color: "#3a7bd5", textDecoration: "underline" }}>View</a></p>
              <YesNo value={q7} onChange={setQ7} />
            </div>

            {[
              { q: "If you are opening a day trading account with Guardian Trading, do you have $25,000 in available investment capital? *", val: q8, set: setQ8 },
              { q: "Does your sole objective with this account involve high risk? *", val: q9, set: setQ9 },
              { q: "Are you able to withstand losing more or all of your investment in your Guardian Trading account? *", val: q10, set: setQ10 },
            ].map(({ q, val, set }, idx) => (
              <div key={idx} style={blockStyle}>
                <p style={qStyle}>{q}</p>
                <YesNo value={val} onChange={set} />
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
                    <li>The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me), and</li>
                    <li>I am not subject to backup withholding, or
                      <ol type="a" style={{ paddingLeft: "18px", marginTop: "4px" }}>
                        <li>I am exempt from backup withholding, or</li>
                        <li>I have not been notified by the Internal Revenue Service (IRS) that I am subject to backup withholding as a result of failure to report all interest or dividends, or</li>
                      </ol>
                      <p style={{ marginTop: "4px" }}>The IRS has notified me that I am no longer subject to backup withholding</p>
                    </li>
                    <li>I am a U.S. citizen or other U.S. person (defined below), and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ol>
                </div>
              </label>

              <label className="flex gap-2 mb-3 cursor-pointer">
                <input type="radio" name="taxWithholding" checked={taxWithholding === "subject"} onChange={() => setTaxWithholding("subject")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <div>
                  <p style={{ fontSize: "12px", color: "#444", fontWeight: 600, marginBottom: "6px" }}>Subject to Backup Withholding</p>
                  <ol style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.7", paddingLeft: "18px" }}>
                    <li>The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me), and</li>
                    <li>I am a U.S. citizen or other U.S. person (defined below), and</li>
                    <li>The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.</li>
                  </ol>
                </div>
              </label>

              <label className="flex gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={partnershipCheck} onChange={(e) => setPartnershipCheck(e.target.checked)} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>Check this box if you are a partnership (including an LLC classified as a partnership for U.S. federal tax purposes) trust, or estate that has any foreign partners, owners, or beneficiaries, and you are providing this form to a partnership, trust, or estate. You must check this box if you receive a Form W-8 (or documentary evidence) from any partner, owner, or beneficiary establishing foreign status or if you receive a Form W-9 from any partner, owner, or beneficiary that has checked this box. Note a partnership that provides a Form W-9 and checks this box may be required to complete Schedules K-2 and K-3 (Form 1065). For more information, see the Partnership Instructions for Schedules K-2 and K-3 (Form 1065).</p>
              </label>

              <label className="flex gap-2 cursor-pointer">
                <input type="radio" name="taxWithholding" checked={taxWithholding === "non_resident"} onChange={() => setTaxWithholding("non_resident")} style={{ marginTop: "2px", flexShrink: 0, accentColor: "#3a7bd5" }} />
                <p style={{ fontSize: "11.5px", color: "#555", lineHeight: "1.65" }}>Non Residence Alien: I certify that I am not a U.S resident alien or other U.S. person for U.S. tax purpose and I am submitting the applicable Form W-8 with this Application to certify my foreign status and if applicable, claim tax treaty benefits.</p>
              </label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate("/funding-details")} className="font-medium hover:bg-gray-50" style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}>Previous</button>
              <button type="submit" className="text-white font-semibold hover:opacity-90" style={{ background: "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: "pointer", fontSize: "13px" }}>Next</button>
            </div>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
