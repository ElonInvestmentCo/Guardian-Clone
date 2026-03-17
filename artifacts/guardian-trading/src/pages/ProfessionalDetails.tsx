import { useState } from "react";
import { useLocation } from "wouter";
import { HelpCircle, Briefcase, User, Clock, Building2, GraduationCap } from "lucide-react";
import { ApplicationLayout, FormField, TextInput, SelectInput } from "@/components/ApplicationLayout";

const EMPLOYMENT_OPTIONS = [
  { key: "employed", label: "Employed", Icon: Briefcase },
  { key: "self-employed", label: "Self Employed", Icon: User },
  { key: "retired", label: "Retired", Icon: Clock },
  { key: "unemployed", label: "Unemployed", Icon: Building2 },
  { key: "student", label: "Student", Icon: GraduationCap },
];

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Other"];
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi",
  "Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico",
  "New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
];

export default function ProfessionalDetails() {
  const [, navigate] = useLocation();
  const [employment, setEmployment] = useState("employed");
  const [form, setForm] = useState({
    employerName: "",
    positionTitle: "",
    employerAddress: "",
    aptSuiteNo: "",
    country: "",
    city: "",
    state: "",
    yearsWithEmployer: "",
    phoneNumber: "",
  });

  const set = (key: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/id-information");
  };

  return (
    <ApplicationLayout>
      <h1 className="text-xl font-semibold text-[#4a7fbd] mb-1">Professional Details</h1>
      <p className="text-xs text-gray-500 mb-4">Are You Currently</p>

      {/* Employment type selector */}
      <div className="flex flex-col gap-2 mb-6">
        {EMPLOYMENT_OPTIONS.map(({ key, label, Icon }) => {
          const selected = employment === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setEmployment(key)}
              className={`w-full flex items-center justify-center gap-3 py-3 rounded text-sm font-medium transition-colors ${
                selected
                  ? "bg-[#4a7fbd] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Employer Name" required>
          <TextInput value={form.employerName} onChange={set("employerName")} />
        </FormField>

        <FormField label="Position/Title" required>
          <TextInput value={form.positionTitle} onChange={set("positionTitle")} />
        </FormField>

        <FormField label="Address Of Employer" required>
          <TextInput value={form.employerAddress} onChange={set("employerAddress")} />
        </FormField>

        <FormField label="Apt/Suite No">
          <TextInput value={form.aptSuiteNo} onChange={set("aptSuiteNo")} />
        </FormField>

        <FormField label="Country" required>
          <SelectInput
            value={form.country}
            onChange={set("country")}
            options={COUNTRIES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="City" required>
          <SelectInput
            value={form.city}
            onChange={set("city")}
            options={["Please Select"]}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="State/Province" required>
          <SelectInput
            value={form.state}
            onChange={set("state")}
            options={US_STATES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Year With Employer" required>
          <TextInput value={form.yearsWithEmployer} onChange={set("yearsWithEmployer")} />
        </FormField>

        {/* Phone Number */}
        <div className="mb-5">
          <label className="block text-xs text-gray-600 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            <div className="flex items-center border-b border-gray-300 flex-1">
              <span className="text-sm text-gray-500 pr-1 py-2 whitespace-nowrap">+1</span>
              <input
                type="tel"
                placeholder="(___) ___-____"
                value={form.phoneNumber}
                onChange={(e) => set("phoneNumber")(e.target.value)}
                className="flex-1 py-2 border-0 text-sm text-gray-700 bg-transparent focus:outline-none placeholder-gray-400"
              />
            </div>
            <HelpCircle className="w-4 h-4 text-[#4a7fbd] flex-shrink-0 ml-1" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">
            Phone numbers are checked for validity in the country that you are applying
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/personal-details")}
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
