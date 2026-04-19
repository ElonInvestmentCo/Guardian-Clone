import { Layout } from "@/components/Layout";
import { Link } from "wouter";

const BG = "https://www.guardiantrading.com/wp-content/uploads/2025/07/background-image-3.png";
const IMG_ORDER = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-order-routing-174x174.png";
const IMG_LOCATES = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-locates-borrows-174x174.png";
const IMG_PLATFORMS = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-leading-platforms-174x174.png";
const BENZINGA = "https://www.guardiantrading.com/wp-content/uploads/2026/01/reviewed-by-benzinga-2024-200x166-1-320x266.png";

const OutlineBtn = ({ href, children }: { href?: string; children: React.ReactNode }) => (
  <a
    href={href ?? "#"}
    className="inline-block border text-white text-[13px] font-semibold px-5 py-2 tracking-wide transition-colors hover:bg-white/10"
    style={{ borderColor: "#4a7fbd" }}
  >
    {children}
  </a>
);

export default function TradingServices() {
  return (
    <Layout title="Trading Services | Guardian Trading">

      {/* ── HERO + BROKERAGE INTRO (merged) ── */}
      <section
        className="relative overflow-hidden"
        style={{
          marginTop: "78px",
          backgroundImage: `url('${BG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.15)" }} />

        {/* Title row */}
        <div className="relative z-10 flex items-center justify-center text-center pt-14 pb-6 px-4">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">
            Trading Services
          </h1>
        </div>

        {/* Two-column text row */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-10 pb-52 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="lg:w-[42%] lg:pl-40">
            <h2 className="text-white leading-snug" style={{ fontSize: "32px", fontWeight: 400 }}>
              Brokerage services built for active traders
            </h2>
          </div>
          <div className="flex-1">
            <p className="text-white leading-relaxed" style={{ fontSize: "16px", fontWeight: 400 }}>
              A complete suite of trading services, tools and technology built to support professional traders.
              Guardian Trading is the active trader division of Velocity Clearing, recognized provider of clearing,
              execution and technology to institutional traders and other retail brokerage firms.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-14 px-4">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 items-start">
          {/* Left */}
          <div className="lg:w-[32%]">
            <h2 className="text-2xl font-display font-bold text-white mb-3">Pricing</h2>
            <p className="text-white text-[14px] leading-relaxed mb-5">
              Low commissions on stock and options trades. Transparent pricing and no hidden fees.
            </p>
            <OutlineBtn href="/pricing">Pricing Details</OutlineBtn>
          </div>
          {/* Right: two stats */}
          <div className="flex-1 flex flex-col sm:flex-row gap-12 lg:gap-16">
            <div>
              <p className="text-white text-[13px] font-semibold mb-1">Options Contracts</p>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-2">AS LOW AS</p>
              <p className="font-bold mb-1" style={{ fontSize: "52px", lineHeight: 1, color: "#76d1f5" }}>
                <span style={{ fontSize: "28px", verticalAlign: "top", marginTop: "8px", display: "inline-block" }}>$</span>0.15
              </p>
              <p className="text-white text-[13px] mt-2">Per Contract</p>
            </div>
            <div>
              <p className="text-white text-[13px] font-semibold mb-1">Equities Commissions</p>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-2">AS LOW AS</p>
              <p className="font-bold mb-1" style={{ fontSize: "52px", lineHeight: 1, color: "#76d1f5" }}>
                <span style={{ fontSize: "28px", verticalAlign: "top", marginTop: "8px", display: "inline-block" }}>$</span>0.0005
              </p>
              <p className="text-white text-[13px] mt-2">Per Share</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ORDER ROUTING ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-[220px]">
            <img src={IMG_ORDER} alt="Order Routing" style={{ width: "174px", height: "174px", objectFit: "contain" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">Order Routing</h2>
            <p className="text-white text-[15px] leading-relaxed mb-6">
              Execute orders quickly by choosing from over 30 order routing options including ALGO, ECN, and dark pool routes.
            </p>
            <OutlineBtn>Learn More</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── LOCATES & STOCK BORROWS ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-[220px]">
            <img src={IMG_LOCATES} alt="Locates & Stock Borrows" style={{ width: "174px", height: "174px", objectFit: "contain" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">Locates &amp; Stock Borrows</h2>
            <p className="text-white text-[15px] leading-relaxed mb-6">
              Leverage our proprietary technology for stock locates and borrows, combined with the support of our team.
            </p>
            <OutlineBtn href="/equities-options">Stock Locate &amp; Borrowing</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── LEADING TRADING PLATFORMS ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-[220px]">
            <img src={IMG_PLATFORMS} alt="Leading Trading Platforms" style={{ width: "174px", height: "174px", objectFit: "contain" }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">Leading Trading Platforms</h2>
            <p className="text-white text-[15px] leading-relaxed mb-6">
              Select from Sterling Trader, DAS Trader and other advanced trading platforms and options to execute your trading strategy.
            </p>
            <OutlineBtn href="/platforms">Stock Locate &amp; Borrowing</OutlineBtn>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-20 px-4 text-center">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Take on the Markets with Guardian.
          </h2>
          <p className="text-white text-[15px] mb-8">
            Let a Guardian Specialist Create a Trading Package for You
          </p>
          <a
            href="/contact"
            className="inline-block border text-white text-[14px] font-semibold px-8 py-3 tracking-wide transition-colors hover:bg-white/10"
            style={{ borderColor: "#4a7fbd" }}
          >
            Let's Talk
          </a>
        </div>
      </section>

      {/* ── BENZINGA ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-12 px-4">
        <div className="max-w-[1100px] mx-auto flex justify-center">
          <a
            href="https://www.benzinga.com/money/guardian-trading-review"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={BENZINGA} alt="Reviewed by Benzinga 2024" style={{ width: "120px", height: "auto" }} />
          </a>
        </div>
      </section>

    </Layout>
  );
}
