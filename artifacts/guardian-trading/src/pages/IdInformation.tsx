import { useState } from "react";
import { useLocation } from "wouter";
import { ApplicationLayout, FormField, TextInput, SelectInput } from "@/components/ApplicationLayout";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Other"];
const TAX_ID_TYPES = ["SSN", "EIN", "Foreign ID"];
const ID_TYPES = ["Passport", "Driver's License", "State ID", "Military ID"];
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export default function IdInformation() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    taxResidenceCountry: "United States",
    foreignIdType: "",
    taxIdType: "",
    dateOfBirth: "",
    taxId: "",
    idType: "",
    idNumber: "",
    issuingState: "",
    countryOfIssuance: "",
    issueDate: "",
    expirationDate: "",
  });

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <ApplicationLayout>
      {/* Title */}
      <h1 className="text-lg font-bold text-[#4a7fbd] mb-0.5 uppercase tracking-wide">
        ID Information
      </h1>
      <p className="text-[10px] font-semibold text-[#4a7fbd] uppercase tracking-wide mb-4 leading-tight">
        Important Information About Procedures For Opening A New Account USA Patriot Act Information
      </p>

      {/* Legal text */}
      <p className="text-[11px] text-gray-500 leading-relaxed mb-5">
        To help the government fight the funding of terrorism and money-laundering activities, Federal
        law requires all financial institutions to obtain your name, date of birth, address, and a
        government-issued identification number before opening your account. In certain circumstances,
        Guardian may obtain and verify this information with respect to any person(s) authorized to effect
        transactions in an account. For certain entities, such as trusts, estates, corporations,
        partnerships, or other organizations, identifying documentation is also required. Your account may
        be restricted and/or closed if Guardian cannot verify this information. Guardian will not be
        responsible for any losses or damage (including but not limited to lost opportunities) resulting
        from your failure to provide this information, or from any restriction placed upon, or closing of,
        your account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Country of Tax Residence" required>
          <SelectInput
            value={form.taxResidenceCountry}
            onChange={set("taxResidenceCountry")}
            options={COUNTRIES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Foreign ID Type">
          <TextInput value={form.foreignIdType} onChange={set("foreignIdType")} />
        </FormField>

        <FormField label="Tax ID Type" required>
          <SelectInput
            value={form.taxIdType}
            onChange={set("taxIdType")}
            options={TAX_ID_TYPES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Date of Birth" required>
          <TextInput
            value={form.dateOfBirth}
            onChange={set("dateOfBirth")}
            placeholder="MM/DD/YYYY"
          />
        </FormField>

        <FormField label="Tax ID (SSN / EIN / Foreign ID)" required>
          <TextInput value={form.taxId} onChange={set("taxId")} />
        </FormField>

        {/* Section header */}
        <p className="text-sm font-semibold text-gray-700 mt-5 mb-3 border-t border-gray-100 pt-4">
          Valid Government Issued Photo ID
        </p>

        <FormField label="ID Type" required>
          <SelectInput
            value={form.idType}
            onChange={set("idType")}
            options={ID_TYPES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="ID Number" required>
          <TextInput value={form.idNumber} onChange={set("idNumber")} />
        </FormField>

        <FormField label="Issuing State" required>
          <SelectInput
            value={form.issuingState}
            onChange={set("issuingState")}
            options={US_STATES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Country of Issuance" required>
          <SelectInput
            value={form.countryOfIssuance}
            onChange={set("countryOfIssuance")}
            options={COUNTRIES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Issue Date" required>
          <TextInput
            value={form.issueDate}
            onChange={set("issueDate")}
            placeholder="MM/DD/YYYY"
          />
        </FormField>

        <FormField label="Expiration Date" required>
          <TextInput
            value={form.expirationDate}
            onChange={set("expirationDate")}
            placeholder="MM/DD/YYYY"
          />
        </FormField>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => navigate("/professional-details")}
            className="w-28 py-2.5 border border-gray-300 text-gray-600 font-semibold text-sm rounded hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            type="submit"
            className="w-36 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold text-sm rounded transition-colors"
          >
            Next
          </button>
        </div>
      </form>
    </ApplicationLayout>
  );
}
