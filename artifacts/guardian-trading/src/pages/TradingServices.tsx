import { Layout } from "@/components/Layout";
import { Link } from "wouter";

const IMG_ORDER =
  "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-order-routing-174x174.png";
const IMG_LOCATES =
  "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-locates-borrows-174x174.png";
const IMG_PLATFORMS =
  "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-leading-platforms-174x174.png";

const OutlineBtn = ({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) => (
  <a
    href={href ?? "#"}
    className="group inline-block border text-white text-[13px] font-semibold px-5 py-[9px] tracking-wide transition-all duration-200 hover:bg-[#76d1f5] hover:text-[#0b0f14] hover:border-[#76d1f5]"
    style={{ borderColor: "#76d1f5" }}
  >
    {children}
  </a>
);

export default function TradingServices() {
  return (
    <Layout title="Trading Services | Guardian Trading">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          marginTop: "78px",
          backgroundColor: "#0b0f14",
          backgroundImage: `
            radial-gradient(circle at 85% 30%, rgba(118,209,245,0.04) 0%, transparent 55%),
            radial-gradient(circle at 90% 60%, rgba(118,209,245,0.03) 0%, transparent 40%)
          `,
        }}
      >
        {/* Dotted mesh pattern — top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(118,209,245,0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "radial-gradient(ellipse 55% 80% at 95% 20%, black 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 55% 80% at 95% 20%, black 0%, transparent 70%)",
            opacity: 0.55,
          }}
        />

        {/* "Trading Services" title */}
        <div className="relative z-10 flex items-center justify-center text-center pt-14 pb-10 px-4">
          <h1
            className="text-white font-bold tracking-tight"
            style={{ fontSize: "clamp(34px, 5vw, 46px)", fontWeight: 700 }}
          >
            Trading Services
          </h1>
        </div>

        {/* Icon + two-col brokerage intro */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 pb-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
          {/* Left: chart icon */}
          <div className="flex-shrink-0 lg:w-[240px] flex justify-start items-center">
            <div
              style={{
                filter:
                  "drop-shadow(0 0 28px rgba(118,209,245,0.25)) drop-shadow(0 0 8px rgba(118,209,245,0.14))",
              }}
            >
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Trading Services"
              >
                {/* Bar chart bars */}
                <rect x="18" y="122" width="22" height="52" rx="3" fill="#76d1f5" fillOpacity="0.25" stroke="#76d1f5" strokeWidth="2"/>
                <rect x="52" y="96" width="22" height="78" rx="3" fill="#76d1f5" fillOpacity="0.25" stroke="#76d1f5" strokeWidth="2"/>
                <rect x="86" y="110" width="22" height="64" rx="3" fill="#76d1f5" fillOpacity="0.25" stroke="#76d1f5" strokeWidth="2"/>
                <rect x="120" y="76" width="22" height="98" rx="3" fill="#76d1f5" fillOpacity="0.35" stroke="#76d1f5" strokeWidth="2"/>
                <rect x="154" y="48" width="22" height="126" rx="3" fill="#76d1f5" fillOpacity="0.45" stroke="#76d1f5" strokeWidth="2.5"/>
                {/* Trend line */}
                <polyline
                  points="29,118 63,88 97,100 131,66 165,38"
                  stroke="#76d1f5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Arrow head at end of trend line */}
                <polyline
                  points="152,28 165,38 155,51"
                  stroke="#76d1f5"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Baseline */}
                <line x1="10" y1="178" x2="190" y2="178" stroke="#76d1f5" strokeWidth="2" strokeOpacity="0.4"/>
              </svg>
            </div>
          </div>

          {/* Right: two-column text */}
          <div className="flex-1 flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:pl-4">
            <div className="lg:w-[42%]">
              <h2
                className="text-white font-bold leading-snug"
                style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 700 }}
              >
                Brokerage services built for active traders
              </h2>
            </div>
            <div className="flex-1">
              <p style={{ color: "#b0bccb", fontSize: "15px", lineHeight: 1.65 }}>
                A complete suite of trading services, tools and technology built to support
                professional traders. Guardian Trading is the active trader division of Velocity
                Clearing, recognized provider of clearing, execution and technology to institutional
                traders and other retail brokerage firms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ backgroundColor: "#11161c" }} className="py-16 px-4">
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

          {/* Left col: text + button */}
          <div style={{ minWidth: "220px", maxWidth: "280px" }}>
            <h2
              className="text-white font-bold mb-3"
              style={{ fontSize: "26px", fontWeight: 700 }}
            >
              Pricing
            </h2>
            <p style={{ color: "#b0bccb", fontSize: "15px", lineHeight: 1.65, marginBottom: "22px" }}>
              Low commissions on stock and options trades. Transparent pricing and no hidden fees.
            </p>
            <OutlineBtn href="/equities-options">Pricing Details</OutlineBtn>
          </div>

          {/* Middle: Options Contracts */}
          <div className="flex-1 flex flex-col sm:flex-row gap-14 lg:gap-20">
            <div>
              <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                Options Contracts
              </p>
              <p
                style={{
                  color: "#76d1f5",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                AS LOW AS
              </p>
              <div className="flex items-start" style={{ lineHeight: 1 }}>
                <span
                  style={{
                    color: "#76d1f5",
                    fontSize: "26px",
                    fontWeight: 700,
                    marginTop: "6px",
                    marginRight: "1px",
                    lineHeight: 1,
                  }}
                >
                  $
                </span>
                <span
                  style={{
                    color: "#76d1f5",
                    fontSize: "56px",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  0.15
                </span>
              </div>
              <p style={{ color: "#b0bccb", fontSize: "13px", marginTop: "8px" }}>Per Contract</p>
            </div>

            {/* Right: Equities Commissions */}
            <div>
              <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                Equities Commissions
              </p>
              <p
                style={{
                  color: "#76d1f5",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                AS LOW AS
              </p>
              <div className="flex items-start" style={{ lineHeight: 1 }}>
                <span
                  style={{
                    color: "#76d1f5",
                    fontSize: "26px",
                    fontWeight: 700,
                    marginTop: "6px",
                    marginRight: "1px",
                    lineHeight: 1,
                  }}
                >
                  $
                </span>
                <span
                  style={{
                    color: "#76d1f5",
                    fontSize: "56px",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  0.0005
                </span>
              </div>
              <p style={{ color: "#b0bccb", fontSize: "13px", marginTop: "8px" }}>Per Share</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORDER ROUTING ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #0b0f14 0%, #11161c 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        className="py-20 px-4"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          <div className="flex-shrink-0 flex justify-center lg:justify-start" style={{ width: "200px" }}>
            <img
              src={IMG_ORDER}
              alt="Order Routing"
              style={{
                width: "160px",
                height: "160px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 20px rgba(118,209,245,0.15))",
                opacity: 0.9,
              }}
            />
          </div>
          <div className="flex-1">
            <h2
              className="text-white font-bold mb-4"
              style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700 }}
            >
              Order Routing
            </h2>
            <p
              style={{
                color: "#b0bccb",
                fontSize: "15px",
                lineHeight: 1.65,
                maxWidth: "580px",
                marginBottom: "24px",
              }}
            >
              Execute orders quickly by choosing from over 30 order routing options including ALGO,
              ECN, and dark pool routes.
            </p>
            <OutlineBtn>Learn More</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── LOCATES & STOCK BORROWS ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #11161c 0%, #0b0f14 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        className="py-20 px-4"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          <div className="flex-shrink-0 flex justify-center lg:justify-start" style={{ width: "200px" }}>
            <img
              src={IMG_LOCATES}
              alt="Locates & Stock Borrows"
              style={{
                width: "160px",
                height: "160px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 20px rgba(118,209,245,0.15))",
                opacity: 0.9,
              }}
            />
          </div>
          <div className="flex-1">
            <h2
              className="text-white font-bold mb-4"
              style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700 }}
            >
              Locates &amp; Stock Borrows
            </h2>
            <p
              style={{
                color: "#b0bccb",
                fontSize: "15px",
                lineHeight: 1.65,
                maxWidth: "580px",
                marginBottom: "24px",
              }}
            >
              Leverage our proprietary technology for stock locates and borrows, combined with the
              support of our team.
            </p>
            <OutlineBtn href="/equities-options">Stock Locate &amp; Borrowing</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── LEADING TRADING PLATFORMS ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #0b0f14 0%, #11161c 100%)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        className="py-20 px-4"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          <div className="flex-shrink-0 flex justify-center lg:justify-start" style={{ width: "200px" }}>
            <img
              src={IMG_PLATFORMS}
              alt="Leading Trading Platforms"
              style={{
                width: "160px",
                height: "160px",
                objectFit: "contain",
                filter: "drop-shadow(0 0 20px rgba(118,209,245,0.15))",
                opacity: 0.9,
              }}
            />
          </div>
          <div className="flex-1">
            <h2
              className="text-white font-bold mb-4"
              style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700 }}
            >
              Leading Trading Platforms
            </h2>
            <p
              style={{
                color: "#b0bccb",
                fontSize: "15px",
                lineHeight: 1.65,
                maxWidth: "580px",
                marginBottom: "24px",
              }}
            >
              Select from Sterling Trader, DAS Trader and other advanced trading platforms and
              options to execute your trading strategy.
            </p>
            <OutlineBtn href="/platforms">Stock Locate &amp; Borrowing</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          backgroundColor: "#11161c",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
        className="py-24 px-4 text-center"
      >
        <div className="max-w-[700px] mx-auto">
          <h2
            className="text-white font-bold mb-4"
            style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700 }}
          >
            Take on the Markets with Guardian.
          </h2>
          <p style={{ color: "#b0bccb", fontSize: "15px", marginBottom: "32px" }}>
            Let a Guardian Specialist Create a Trading Package for You
          </p>
          <Link
            href="/contact-us"
            className="inline-block border text-white text-[14px] font-semibold px-9 py-3 tracking-wide transition-all duration-200 hover:bg-[#76d1f5] hover:text-[#0b0f14] hover:border-[#76d1f5]"
            style={{ borderColor: "#76d1f5" }}
          >
            Let's Talk
          </Link>
        </div>
      </section>

    </Layout>
  );
}
