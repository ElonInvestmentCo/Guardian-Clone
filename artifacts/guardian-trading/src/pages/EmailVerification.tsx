import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import guardianLogo from "@assets/IMG_7934_1773719077190.png";

export default function EmailVerification() {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [storedCode, setStoredCode] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const code = sessionStorage.getItem("verificationCode") || "";
    setStoredCode(code);
  }, []);

  const handleBack = () => {
    navigate("/signup");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setError("Please enter the verification code");
      return;
    }
    if (inputCode.trim() === storedCode) {
      sessionStorage.removeItem("verificationCode");
      navigate("/general-details");
    } else {
      setError("Invalid verification code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[340px]">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* Blue top stripe */}
          <div className="h-[5px] bg-[#4a7fbd] w-full" />

          {/* Header */}
          <div className="flex items-center px-5 py-4 border-b border-gray-200">
            <button
              onClick={handleBack}
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
            </button>
            <h1 className="text-xl font-semibold text-[#4a7fbd] flex-1 text-center pr-8">
              Email Authentication
            </h1>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Logo */}
            <div className="flex justify-center mb-7">
              <img
                src={guardianLogo}
                alt="Guardian Trading"
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Verification code display */}
            <div className="text-center mb-5">
              <span className="text-gray-600 text-lg font-medium tracking-wide">
                {storedCode}
              </span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Verification Code"
                  className="w-full px-3 py-3 bg-gray-100 text-gray-600 text-sm placeholder-gray-400 border-0 border-b-2 border-[#4a7fbd] focus:outline-none rounded-none"
                />
                {error && (
                  <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-10 py-2.5 bg-[#4a7fbd] hover:bg-[#3d6fad] text-white font-semibold rounded text-sm transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
