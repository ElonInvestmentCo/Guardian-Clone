import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalSchema } from "@/lib/onboarding/schema";
import { saveStep } from "@/lib/onboarding/saveStep";
import { CITIES_BY_STATE } from "@/lib/location/cities";
import { useLocation } from "wouter";

type FormData = any;

export default function PersonalDetails() {
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(personalSchema),
    mode: "onChange",
  });

  const form = watch();
  const state = watch("state");

  const [citySearch, setCitySearch] = useState("");

  const cities = useMemo(() => {
    return (CITIES_BY_STATE[state] || []).filter((c) =>
      c.toLowerCase().includes(citySearch.toLowerCase()),
    );
  }, [state, citySearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      saveStep("personal", form);
    }, 600);

    return () => clearTimeout(t);
  }, [form]);

  const onSubmit = async (data: FormData) => {
    await saveStep("personal", data);
    navigate("/professional-details");
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#111827]">
            Personal details
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            This helps us verify your identity and personalize your account.
          </p>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5"
        >
          {/* NAME */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="First name"
              error={errors.firstName}
              {...register("firstName")}
            />
            <Field
              label="Last name"
              error={errors.lastName}
              {...register("lastName")}
            />
          </div>

          {/* ADDRESS */}
          <Field
            label="Address"
            error={errors.address}
            {...register("address")}
          />

          <Field label="Apt / Suite (optional)" {...register("aptSuite")} />

          {/* LOCATION GRID */}
          <div className="grid grid-cols-3 gap-4">
            <Select label="State" {...register("state")} />

            {/* CITY SEARCH */}
            <div>
              <label className="text-xs text-gray-600">City</label>

              <input
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10"
              />

              <select
                {...register("city")}
                className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <Field
              label="ZIP code"
              error={errors.zipCode}
              {...register("zipCode")}
            />
          </div>

          {/* PHONE */}
          <Field
            label="Phone number"
            error={errors.phoneNumber}
            {...register("phoneNumber")}
          />

          {/* ERROR SUMMARY */}
          {Object.keys(errors).length > 0 && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-100 p-3 rounded-md">
              Please fix the highlighted fields to continue.
            </div>
          )}

          {/* CTA */}
          <button
            disabled={!isValid}
            className="w-full mt-2 bg-black text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- FIELD ---------------- */

function Field({ label, error, ...props }: any) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        {...props}
        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}

/* ---------------- SELECT ---------------- */

function Select({ label, ...props }: any) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <select
        {...props}
        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <option value="">Select</option>
      </select>
    </div>
  );
}
