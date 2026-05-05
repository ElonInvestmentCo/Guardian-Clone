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
        backgroundColor: "#ffffff",
        backgroundImage: "url(/assets/bgLogin.png)",
        backgroundRepeat: "repeat",
      }}
    >
      <div
        style={{
          width: "252px",
          border: "1px solid #888888",
          boxShadow: "2px 2px 5px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo section — white */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "0",
            lineHeight: 0,
          }}
        >
          <img
            src="/assets/icLogo_Login.png"
            alt="InteliClear Post Trade Solutions"
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* Form section — blue gradient */}
        <div
          style={{
            background: "linear-gradient(to bottom, #3099C9 0%, #99CCDD 65%, #C4E5F4 100%)",
            padding: "6px 0 14px 0",
          }}
        >
          <p
            style={{
              color: "#ffffff",
              textAlign: "center",
              fontSize: "13px",
              fontFamily: "Arial, sans-serif",
              margin: "4px 0 10px 0",
              padding: 0,
            }}
          >
            Log In
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <table
              style={{
                margin: "0 auto",
                borderCollapse: "separate",
                borderSpacing: "2px 6px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontFamily: "Arial, sans-serif",
                      textAlign: "right",
                      paddingRight: "4px",
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
                        width: "68px",
                        height: "17px",
                        fontSize: "11px",
                        fontFamily: "Arial, sans-serif",
                        border: "1px solid #666666",
                        padding: "0 2px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      color: "#ffffff",
                      fontSize: "12px",
                      fontFamily: "Arial, sans-serif",
                      textAlign: "right",
                      paddingRight: "4px",
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
                        width: "68px",
                        height: "17px",
                        fontSize: "11px",
                        fontFamily: "Arial, sans-serif",
                        border: "1px solid #666666",
                        padding: "0 2px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {errors.submit && (
              <p
                style={{
                  color: "#ffeeee",
                  textAlign: "center",
                  fontSize: "11px",
                  fontFamily: "Arial, sans-serif",
                  margin: "4px 6px 0",
                  padding: 0,
                }}
              >
                {errors.submit}
              </p>
            )}

            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  fontSize: "12px",
                  fontFamily: "Arial, sans-serif",
                  padding: "2px 14px",
                  cursor: loading ? "default" : "pointer",
                  backgroundColor: "#ece9d8",
                  border: "2px solid",
                  borderColor: "#ffffff #808080 #808080 #ffffff",
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
