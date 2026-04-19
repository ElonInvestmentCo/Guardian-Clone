import { Layout } from "@/components/Layout";

const BG2 = "https://www.guardiantrading.com/wp-content/uploads/2025/07/background-image-2.png";

const DAS_ICON = "https://www.guardiantrading.com/wp-content/uploads/2025/07/DAS-icon-50x50.png";
const STERLING_ICON = "https://www.guardiantrading.com/wp-content/uploads/2025/07/sterling-icon-50x50.png";
const RIVAL_ICON = "https://www.guardiantrading.com/wp-content/uploads/2025/07/ico-rival-one-50x50-1-50x50.png";
const BLOOMBERG_ICON = "https://www.guardiantrading.com/wp-content/uploads/2025/07/ico-bloomberg-50x50-1-50x50.png";

const DAS_SCREENS = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-das-trader-screens-538x364-1-538x364.png";
const STERLING_SCREENS = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-sterling-screens-454x402-1-454x402.png";
const RIVAL_SCREENS = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-rival-one-screens-566x357-1-566x357.png";
const BLOOMBERG_SCREENS = "https://www.guardiantrading.com/wp-content/uploads/2025/07/img-bloomberg-screens-425x334-1-425x334.png";

const BENZINGA = "https://www.guardiantrading.com/wp-content/uploads/2026/01/reviewed-by-benzinga-2024-200x166-1-320x266.png";

const PlusBtn = ({ href }: { href?: string }) => (
  <a href={href ?? "#"} className="inline-block hover:opacity-80 transition-opacity">
    <img src="/images/btn-plus.png" alt="Details" className="h-auto" />
  </a>
);

const PricingBtn = ({ href }: { href?: string }) => (
  <a href={href ?? "/pricing"} className="inline-block hover:opacity-80 transition-opacity">
    <img src="/images/btn-pricing-details.png" alt="Pricing Details" className="h-auto" />
  </a>
);

const StartBtn = ({ href }: { href?: string }) => (
  <a href={href ?? "/open-account"} className="inline-block hover:opacity-80 transition-opacity">
    <img src="/images/btn-start-trial.png" alt="Start A 14 Day Trial" className="h-auto" />
  </a>
);

const GuidanceBtn = ({ href }: { href?: string }) => (
  <a href={href ?? "/contact"} className="inline-block hover:opacity-80 transition-opacity">
    <img src="/images/btn-platform-guidance.png" alt="Get Platform Guidance" className="h-auto" />
  </a>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li style={{ display: "flex", alignItems: "center", gap: "10px" }} className="text-white text-[14px] leading-snug">
    <span style={{
      display: "inline-block",
      width: 0,
      height: 0,
      borderTop: "4px solid transparent",
      borderBottom: "4px solid transparent",
      borderLeft: "8px solid #76d1f5",
      flexShrink: 0,
    }} />
    <span>{children}</span>
  </li>
);

