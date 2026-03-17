import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

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
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Blue top border stripe */}
          <div className="h-1.5 bg-blue-500 w-full" />

          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <Link
              href="/login"
              className="text-blue-500 hover:text-blue-600 transition-colors mr-4 flex-shrink-0"
              data-testid="link-back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-semibold text-blue-600 flex-1 text-center pr-10">
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
                  className="mt-4 inline-block text-sm text-blue-500 hover:underline"
                  data-testid="link-back-to-login"
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
                    className="w-full px-4 py-3 bg-gray-100 border-0 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm"
                    data-testid="input-email"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-500" data-testid="error-email">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition-colors disabled:opacity-70 text-sm"
                    data-testid="button-submit"
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
