import { useState } from "react";
import { useLocation } from "wouter";
import { getApiBase } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Required";
    if (!password) newErrors.password = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      if (res.ok) {
        const userEmail = (data as { email?: string }).email || email;
        sessionStorage.setItem("signupEmail", userEmail);
        try {
          const statusRes = await fetch(`${base}/api/user/me?email=${encodeURIComponent(userEmail)}`);
          const statusData = await statusRes.json() as { status?: string; kycComplete?: boolean; completedSteps?: number[] };
          if (statusData.status === "approved") {
            setLoading(false);
            navigate("/dashboard");
          } else if (statusData.status === "verified" || statusData.status === "pending") {
            if (statusData.kycComplete) {
              setLoading(false);
              navigate("/application-pending");
            } else {
              const completedSteps = statusData.completedSteps ?? [];
              const nextStep = completedSteps.length;
              const stepPaths = [
                "/general-details", "/personal-details", "/professional-details",
                "/id-information", "/income-details", "/risk-tolerance",
                "/financial-situation", "/investment-experience", "/id-proof-upload",
                "/funding-details", "/disclosures", "/signatures",
              ];
              setLoading(false);
              navigate(stepPaths[nextStep] ?? "/general-details");
            }
          } else if (statusData.status === "rejected") {
            setLoading(false);
            setErrors({ submit: "Your account application has been rejected. Please contact support." });
          } else if (statusData.status === "resubmit") {
            setLoading(false);
            navigate("/general-details");
          } else {
            setLoading(false);
            navigate("/general-details");
          }
        } catch {
          setLoading(false);
          setErrors({ submit: "Unable to verify account status. Please try again." });
        }
      } else {
        setLoading(false);
        setErrors({ submit: (data as { error?: string }).error || "Invalid credentials." });
      }
    } catch {
      setLoading(false);
      setErrors({ submit: "Unable to connect. Please try again." });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(/assets/bgLogin.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div
        style={{
          width: "380px",
          border: "1px solid #aaaaaa",
          boxShadow: "3px 3px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo section — white background */}
        <div style={{ backgroundColor: "#ffffff", lineHeight: 0, borderBottom: "1px solid #cccccc" }}>
          <img
            src="/assets/icLogo_Login.png"
            alt="InteliClear Post Trade Solutions"
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Form section — vivid blue gradient */}
        <div
          style={{
            background: "linear-gradient(to bottom, #3CB8EF 0%, #7DD4F5 35%, #C2EBFB 80%, #DAFAFF 100%)",
            padding: "8px 0 18px 0",
          }}
        >
          {/* "Log In" title */}
          <p
            style={{
              color: "#ffffff",
              textAlign: "center",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              margin: "6px 0 12px 0",
              padding: 0,
              textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            Log In
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <table
              style={{
                margin: "0 auto",
                borderCollapse: "separate",
                borderSpacing: "0 8px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      color: "#000066",
                      fontSize: "13px",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "bold",
                      textAlign: "right",
                      paddingRight: "6px",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    User Name:
                  </td>
                  <td style={{ verticalAlign: "middle" }}>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      style={{
                        width: "120px",
                        height: "20px",
                        fontSize: "12px",
                        fontFamily: "Arial, sans-serif",
                        border: "1px solid #888888",
                        padding: "0 3px",
                        boxSizing: "border-box",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      color: "#000066",
                      fontSize: "13px",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "bold",
                      textAlign: "right",
                      paddingRight: "6px",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    Password:
                  </td>
                  <td style={{ verticalAlign: "middle" }}>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      style={{
                        width: "120px",
                        height: "20px",
                        fontSize: "12px",
                        fontFamily: "Arial, sans-serif",
                        border: "1px solid #888888",
                        padding: "0 3px",
                        boxSizing: "border-box",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {errors.submit && (
              <p
                style={{
                  color: "#cc0000",
                  textAlign: "center",
                  fontSize: "11px",
                  fontFamily: "Arial, sans-serif",
                  margin: "6px 10px 0",
                  padding: 0,
                  fontWeight: "bold",
                }}
              >
                {errors.submit}
              </p>
            )}

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  fontSize: "13px",
                  fontFamily: "Arial, sans-serif",
                  padding: "3px 18px",
                  cursor: loading ? "default" : "pointer",
                  backgroundColor: "#ece9d8",
                  border: "2px solid",
                  borderTopColor: "#ffffff",
                  borderLeftColor: "#ffffff",
                  borderBottomColor: "#888888",
                  borderRightColor: "#888888",
                  color: "#000000",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
