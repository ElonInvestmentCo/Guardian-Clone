import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { X, Star, ArrowRight, Play } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

import heroPlatform from "@assets/IMG_7967_1773721659915.png";
import shieldChart from "@assets/IMG_7968_1773721659915.png";
import monitorPlatform from "@assets/IMG_7969_1773721659915.png";
import stockBorrows from "@assets/IMG_7970_1773721659915.png";
import dasLogo from "@assets/DAS-icon-50x50_1773948931248.png";
import sterlingLogo from "@assets/sterling-icon-50x50_1773948931249.png";
import benzingaBadge from "@assets/IMG_7973_1773721659915.png";
import infraIcon from "@assets/ico-our-infrastructure-132x72_1773948931248.png";
import bgVector from "@assets/img-background-vector-1_1773948931248.png";
import arrowIcon from "@assets/IMG_8065_1773952578861.PNG";
import benzingaBannerImg from "@assets/img-benzinga-short-selling-review-1-846x218-1_1773952971025.jpg";
import omsPlatformsImg from "@assets/Guardian_Trading_-_Google_Chrome_3_19_2026_9_40_04_PM_1773953383663.png";
import infrastructureImg from "@assets/Guardian_Trading_-_Google_Chrome_3_19_2026_9_40_04_PM_1773952959755.png";

