import { useState } from "react";
import { useLocation } from "wouter";
import { HelpCircle } from "lucide-react";
import { ApplicationLayout, FormField, TextInput, SelectInput } from "@/components/ApplicationLayout";

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

export default function PersonalDetails() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    aptSuite: "",
    country: "United States",
    city: "",
    state: "",
    zipCode: "",
    mailingDifferent: false,
    phoneNumber: "",
    numDependents: "",
    altPhoneNumber: "",
    maritalStatus: "",
    trustedContact: "",
  });

  const set = (key: keyof typeof form) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/professional-details");
  };

  return (
    <ApplicationLayout>
      <h1 className="text-xl font-semibold text-[#4a7fbd] mb-5">Personal Details</h1>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="First Name" required>
          <TextInput value={form.firstName} onChange={set("firstName")} />
        </FormField>

        <FormField label="Last Name" required>
          <TextInput value={form.lastName} onChange={set("lastName")} />
        </FormField>

        <FormField label="Address" required>
          <TextInput value={form.address} onChange={set("address")} />
        </FormField>

        <FormField label="Apt/Suite">
          <TextInput value={form.aptSuite} onChange={set("aptSuite")} />
        </FormField>

        <FormField label="Country" required>
          <SelectInput
            value={form.country}
            onChange={set("country") as (v: string) => void}
            options={COUNTRIES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="City" required>
          <SelectInput
            value={form.city}
            onChange={set("city") as (v: string) => void}
            options={["Please Select"]}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="State/Province" required>
          <SelectInput
            value={form.state}
            onChange={set("state") as (v: string) => void}
            options={US_STATES}
            placeholder="Please Select"
          />
        </FormField>

        <FormField label="Zip Code" required>
          <TextInput value={form.zipCode} onChange={set("zipCode")} />
        </FormField>

        {/* Mailing Address Checkbox */}
        <div className="mb-3 flex items-center gap-2">
          <input
            id="mailing-different"
            type="checkbox"
            checked={form.mailingDifferent}
            onChange={(e) => set("mailingDifferent")(e.target.checked)}
            className="w-4 h-4 border-gray-300 accent-[#4a7fbd]"
          />
          <label htmlFor="mailing-different" className="text-xs text-gray-600">
            Mailing Address (If Different)
          </label>
        </div>

        {/* Phone Number */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            <div className="flex items-center border-b border-gray-300 flex-1 pb-0">
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

        <FormField label="Number Of Dependents" required>
          <TextInput value={form.numDependents} onChange={set("numDependents")} />
        </FormField>

        {/* Alternate Phone */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-1">Alternate Phone Number</label>
          <div className="flex items-center gap-1">
            <div className="flex items-center border-b border-gray-300 flex-1 pb-0">
              <span className="text-sm text-gray-500 pr-1 py-2 whitespace-nowrap">+1</span>
              <input
                type="tel"
                placeholder="(___) ___-____"
                value={form.altPhoneNumber}
                onChange={(e) => set("altPhoneNumber")(e.target.value)}
                className="flex-1 py-2 border-0 text-sm text-gray-700 bg-transparent focus:outline-none placeholder-gray-400"
              />
            </div>
            <HelpCircle className="w-4 h-4 text-[#4a7fbd] flex-shrink-0 ml-1" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 leading-tight">
            Phone numbers are checked for validity in the country that you are applying
          </p>
        </div>

        {/* Marital Status */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-2">
            Are You <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {["Single", "Married", "Divorced", "Widowed"].map((status) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="maritalStatus"
                  value={status}
                  checked={form.maritalStatus === status}
                  onChange={() => set("maritalStatus")(status)}
                  className="w-4 h-4 accent-[#4a7fbd]"
                />
                <span className="text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Trusted Contact */}
        <div className="mb-5">
          <label className="block text-xs text-gray-600 mb-2">
            Would you like to add a Trusted Contact Person <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="trustedContact"
                  value={opt}
                  checked={form.trustedContact === opt}
                  onChange={() => set("trustedContact")(opt)}
                  className="w-4 h-4 accent-[#4a7fbd]"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-36 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold text-sm rounded transition-colors"
        >
          Next
        </button>
      </form>
    </ApplicationLayout>
  );
}
