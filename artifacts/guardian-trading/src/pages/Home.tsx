import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { X, Star, ArrowRight, Play } from "lucide-react";

import heroPlatform from "@assets/IMG_7967_1773721659915.png";
import shieldChart from "@assets/IMG_7968_1773721659915.png";
const monitorPlatform = "/images/img-sterling-monitor.png";
import dasLogo from "@assets/DAS-icon-50x50_1773948931248.png";
import sterlingLogo from "@assets/sterling-icon-50x50_1773948931249.png";

import bgVector from "@assets/img-background-vector-1_1773948931248.png";
import heroPattern from "@assets/pattern_1773965291387.png";

import infraIcon from "@assets/ico-our-infrastructure-132x72_1773948931248.png";
import arrowBtn from "@assets/Guardian_Trading_-_Google_Chrome_4_15_2026_3_12_55_PM-fotor-bg_1776473765131.png";
const benzingaBadge = "/images/img-benzinga-badge.png";

export default function Home() {
  const [newsBannerVisible, setNewsBannerVisible] = useState(true);
  const [email, setEmail] = useState("");

  return (
    <Layout>
      {/* ── NEWS / BLOG ANNOUNCEMENT BAR ── */}
      {newsBannerVisible && (
        <div style={{ backgroundColor: "#141414", marginTop: "78px" }}>
          <div
            className="flex items-center justify-between"
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              height: "44px",
              padding: "0 24px",
              backgroundColor: "#121212",
              borderBottom: "1px solid #212e33",
            }}
          >
            <div className="flex items-center min-w-0" style={{ gap: "10px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "linear-gradient(180deg, #5bc5f0 0%, #0a8fd4 100%)",
                  flexShrink: 0,
                  boxShadow: "0 0 6px 2px rgba(54, 172, 245, 0.45), 0 0 12px 4px rgba(54, 172, 245, 0.2)",
                }}
              />
              <span
                style={{
                  color: "#f5f9fc",
                  fontSize: "13px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                New on the blog
              </span>
              <a
                href="https://www.guardiiantrading.com/how-to-prepare-your-das-trader-pro-for-advanced-hotkeys-scripting/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#76d1f5",
                  fontSize: "13px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
              >
                DAS Trader Pro hotkeys by Peter Benci
              </a>
            </div>

            <div className="flex items-center flex-shrink-0" style={{ gap: "0" }}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hidden sm:block"
                style={{
                  backgroundColor: "#12151c",
                  border: "1px solid #233642",
                  color: "#c8d8e4",
                  fontSize: "13px",
                  padding: "0 14px",
                  height: "34px",
                  width: "180px",
                  outline: "none",
                  borderRadius: "2px",
                }}
              />
              <button
                className="hidden sm:block"
                style={{
                  background: "linear-gradient(135deg, #3a8fd4 0%, #2a6ab5 50%, #4a6ea0 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "0 20px",
                  height: "34px",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                  transition: "filter 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)"; }}
              >
                Subscribe
              </button>
              <button
                onClick={() => setNewsBannerVisible(false)}
                style={{
                  color: "#9db4c7",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 8px",
                  marginLeft: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#9db4c7"; }}
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section
        className="relative overflow-hidden"
        style={{
          paddingTop: newsBannerVisible ? "60px" : "138px",
          paddingBottom: "80px",
          backgroundColor: "#141414",
          minHeight: "520px",
        }}
      >
        {/* Dotted bar-chart pattern — right-side section background */}
        <img
          src={heroPattern}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-0 h-[88%] w-auto pointer-events-none select-none"
          style={{ opacity: 0.55, filter: "brightness(1.15) saturate(1.1)" }}
        />

        <div className="max-w-[1200px] mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* Left column */}
            <div className="flex-1 max-w-[520px]">
              <p className="text-[13px] font-bold tracking-widest uppercase text-white mb-4">TAKE ON THE MARKETS WITH GUARDIAN</p>
              <h1 className="text-[2.6rem] lg:text-5xl font-display font-bold leading-tight text-white mb-8">
                Optimized services, tools and support designed specifically for active traders.
              </h1>
              <Link
                href="/signup"
                className="inline-block border text-white text-sm px-8 py-3 font-semibold tracking-wide transition-colors hover:bg-white/10"
                style={{ borderColor: "#1ab8d4" }}
              >
                Start Trading
              </Link>
            </div>

            {/* Right column — laptop + phone platform screenshot */}
            <div className="flex-1 w-full max-w-[580px] relative -mx-4 lg:mx-0">
              <img
                src={heroPlatform}
                alt="Guardian Trading Platform — DAS Trader Pro on laptop and mobile"
                className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
                style={{ filter: "brightness(1.05) contrast(1.05)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENZINGA AWARD BANNER ── */}
      <div style={{ backgroundColor: "#141414", padding: "24px 0", display: "flex", justifyContent: "center" }}>
        <img
          src={benzingaBadge}
          alt="Reviewed by Benzinga 2024 — Preferred Broker for Short Selling"
          width={320}
          height={266}
          loading="lazy"
          style={{ display: "block", width: "180px", height: "auto" }}
        />
      </div>

      {/* ── WHY DO ACTIVE TRADERS USE GUARDIAN? ── */}
      <section id="services" className="bg-[#1c1c1c] py-20 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-3">
            Why Do Active Traders Use Guardian?
          </h2>
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <h3 className="text-2xl text-white font-bold mb-5">Pricing. Routing. Service.</h3>
              <p className="text-white text-[15px] leading-relaxed mb-4">
                Guardian Trading's mission is simple; to provide active traders with high-performance tools,
                comprehensive services, competitive pricing, and proactive client support to maximize their
                trading performance and profitability.
              </p>
              <p className="text-white text-[15px] leading-relaxed">
                With services prioritizing speed, control, and cost efficiency, we provide the resources
                to help traders realize their full potential.
              </p>
            </div>
            {/* Shield + candlestick chart graphic */}
            <div className="flex-shrink-0 w-full lg:w-[520px] flex items-center justify-center">
              <img
                src={shieldChart}
                alt="Streamlined and Secure — Guardian Trading"
                className="w-full h-auto object-contain"
                style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.1)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section id="pricing" className="bg-[#1c1c1c] py-10 px-4">
        <div className="max-w-[1100px] mx-auto">
          {/* Single dark card — heading left, pricing right */}
          <div className="bg-[#181818] flex flex-col lg:flex-row">
            {/* Left: heading */}
            <div className="flex-shrink-0 lg:w-[280px] px-10 py-10 flex items-center">
              <h2 className="text-2xl font-bold text-[#93c5fd] leading-snug">
                Control Your Costs With Customized Commissions
              </h2>
            </div>

            {/* Right: two pricing blocks side by side */}
            <div className="flex flex-col sm:flex-row flex-1">
              {/* Options Contracts */}
              <div className="flex-1 px-10 py-10">
                <p className="text-[#93c5fd] font-bold text-[17px] mb-1">Options Contracts</p>
                <p className="text-[11px] text-[#93c5fd] uppercase tracking-[0.18em] mb-4">AS LOW AS:</p>
                <p className="font-bold leading-none text-[#93c5fd] mb-4" style={{ fontSize: "clamp(52px,7vw,80px)" }}>
                  <sup className="text-[40%] align-super">$</sup>0.15
                </p>
                <p className="text-[11px] text-[#93c5fd] uppercase tracking-[0.18em]">PER CONTRACT*</p>
              </div>

              {/* Equities Commissions */}
              <div className="flex-1 px-10 py-10">
                <p className="text-[#93c5fd] font-bold text-[17px] mb-1">Equities Commissions</p>
                <p className="text-[11px] text-[#93c5fd] uppercase tracking-[0.18em] mb-4">AS LOW AS:</p>
                <p className="font-bold leading-none text-[#93c5fd] mb-4" style={{ fontSize: "clamp(52px,7vw,80px)" }}>
                  <sup className="text-[40%] align-super">$</sup>0.0005
                </p>
                <p className="text-[11px] text-[#93c5fd] uppercase tracking-[0.18em]">PER SHARE</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[12px] text-[#aaa] mt-5 leading-relaxed">
            *Options commission does not include standard pass-through fees such as the Options Reporting Fee, Options
            Clearing Corporation or exchange fees on index contracts, etc.*
          </p>
        </div>
      </section>

      {/* ── MASTER YOUR ORDER FLOW ── */}
      <section className="bg-[#141414] py-16 lg:py-20 px-4">
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
      <section className="bg-[#141414] py-16 lg:py-20 px-4">
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
              <Link
                href="/platforms"
                className="group flex items-center justify-between w-full"
                style={{
                  backgroundColor: "#0d0d0d",
                  padding: "18px 22px",
                  textDecoration: "none",
                  maxWidth: "420px",
                }}
              >
                <span
                  className="text-white font-bold group-hover:text-[#1ab8d4] transition-colors"
                  style={{ fontSize: "15px", letterSpacing: "0.01em" }}
                >
                  Stock Locates And Borrows
                </span>
                <img
                  src={arrowBtn}
                  alt=""
                  aria-hidden="true"
                  style={{ width: "46px", height: "46px", objectFit: "contain", marginLeft: "24px", flexShrink: 0 }}
                />
              </Link>
            </div>
            {/* Stock borrows image — left on desktop */}
            <div className="flex-shrink-0 w-full -mx-4 lg:mx-0 lg:w-[460px] order-2 lg:order-1">
              <img
                src="/images/img-locates-stock-borrows.png"
                alt="Locates and Stock Borrows — Guardian Trading"
                className="w-full h-auto object-contain rounded"
                style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.05)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADING TECHNOLOGY ── */}
      <section className="relative bg-[#1c1c1c] py-16 px-4 overflow-hidden">
        {/* Background vector chart lines */}
        <img
          src={bgVector}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ opacity: 0.55, filter: "brightness(1.4) contrast(1.3) saturate(1.2)" }}
        />

        <div className="relative z-10 max-w-[1100px] mx-auto">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white text-center mb-10">
            Trading Technology
          </h2>

          {/* Card 1 — Our OMS Platforms */}
          <div className="mb-[6px] bg-[#111] flex flex-col lg:flex-row">
            {/* Left */}
            <div className="lg:w-[42%] px-8 lg:px-10 py-8 lg:py-10 flex flex-col justify-center">
              <h3 className="text-[22px] lg:text-[26px] font-bold text-white mb-7 leading-tight">
                Our OMS Platforms
              </h3>
              <div className="flex items-start gap-10">
                {/* DAS Trader Pro */}
                <div className="flex flex-col items-start">
                  <img
                    src={dasLogo}
                    alt="DAS Trader Pro"
                    className="w-[46px] h-[46px] object-contain mb-3"
                  />
                  <span className="text-white text-[11px] font-bold tracking-[0.12em] uppercase leading-tight">
                    DAS TRADER PRO
                  </span>
                </div>
                {/* Sterling Trader Pro */}
                <div className="flex flex-col items-start">
                  <div className="relative mb-3">
                    <img
                      src={sterlingLogo}
                      alt="Sterling Trader Pro"
                      className="w-[46px] h-[46px] object-contain"
                    />
                    <span
                      className="absolute -top-1 -right-2 text-white font-bold leading-none"
                      style={{ fontSize: "9px" }}
                    >
                      TM
                    </span>
                  </div>
                  <span className="text-white text-[11px] font-bold tracking-[0.12em] uppercase leading-tight">
                    STERLING TRADER® PRO
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex-1 px-8 lg:px-10 py-8 lg:py-10 flex flex-col justify-center">
              <p className="text-white text-[14px] lg:text-[15px] leading-relaxed mb-7">
                Enjoy real-time trading with advanced order types, multi-account management, and analytical
                tools designed for the active trader. Try a paper trading account free for 14 Days with a
                simulated portfolio and test the power of these features for yourself!
              </p>
              <TechCTA label="View Platforms" href="/platforms" />
            </div>
          </div>

          {/* Card 2 — Our Infrastructure */}
          <div className="bg-[#111] flex flex-col lg:flex-row">
            {/* Left */}
            <div className="lg:w-[42%] px-8 lg:px-10 py-8 lg:py-10 flex flex-col justify-center">
              <h3 className="text-[22px] lg:text-[26px] font-bold text-white mb-2 leading-tight">
                Our Infrastructure
              </h3>
              <p className="text-white text-[11px] font-bold tracking-[0.18em] uppercase mb-6">
                SPEED. EFFICIENCY. ACCESS.
              </p>
              <img
                src={infraIcon}
                alt="Infrastructure icon"
                width={132}
                height={72}
                className="w-[132px] h-auto"
              />
            </div>

            {/* Right */}
            <div className="flex-1 px-8 lg:px-10 py-8 lg:py-10 flex flex-col justify-center">
              <p className="text-white text-[14px] lg:text-[15px] leading-relaxed mb-7">
                Our proprietary stock locate system, high-tech clearing, low-latency execution platforms, and
                competitive securities lending services work together to provide everything traders need under
                one roof.
              </p>
              <TechCTA label="Trading Infrastructure" href="/platforms" />
            </div>
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
              className="inline-block border text-white text-sm px-8 py-3 font-semibold tracking-wide transition-colors hover:bg-white/10"
              style={{ borderColor: "#1ab8d4" }}
            >
              Pricing Details
            </Link>
            <Link
              href="/signup"
              className="inline-block text-white text-sm px-8 py-3 font-semibold tracking-wide transition-colors hover:brightness-110"
              style={{ background: "#1e6fc4" }}
            >
              Open An Account
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
}

/* ── CTA row used in Trading Technology cards ── */
function TechCTA({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 w-fit"
      style={{ textDecoration: "none" }}
    >
      <span className="text-white font-bold text-[15px] tracking-wide group-hover:text-[#1ab8d4] transition-colors">
        {label}
      </span>
      <span
        className="flex-shrink-0 flex items-center justify-center transition-colors group-hover:bg-[#1e6fc4]"
        style={{
          width: "30px",
          height: "30px",
          background: "#1e5fa0",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="white">
          <polygon points="2,1 10,5.5 2,10" />
        </svg>
      </span>
    </Link>
  );
}
