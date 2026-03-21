import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalSchema } from "@/lib/onboarding/schema";
import { useOnboardingStep } from "@/lib/onboarding/useOnboardingStep";
import { CITIES_BY_STATE, US_STATES } from "@/lib/location/cities";
import OnboardingShell from "@/components/OnboardingShell";

type FormData = {
  firstName: string;
  lastName: string;
  address: string;
  aptSuite?: string;
  state: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
};

const fieldStyle: React.CSSProperties = {
  background: "#e8edf2",
  border: "1px solid #ccd3da",
  borderRadius: "3px",
  padding: "9px 10px",
  color: "#333",
  fontSize: "13px",
  width: "100%",
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1" style={{ fontSize: "12px", color: "#555" }}>
      {children}{required && <span style={{ color: "#e53e3e" }}> *</span>}
    </label>
  );
}

export default function PersonalDetails() {
  const { savedData, submit, goBack, isSubmitting, validationErrors, globalError } =
    useOnboardingStep(1);

  const [citySearch, setCitySearch] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(personalSchema),
    mode: "onChange",
    defaultValues: {
      firstName:   (savedData.firstName   as string) ?? "",
      lastName:    (savedData.lastName    as string) ?? "",
      address:     (savedData.address     as string) ?? "",
      aptSuite:    (savedData.aptSuite    as string) ?? "",
      state:       (savedData.state       as string) ?? "",
      city:        (savedData.city        as string) ?? "",
      zipCode:     (savedData.zipCode     as string) ?? "",
      phoneNumber: (savedData.phoneNumber as string) ?? "",
    },
  });

  const selectedState = watch("state");

  const cities = useMemo(() => {
    const stateCities = CITIES_BY_STATE[selectedState] ?? [];
    return stateCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));
  }, [selectedState, citySearch]);

  const onSubmit = async (data: FormData) => {
    await submit(data as Record<string, unknown>);
  };

  return (
    <OnboardingShell currentStep={1}>
      <div
        className="bg-white"
        style={{ borderRadius: "2px", boxShadow: "0 1px 6px rgba(0,0,0,0.10)", border: "1px solid #dde3e9", borderLeft: "4px solid #3a7bd5" }}
      >
        <div className="px-8 pt-6 pb-4" style={{ borderBottom: "1px solid #e8edf2" }}>
          <h1 className="font-bold uppercase" style={{ color: "#3a7bd5", fontSize: "18px", letterSpacing: "0.04em" }}>
            Personal Details
          </h1>
        </div>

        <div className="px-8 py-6">
          {globalError && (
            <div className="mb-4 px-4 py-2 rounded text-sm" style={{ background: "#fff3f3", border: "1px solid #f5c6c6", color: "#c0392b" }}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            <div className="grid grid-cols-2 gap-5 mb-4">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <input {...register("firstName")} style={fieldStyle} className="focus:outline-none" />
                {errors.firstName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.firstName.message}</p>}
                {validationErrors.firstName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{validationErrors.firstName}</p>}
              </div>
              <div>
                <FieldLabel required>Last Name</FieldLabel>
                <input {...register("lastName")} style={fieldStyle} className="focus:outline-none" />
                {errors.lastName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.lastName.message}</p>}
                {validationErrors.lastName && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{validationErrors.lastName}</p>}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel required>Address</FieldLabel>
              <input {...register("address")} style={fieldStyle} className="focus:outline-none" />
              {errors.address && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.address.message}</p>}
            </div>

            <div className="mb-4">
              <FieldLabel>Apt / Suite (optional)</FieldLabel>
              <input {...register("aptSuite")} style={fieldStyle} className="focus:outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-5 mb-4">
              <div>
                <FieldLabel required>State</FieldLabel>
                <div className="relative">
                  <select {...register("state")} style={{ ...fieldStyle, appearance: "none", paddingRight: "28px", cursor: "pointer" }} className="focus:outline-none">
                    <option value="">Please Select</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.state && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.state.message}</p>}
              </div>

              <div>
                <FieldLabel required>City</FieldLabel>
                <input placeholder="Search city…" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} style={{ ...fieldStyle, marginBottom: "6px" }} className="focus:outline-none" />
                <div className="relative">
                  <select {...register("city")} style={{ ...fieldStyle, appearance: "none", paddingRight: "28px", cursor: "pointer" }} className="focus:outline-none">
                    <option value="">Select city</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#777" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
                {errors.city && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.city.message}</p>}
              </div>

              <div>
                <FieldLabel required>ZIP Code</FieldLabel>
                <input {...register("zipCode")} style={fieldStyle} className="focus:outline-none" placeholder="12345" />
                {errors.zipCode && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.zipCode.message}</p>}
              </div>
            </div>

            <div className="mb-6" style={{ maxWidth: "50%" }}>
              <FieldLabel required>Phone Number</FieldLabel>
              <input {...register("phoneNumber")} style={fieldStyle} className="focus:outline-none" placeholder="(555) 000-0000" />
              {errors.phoneNumber && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{errors.phoneNumber.message}</p>}
              {validationErrors.phoneNumber && <p className="mt-1 text-xs" style={{ color: "#e53e3e" }}>{validationErrors.phoneNumber}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="font-medium hover:bg-gray-50 transition-colors"
                style={{ padding: "9px 28px", border: "1px solid #ccd3da", borderRadius: "3px", background: "white", fontSize: "13px", color: "#555", cursor: "pointer" }}
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-white font-semibold transition-opacity hover:opacity-90"
                style={{ background: isSubmitting ? "#8ab4e8" : "#3a7bd5", borderRadius: "3px", padding: "9px 28px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "13px" }}
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