export default function Platforms() {
  return (
    <Layout title="Trading Platforms | Guardian Trading">

      {/* ── HERO ── */}
      <section
        className="relative flex items-center justify-center text-center overflow-hidden"
        style={{
          marginTop: "78px",
          minHeight: "260px",
          backgroundImage: `url('${BG2}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} />
        <div className="relative z-10 py-14 px-4">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white tracking-tight">
            Platforms
          </h1>
        </div>
      </section>

      {/* ── DAS TRADER PRO ── text left / screen right */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={DAS_ICON} alt="DAS" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
              <h2 className="text-2xl font-display font-bold text-white">DAS Trader Pro</h2>
            </div>
            <p className="text-white text-[14px] leading-relaxed mb-5">
              Manage your trader efficiently with one of the best institutional and live market data solutions. This professional
              platform has features to efficiently support Level 2 Equity Trading, Routing, and both options.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Fast Trade Execution",
                "Multiple Stop Types",
                "Real-Time Data Feed",
                "Sub-Millisecond Confirmation",
                "Multiple routes, Algos, Dark Pools, and Liquidity Providers",
                "Advanced Level 2 Real-time stock sharing",
                "Integration with our stock locate and borrowing technology",
              ].map((f) => <Bullet key={f}>{f}</Bullet>)}
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              <PlusBtn />
              <PricingBtn href="/pricing" />
              <StartBtn />
            </div>
          </div>
          {/* Screen */}
          <div className="flex-shrink-0 w-full lg:w-[480px] order-1 lg:order-2">
            <img src={DAS_SCREENS} alt="DAS Trader Pro Screens" className="w-full h-auto object-contain" />
          </div>
        </div>
      </section>

      {/* ── STERLING TRADER PRO ── screen left / text right */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Screen */}
          <div className="flex-shrink-0 w-full lg:w-[440px]">
            <img src={STERLING_SCREENS} alt="Sterling Trader Pro Screens" className="w-full h-auto object-contain" />
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={STERLING_ICON} alt="Sterling" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
              <h2 className="text-2xl font-display font-bold text-white">Sterling Trader® Pro</h2>
            </div>
            <p className="text-white text-[14px] leading-relaxed mb-5">
              Enjoy multi-asset class trading from a single platform. This platform has been designed to meet the needs of
              active equity, option and futures traders.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Real-Time Data",
                "Position & Portfolio Management",
                "Basket Trading",
                "Advanced Charting",
                "Stop Orders",
                "Fully-Configurable Hot Keys",
                "Custom Alerts",
                "Real-Time Level 2 Market access to exchanges and ECNs",
                "Integration with our stock locate and borrowing technology",
              ].map((f) => <Bullet key={f}>{f}</Bullet>)}
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              <PlusBtn />
              <PricingBtn href="/pricing" />
              <StartBtn />
            </div>
          </div>
        </div>
      </section>

      {/* ── RIVAL ONE ── text left / screen right */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-2">
              <img src={RIVAL_ICON} alt="Rival One" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
              <div>
                <h2 className="text-2xl font-display font-bold text-white leading-tight">Rival One: Multi-Asset</h2>
                <h2 className="text-2xl font-display font-bold text-white">Trading</h2>
              </div>
            </div>
            <p className="text-white text-[14px] leading-relaxed mb-5">
              Trade Across Asset Classes &amp; Exchanges from a Single Platform. Equities, Futures &amp; Options.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Normalized Market Data",
                "Ultra-Low Latency Engine",
                "Executions &amp; Order Routing",
                "Order &amp; Position Management",
                "Low-Latency Spreader",
                "Exchange Simulation",
                "Cloud-based, Fully Hosted",
              ].map((f) => <Bullet key={f}>{f}</Bullet>)}
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              <PlusBtn />
              <PricingBtn href="/pricing" />
              <StartBtn />
            </div>
          </div>
          {/* Screen */}
          <div className="flex-shrink-0 w-full lg:w-[500px] order-1 lg:order-2">
            <img src={RIVAL_SCREENS} alt="Rival One Screens" className="w-full h-auto object-contain" />
          </div>
        </div>
      </section>

      {/* ── BLOOMBERG EMSX ── screen left / text right */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Screen */}
          <div className="flex-shrink-0 w-full lg:w-[420px]">
            <img src={BLOOMBERG_SCREENS} alt="Bloomberg EMSX Screens" className="w-full h-auto object-contain" />
          </div>
          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={BLOOMBERG_ICON} alt="Bloomberg" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
              <h2 className="text-2xl font-display font-bold text-white">Bloomberg EMSX</h2>
            </div>
            <p className="text-white text-[14px] leading-relaxed mb-6">
              The EMSX solution is a powerful multi-asset order management system that offers buy-side and buy-side trading
              firms access to over $2,100 brokers, 175 DMA algorithms and other Regulatory tools needed to trade proficiently.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <PlusBtn />
              <PricingBtn href="/pricing" />
              <StartBtn />
            </div>
          </div>
        </div>
      </section>

      {/* ── CBOE SILEXX ── text left / screen right */}
      <section style={{ backgroundColor: "#141414" }} className="py-16 px-4 border-b border-white/5">
        <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="flex-1 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-display font-bold text-white">Silexx CBOE Silexx</h2>
            </div>
            <p className="text-white text-[14px] leading-relaxed mb-5">
              Silexx is a comprehensive and technology-driven order management system (OMS) that caters to the professional marketplace.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Streamlined Execution",
                "Automated Algorithms",
                "Risk Management",
                "Strategy-Based Complex Order Tickets",
                "Single-Click Trading",
                "Transferable System Layouts",
                "Scenario Analysis",
              ].map((f) => <Bullet key={f}>{f}</Bullet>)}
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              <PlusBtn />
              <PricingBtn href="/pricing" />
              <StartBtn />
            </div>
          </div>
          {/* Placeholder screen — no image provided for Silexx */}
          <div className="flex-shrink-0 w-full lg:w-[440px] order-1 lg:order-2 bg-[#1a1a1a] border border-white/10 flex items-center justify-center" style={{ minHeight: "260px" }}>
            <span className="text-white/20 text-[13px]">Silexx Platform View</span>
          </div>
        </div>
      </section>

      {/* ── TRADING PLATFORM EXPERTISE ── */}
      <section style={{ backgroundColor: "#1c1c1c" }} className="py-20 px-4 text-center border-b border-white/5">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-4">
            Trading Platform Expertise
          </h2>
          <p className="text-white text-[15px] mb-8">
            Not seeing your trading platform here? Questions regarding DAS?
          </p>
          <GuidanceBtn href="/contact" />
        </div>
      </section>

      {/* ── BENZINGA ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-12 px-4">
        <div className="max-w-[1100px] mx-auto flex justify-center">
          <a href="https://www.benzinga.com/money/guardian-trading-review" target="_blank" rel="noopener noreferrer">
            <img src={BENZINGA} alt="Reviewed by Benzinga 2024" style={{ width: "120px", height: "auto" }} />
          </a>
        </div>
      </section>

    </Layout>
  );
}
