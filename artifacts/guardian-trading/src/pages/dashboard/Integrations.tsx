import DashboardLayout from "./DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle2 } from "lucide-react";

const BASE = "https://cdnimg.replit.com/images/bj34pdbp/migration/";
const Q = "?auto=format&q=75";

const CATEGORIES = [
  {
    id: "ai",
    label: "AI Services",
    description: "Large language models and AI inference APIs",
    integrations: [
      { name: "OpenAI",    icon: `${BASE}845a567b7905214602bee81880b6187c207fec6a-25x25.svg${Q}` },
      { name: "Anthropic", icon: `${BASE}b0999259c0e76439273d1658c38f1d8ad64fab44-24x18.svg${Q}` },
      { name: "Gemini",    icon: `${BASE}794e9a271d1fb11189a8ce5056956499c86f1e0b-22x22.svg${Q}` },
    ],
  },
  {
    id: "auth",
    label: "Authentication",
    description: "Identity, login and access management",
    integrations: [
      { name: "Clerk",    icon: `${BASE}5a6c1c4a517956592072ee1de41bdb951b40926d-22x22.svg${Q}` },
      { name: "Auth0",    icon: `${BASE}6d23ca05dccc17725decb66c66b7d1105098c75b-22x22.svg${Q}` },
      { name: "Firebase", icon: `${BASE}1885c0db37b05de72a16877765c3a5ad252c7675-19x22.svg${Q}` },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    description: "Email, SMS and notification delivery",
    integrations: [
      { name: "Twilio",   icon: `${BASE}9f468166ac81ab431ec8dda24a4ee77025ab453a-14x18.svg${Q}` },
      { name: "Resend",   icon: `${BASE}8fcc0ef2732b21e2cadc98ab02fea9db0c045445-21x22.svg${Q}` },
      { name: "Slack",    icon: `${BASE}36443eb8d94cb436599f9b434064e98a5e18e86a-19x22.svg${Q}` },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    description: "File storage, CDN and database backends",
    integrations: [
      { name: "AWS S3",      icon: `${BASE}7e64f8f5326c90928210471b8309d7cd55595fbf-22x16.svg${Q}` },
      { name: "Cloudinary",  icon: `${BASE}c8b89a395f1276002f12c830fc7ef7007e2aa711-22x23.svg${Q}` },
      { name: "Supabase",    icon: `${BASE}d3eff7e5aa74c4467fe4effade935d5b041de5f3-15x22.svg${Q}` },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Event tracking and product insights",
    integrations: [
      { name: "Google Analytics", icon: `${BASE}a597835a635a6da8287f4913a3b23a850c53b470-22x22.svg${Q}` },
      { name: "Mixpanel",         icon: `${BASE}62a36a7c401ff60ef8fd6f73bedf4ee6209f3333-19x22.svg${Q}` },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    description: "Project management and developer tools",
    integrations: [
      { name: "GitHub", icon: `${BASE}9633fe90ac3db2e71c7e4694404999dfc57112ac-24x21.svg${Q}` },
      { name: "Linear", icon: `${BASE}1ecd3b008934e7149f364f9f39e142ad0f2912c5-19x22.svg${Q}` },
      { name: "Notion", icon: `${BASE}c01f41965b7e8eb8b26d3ce3b2a5acb2e9d0c0c6-22x22.svg${Q}` },
    ],
  },
];

export default function Integrations() {
  const { colors } = useTheme();

  return (
    <DashboardLayout>
      <div style={{ padding: "28px 28px 40px", minHeight: "100%", background: colors.bg }}>

        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: colors.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>
            Integrations
          </h1>
          <p style={{ fontSize: "13px", color: colors.textMuted, marginTop: "4px" }}>
            Connect your Guardian Trading account to third-party services
          </p>
        </div>

        {/* Category grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Category header */}
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: colors.textPrimary, marginBottom: "2px" }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.4 }}>
                  {cat.description}
                </div>
              </div>

              {/* Integration rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {cat.integrations.map((intg) => (
                  <IntegrationRow key={intg.name} name={intg.name} icon={intg.icon} colors={colors} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function IntegrationRow({
  name,
  icon,
  colors,
}: {
  name: string;
  icon: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "10px",
        border: `1px solid ${colors.inputBorder}`,
        background: colors.inputBg,
        cursor: "default",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: colors.card,
          border: `1px solid ${colors.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <img
          src={icon}
          alt={name}
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Name */}
      <span style={{ fontSize: "13px", fontWeight: 500, color: colors.textPrimary, flex: 1 }}>
        {name}
      </span>

      {/* Connected badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#0ecb81",
          background: "rgba(14,203,129,0.08)",
          border: "1px solid rgba(14,203,129,0.2)",
          borderRadius: "20px",
          padding: "3px 9px",
          flexShrink: 0,
        }}
      >
        <CheckCircle2 size={11} />
        Connected
      </div>
    </div>
  );
}
