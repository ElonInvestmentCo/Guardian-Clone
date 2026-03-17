import { useState } from "react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Blue top stripe */}
          <div className="h-[5px] bg-[#4a7fbd] w-full" />

          {/* Header */}
          <div className="flex items-center px-5 py-4 border-b border-gray-200">
            <Link
              href="/login"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4a7fbd] text-white flex-shrink-0 hover:bg-[#3d6fad] transition-colors"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-[#4a7fbd] flex-1 text-center pr-8">
              Forgot Password
            </h1>
          </div>

          <div className="px-8 py-6">
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  If an account exists for{" "}
                  <span className="font-semibold text-gray-900">{email}</span>, a password reset
                  link has been sent.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-block text-sm text-[#4a7fbd] hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="mb-5">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fbd]/40"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-500">{emailError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors disabled:opacity-70"
                  >
                    {loading ? "Sending..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