export default function Home() {
  const [newsBannerVisible, setNewsBannerVisible] = useState(true);
  const [email, setEmail] = useState("");

  return (
    <Layout>
      {/* ── NEWS / BLOG ANNOUNCEMENT BAR ── */}
      {newsBannerVisible && (
        <div className="fixed top-[56px] left-0 right-0 z-40 bg-[#1c1c1c] border-b border-white/5">
          <div className="max-w-[1200px] mx-auto px-4 h-[42px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-primary text-sm">✦</span>
              <span className="text-[#aaa] text-xs whitespace-nowrap">New on the blog</span>
              <a
                href="https://www.guardiantrading.com/how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs hover:underline truncate"
              >
                DAS Trader Pro hotkeys by Peter Benci
              </a>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hidden sm:block bg-[#111] border border-white/10 text-white text-xs px-3 h-7 w-44 placeholder-[#555] focus:outline-none focus:border-primary/50"
              />
              <button className="bg-[#4a7fbd] hover:bg-[#3d6fad] text-white text-xs px-3 h-7 transition-colors whitespace-nowrap">
                Subscribe
              </button>
              <button
                onClick={() => setNewsBannerVisible(false)}
                className="text-[#666] hover:text-white transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingTop: newsBannerVisible ? "140px" : "96px",
          paddingBottom: "80px",
          backgroundColor: "#151515",
          minHeight: "520px",
        }}
      >
        {/* Dot-pattern decoration */}
        <div
          className="absolute top-0 right-0 w-[45%] h-full dot-pattern opacity-30 pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* Left column */}
            <div className="flex-1 max-w-[520px]">
              <p className="text-[11px] font-bold tracking-widest uppercase text-white/70 mb-4">TAKE ON THE MARKETS WITH GUARDIAN</p>
              <h1 className="text-[2.6rem] lg:text-5xl font-display font-bold leading-tight text-white mb-8">
                Optimized services, tools and support designed specifically for active traders.
              </h1>
              <a
                href="/signup"
                className="inline-block border border-white text-white text-sm px-6 py-2.5 hover:bg-white hover:text-black transition-colors font-medium"
              >
                Start Trading
              </a>
            </div>

            {/* Right column — laptop + phone platform screenshot (full-bleed on mobile) */}
            <div className="flex-1 w-full max-w-[580px] relative -mx-4 lg:mx-0">
              <img
                src={heroPlatform}
                alt="Guardian Trading Platform — DAS Trader Pro on laptop and mobile"
                className="w-full h-auto object-contain drop-shadow-2xl"
                style={{ filter: "brightness(1.05) contrast(1.05)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENZINGA AWARD BANNER ── */}
      <section className="bg-[#151515] py-8 px-4">
        <div className="max-w-[1100px] mx-auto">
          <a
            href="https://guardian.vaccountopening.com/register/Benzinga"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={benzingaBannerImg}
              alt="Reviewed by Benzinga 2024 — Preferred Broker for Short Selling"
              className="block w-full h-auto"
              style={{ imageRendering: "auto", filter: "brightness(1.05) contrast(1.05)" }}
            />
          </a>
        </div>
      </section>

      {/* ── WHY DO ACTIVE TRADERS USE GUARDIAN? ── */}
      <section id="services" className="bg-[#151515] py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3">
            Why Do Active Traders Use Guardian?
          </h2>
          <h3 className="text-xl text-primary font-bold mb-6">Pricing. Routing. Service.</h3>
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <p className="text-[#aaa] text-[15px] leading-relaxed mb-4">
                Guardian Trading's mission is simple; to provide active traders with high-performance tools,
                comprehensive services, competitive pricing, and proactive client support to maximize their
                trading performance and profitability.
              </p>
              <p className="text-[#aaa] text-[15px] leading-relaxed">
                With services prioritizing speed, control, and cost efficiency, we provide the resources
                to help traders realize their full potential.
              </p>
            </div>
            {/* Shield + candlestick chart graphic */}
            <div className="flex-shrink-0 w-full lg:w-[380px] flex items-center justify-center">
              <img
                src={shieldChart}
                alt="Streamlined and Secure — Guardian Trading"
                className="w-full max-w-[340px] h-auto object-contain"
                style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.1)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section id="pricing" className="bg-[#111] border-t border-b border-white/5">
        <div className="max-w-[680px] mx-auto px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12 leading-snug">
            Control Your Costs With Customized Commissions
          </h2>

          <div className="flex flex-col gap-0">
            {/* Options Contracts block */}
            <div className="bg-[#0d0d0d] px-8 py-10 text-center border border-white/5">
              <p className="text-white font-bold text-lg mb-2">Options Contracts</p>
              <p className="text-[11px] text-[#777] uppercase tracking-[0.2em] mb-5">AS LOW AS:</p>
              <p className="text-[72px] sm:text-[88px] font-bold leading-none text-[#7ecef5] mb-5 break-all">
                $0.15
              </p>
              <p className="text-[11px] text-[#777] uppercase tracking-[0.2em]">PER CONTRACT*</p>
            </div>

            {/* Equities Commissions block */}
            <div className="bg-[#0d0d0d] px-8 py-10 text-center border border-white/5 border-t-0">
              <p className="text-white font-bold text-lg mb-2">Equities Commissions</p>
              <p className="text-[11px] text-[#777] uppercase tracking-[0.2em] mb-5">AS LOW AS:</p>
              <p className="text-[72px] sm:text-[88px] font-bold leading-none text-[#7ecef5] mb-5 break-all">
                $0.0005
              </p>
              <p className="text-[11px] text-[#777] uppercase tracking-[0.2em]">PER SHARE</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#0e0e0e] border-t border-white/5 py-8 px-4">
          <p className="text-[12px] text-[#888] text-center max-w-[520px] mx-auto leading-relaxed">
            *Options commission does not include standard pass-through fees such as the Options Reporting Fee, Options
            Clearing Corporation or exchange fees on index contracts, etc.*
          </p>
        </div>
      </section>

      {/* ── MASTER YOUR ORDER FLOW ── */}
      <section className="bg-[#0d0d0d] py-16 lg:py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">
            <div className="flex-1 max-w-[480px]">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3">
                Master Your Order Flow
              </h2>
              <p className="text-white font-bold text-[14px] tracking-[0.12em] uppercase mb-7">
                SPEED AND TIMING ARE EVERYTHING IN TRADE.
              </p>
              <ul className="space-y-[18px]">
                {[
                  "Execute orders quickly",
                  "In-house stock borrow desk for locates and overnight borrows",
                  "30+ Order routing options including ALGO and dark pool routes",
                  "ECN Rebates",
                  "Access to Liquidity",
                  "Connect your trading via an API",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#ccc] text-[14px] leading-snug">
                    <Play
                      className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-[2px]"
                      style={{ fill: "currentColor", strokeWidth: 0 }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Monitor platform image — full-bleed on mobile */}
            <div className="flex-shrink-0 w-full -mx-4 lg:mx-0 lg:w-[500px]">
              <img
                src={monitorPlatform}
                alt="DAS Trader Pro on desktop monitor"
                className="w-full h-auto object-contain drop-shadow-xl"
                style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.05)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCATES & STOCK BORROWS ── */}
      <section className="bg-[#111] py-16 lg:py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-center">
            {/* Text — top on mobile, right on desktop */}
            <div className="flex-1 order-1 lg:order-2">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
                Locates &amp; Stock Borrows
              </h2>
              <p className="text-[#aaa] text-[15px] leading-relaxed mb-7">
                With a speedy and efficient locate product, traders can obtain locates, if required,
                for short sales seamlessly.
              </p>
              <ul className="space-y-[18px] mb-8">
                {[
                  "Easily place compliant short trades",
                  "Reduce costs with a robust easy-to-borrow securities list",
                  "Leverage our in-house borrows & locates team",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[#ccc] text-[14px] leading-snug">
                    <Play
                      className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-[2px]"
                      style={{ fill: "currentColor", strokeWidth: 0 }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="/platforms"
                className="inline-block border border-primary text-primary text-sm px-5 py-2 hover:bg-primary hover:text-black transition-colors"
              >
                Stock Locates and Borrows
              </a>
            </div>
            {/* Stock borrows screenshot — bottom on mobile, left on desktop */}
            <div className="flex-shrink-0 w-full -mx-4 lg:mx-0 lg:w-[460px] order-2 lg:order-1">
              <img
                src={stockBorrows}
                alt="Locates and Stock Borrows — Guardian Trading"
                className="w-full h-auto object-contain rounded"
                style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.05)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADING TECHNOLOGY ── */}
      <section className="relative bg-[#0d0d0d] py-16 px-4 border-t border-white/5 overflow-hidden">
        {/* Background vector chart lines */}
        <img
          src={bgVector}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none"
        />

        <div className="relative z-10 max-w-[1100px] mx-auto">
          <h2 className="text-3xl lg:text-[2rem] font-display font-bold text-white text-center mb-10">
            Trading Technology
          </h2>

          {/* Card 1 — Our OMS Platforms */}
          <div className="mb-4">
            <img
              src={omsPlatformsImg}
              alt="Our OMS Platforms — DAS Trader Pro and Sterling Trader Pro"
              className="block w-full h-auto"
              style={{ filter: "brightness(1.1) contrast(1.08) saturate(1.05)" }}
            />
          </div>

          {/* Card 2 — Our Infrastructure */}
          <div>
            <img
              src={infrastructureImg}
              alt="Our Infrastructure — Speed. Efficiency. Access."
              className="block w-full h-auto"
              style={{ filter: "brightness(1.1) contrast(1.08) saturate(1.05)" }}
            />
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE THE GUARDIAN DIFFERENCE (CTA) ── */}
      <section className="bg-[#0d0d0d] py-20 px-4 border-t border-white/5 text-center">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
            Experience the Guardian Difference
          </h2>
          <p className="text-[#aaa] text-[15px] mb-10">
            Open an account and become a Guardian Trader today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#pricing"
              className="inline-block border border-[#4a7fbd] text-white text-sm px-8 py-3 hover:bg-[#4a7fbd]/20 transition-colors font-medium"
            >
              Pricing Details
            </Link>
            <Link
              href="/signup"
              className="inline-block bg-[#4a7fbd] hover:bg-[#3d6fad] text-white text-sm px-8 py-3 transition-colors font-medium"
            >
              Open An Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── CHAT WIDGET ── */}
      <ChatWidget />
    </Layout>
  );
}
