import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { Play } from "lucide-react";

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li style={{ display: "flex", alignItems: "center", gap: "10px" }} className="text-white text-[15px] leading-snug">
    <span style={{
      display: "inline-block",
      width: 0,
      height: 0,
      borderTop: "5px solid transparent",
      borderBottom: "5px solid transparent",
      borderLeft: "9px solid #76d1f5",
      flexShrink: 0,
    }} />
    <span>{children}</span>
  </li>
);

export default function About() {
  return (
    <Layout title="About | Guardian Trading">
      {/* ── HERO + SERVING THE ACTIVE TRADER COMMUNITY ── */}
      <section
        className="relative overflow-hidden"
        style={{
          marginTop: "78px",
          backgroundImage: "url('https://www.guardiantrading.com/wp-content/uploads/2025/07/background-image-1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,10,10,0.15)" }} />
        <div className="relative z-10 flex items-center justify-center text-center py-16 px-4">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white">
            About Guardian
          </h1>
        </div>
        <div className="relative z-10 pb-16 px-4">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
              <div className="lg:w-[42%]">
                <h3 className="text-white text-[32px] font-medium bg-[transparent] ml-[115px] mr-[115px] pl-[0px] pr-[0px] mt-[10px] mb-[10px] pt-[1px] pb-[1px]">Serving the Active
                Trader Community</h3>
              </div>
              <div className="flex-1">
                <p className="text-[16px] font-normal text-[#FFFFFF] text-left pl-[20px] pr-[20px] mt-[15px] mb-[15px] ml-[10px] mr-[10px]">
                  Guardian Trading began with a mission to deliver the trading tools, services, and technology
                  traders need to succeed and scale. Guardian Trading provides the knowledge and support active
                  traders expect to manage the entire trading cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── THE GUARDIAN ADVANTAGE ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 lg:py-20 px-4">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            {/* Left: text */}
            <div className="flex-1">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-5">
                The Guardian Advantage
              </h2>
              <p className="text-white text-[11px] font-bold tracking-[0.16em] uppercase mb-6">
                AS A DIVISION OF VELOCITY CLEARING, GUARDIAN TRADING PROVIDES TRADERS WITH ACCESS TO:
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "In-house, high-tech clearing",
                  "Robust execution platforms",
                  "Powerful stock locate system and lending offerings",
                  "Competitive pricing",
                  "Technical infrastructure used by institutional traders",
                ].map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
              <p className="text-white text-[15px] leading-relaxed">
                As a division of a clearing firm, we are able to provide the lowest costs and pass those
                savings to our customers and provide services offered to the largest trading firms.
              </p>
            </div>
            {/* Right: infrastructure image */}
            <div className="flex-shrink-0 w-full lg:w-[480px]">
              <img
                src="/images/ico-infrastructure.png"
                alt="Guardian Trading Infrastructure"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      {/* ── FEATURES: CLIENT SUPPORT / PRICING / TECHNOLOGY ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 lg:py-20 px-4">
        <div className="max-w-[1100px] mx-auto space-y-0">

          {/* Row 1 — Extensive Client Support */}
          <div
            className="flex flex-col lg:flex-row items-center gap-10 py-12"
          >
            <div className="flex-shrink-0 w-full lg:w-[45%] flex justify-center lg:justify-start">
              <img
                src="/images/img-client-support.png"
                alt="Client Support"
                style={{ width: "174px", height: "174px", objectFit: "contain" }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
                Extensive Client Support
              </h2>
              <p className="text-white text-[15px] leading-relaxed">
                Timing is critical to successful trading. Guardian is committed to our client's success
                with tools like live direct chat and open phone access to our customer service teams
                during all active trading hours.
              </p>
            </div>
          </div>

          {/* Row 2 — Competitive Pricing */}
          <div
            className="flex flex-col lg:flex-row items-center gap-10 py-12"
          >
            <div className="flex-shrink-0 w-full lg:w-[45%] flex justify-center lg:justify-start">
              <img
                src="/images/img-competitive-pricing.png"
                alt="Competitive Pricing"
                style={{ width: "175px", height: "141px", objectFit: "contain" }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
                Competitive Pricing
              </h2>
              <p className="text-white text-[15px] leading-relaxed mb-6">
                Traders can boost margin and scale using our competitive pricing model. Our low minimums
                and tiered pricing structure offer customization so active traders can choose the pricing
                that best suits their needs.
              </p>
              <Link
                href="/#pricing"
                className="inline-block border text-white text-sm px-7 py-2.5 font-semibold tracking-wide transition-colors hover:bg-white/10"
                style={{ borderColor: "#1ab8d4" }}
              >
                Pricing Details
              </Link>
            </div>
          </div>

          {/* Row 3 — Focus on Technology */}
          <div className="flex flex-col lg:flex-row items-center gap-10 py-12">
            <div className="flex-shrink-0 w-full lg:w-[45%] flex justify-center lg:justify-start">
              <img
                src="/images/img-technology.png"
                alt="Technology"
                style={{ width: "171px", height: "146px", objectFit: "contain" }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
                Focus on Technology
              </h2>
              <p className="text-white text-[15px] leading-relaxed mb-6">
                Velocity Clearing has developed its own proprietary technology and partnered with leading
                tech partners to offer a suite of best-in-class trading tools built to help active traders
                succeed.
              </p>
              <Link
                href="/platforms"
                className="inline-block border text-white text-sm px-7 py-2.5 font-semibold tracking-wide transition-colors hover:bg-white/10"
                style={{ borderColor: "#1ab8d4" }}
              >
                View Our Platforms
              </Link>
            </div>
          </div>

        </div>
      </section>
      {/* ── ABOUT VELOCITY CLEARING ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 lg:py-20 px-4">
        <div className="max-w-[1100px] mx-auto">

          {/* Two-col intro */}
          <div className="flex flex-col lg:flex-row gap-16 mb-14">
            <div className="flex-1">
              <h2 className="text-3xl font-display font-bold text-white mb-5">
                About Velocity Clearing
              </h2>
              <p className="text-white text-[15px] leading-relaxed mb-4">
                Velocity Clearing, was formed in 2003 to offer third party security locate services.
                Velocity Clearing's mission is to empower clients to reach their objectives by delivering
                peerless white glove service.
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                Operating at the intersection of leading-edge technology infrastructure and high-touch
                service, Velocity offers a full suite of trading solutions and services and experienced
                personnel including:
              </p>
            </div>
            <div className="flex-1">
              <ul className="space-y-3">
                {[
                  "Stock locate",
                  "Securities borrow coverage",
                  "Clearing infrastructure",
                  "Competitive financing",
                  "In-house market making desk",
                  "Full support client services",
                ].map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
            </div>
          </div>

          {/* Velocity logo */}
          <div className="flex justify-center mb-14">
            <img
              src="/images/logo-velocity-clearing.png"
              alt="Velocity Clearing"
              style={{ width: "298px", height: "auto", objectFit: "contain" }}
            />
          </div>

          {/* Memberships & Certifications */}
          <h2 className="text-2xl font-display font-bold text-white mb-4">
            Memberships and Certifications
          </h2>
          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.25)", marginBottom: "36px" }} />
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left col */}
            <div className="flex-1">
              <h4 className="text-[16px] font-bold text-white mb-4">Stock Exchange Memberships</h4>
              <ul className="space-y-2 mb-8">
                {[
                  "NYSE New York Stock Exchange",
                  "NYSE Arca, Inc.",
                  "Nasdaq Stock Market",
                  "CBOE BYX Exchange, Inc.",
                  "CBOE EDGA Exchange, Inc.",
                  "CBOE EDGX Exchange, Inc.",
                  "IEX Exchange, Inc.",
                  "Members Exchange",
                ].map((item) => (
                  <BulletItem key={item}>{item}</BulletItem>
                ))}
              </ul>
              <a
                href="https://www.benzinga.com/money/guardian-trading-review"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/images/img-benzinga-badge.png"
                  alt="Guardian Trading Reviewed by Benzinga 2024 — 4.5 Stars"
                  style={{ width: "120px", height: "auto", objectFit: "contain" }}
                />
              </a>
            </div>

            {/* Right col */}
            <div className="flex-1 space-y-8">
              <div>
                <h4 className="text-[16px] font-bold text-white mb-4">Options Exchange Memberships</h4>
                <ul className="space-y-2">
                  {["Chicago Board Options Exchange", "Nasdaq PHLX"].map((item) => (
                    <BulletItem key={item}>{item}</BulletItem>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-white mb-4">Clearing Houses</h4>
                <ul className="space-y-2">
                  {[
                    "Depository Trust & Clearing Corporation (DTCC)",
                    "Options Clearing Corporation (OCC)",
                  ].map((item) => (
                    <BulletItem key={item}>{item}</BulletItem>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-white mb-4">Registered With</h4>
                <ul className="space-y-2">
                  {[
                    "Financial Industry Regulatory Authority (FINRA)",
                    "Securities and Exchange Commission (SEC)",
                    "National Futures Association (NFA)",
                  ].map((item) => (
                    <BulletItem key={item}>{item}</BulletItem>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ── CTA ── */}
      <section className="bg-[#141414] py-20 px-4 text-center border-t border-white/5">
        <div className="max-w-[700px] mx-auto">
          <h3 className="text-2xl lg:text-3xl font-display font-bold text-white mb-8">
            Let Guardian Help You Achieve Your Trading Goals
          </h3>
          <Link
            href="/contact"
            className="inline-block border text-white text-sm px-10 py-3 font-semibold tracking-wide transition-colors hover:bg-white/10"
            style={{ borderColor: "#1ab8d4" }}
          >
            Let's Start a Conversation
          </Link>
        </div>
      </section>
    </Layout>
  );
}
