import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";

const PATTERN_BG = "https://www.guardiantrading.com/wp-content/themes/gate39media/public/img/img-blog-background-pattern.png";

const CATEGORIES = ["All Blogs", "DAS Hotkeys", "Margin", "Risk Management", "Short Selling", "Tools"];

const POSTS = [
  {
    id: 1,
    category: "DAS HOTKEYS",
    categorySlug: "DAS Hotkeys",
    date: "04/17/2026",
    readTime: "6m",
    title: "DAS Trader Pro \u2013 how to backup and transfer the configuration",
    excerpt:
      "Sometimes your PC crashes, maybe you bought a new PC, or perhaps you did a mistake and need to revert back to the old settings.There are multiple ways of how to backup the configuration in DAS Trader Pro.Use the native backup featureGo to Tools > Back Up SettingsThen, to restore, go to Tools > Restore\u2026",
  },
  {
    id: 2,
    category: "DAS HOTKEYS",
    categorySlug: "DAS Hotkeys",
    date: "04/13/2026",
    readTime: "4m",
    title: "DAS Trader Pro \u2013 A simple guide to setting up hotkeys",
    excerpt:
      "Hotkeys are one of the most powerful features in DAS Trader Pro. Setting them up correctly can dramatically improve your trading speed and accuracy. In this guide we walk through the key configuration steps to get you up and running with the most useful hotkeys for active traders.",
  },
  {
    id: 3,
    category: "MARGIN",
    categorySlug: "Margin",
    date: "03/28/2026",
    readTime: "5m",
    title: "Understanding Margin Requirements for Active Traders",
    excerpt:
      "Margin trading amplifies both gains and losses. Understanding the margin requirements at Guardian Trading is essential for managing your risk and keeping your account in good standing. This article covers initial margin, maintenance margin, and what happens during a margin call.",
  },
  {
    id: 4,
    category: "RISK MANAGEMENT",
    categorySlug: "Risk Management",
    date: "03/15/2026",
    readTime: "7m",
    title: "Risk Management Strategies Every Active Trader Should Know",
    excerpt:
      "Effective risk management is the cornerstone of long-term trading success. From setting proper stop-loss levels to position sizing, this comprehensive guide covers the core strategies that professional traders use to protect their capital while maximizing opportunity.",
  },
  {
    id: 5,
    category: "SHORT SELLING",
    categorySlug: "Short Selling",
    date: "03/05/2026",
    readTime: "6m",
    title: "Short Selling with Guardian: Access to Locate and Borrow",
    excerpt:
      "Guardian Trading offers one of the most robust stock locate and borrowing systems available to retail active traders. Learn how our in-house locate desk works, how to find hard-to-borrow shares, and best practices for managing short positions in volatile markets.",
  },
  {
    id: 6,
    category: "TOOLS",
    categorySlug: "Tools",
    date: "02/20/2026",
    readTime: "5m",
    title: "Top Trading Tools Available Through Guardian Trading",
    excerpt:
      "Guardian Trading partners with the best platforms in the business. From DAS Trader Pro to Sterling Trader Pro, Rival One, Bloomberg EMSX, and CBOE SILEXX, our clients have access to institutional-grade tools that give them a competitive edge in every market condition.",
  },
];

function ReadMoreArrow() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        background: "#76d1f5",
        marginLeft: "10px",
        flexShrink: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8M6 2l4 4-4 4" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All Blogs");

  const featured = POSTS[0];
  const filtered =
    activeCategory === "All Blogs"
      ? POSTS
      : POSTS.filter((p) => p.categorySlug === activeCategory);

  return (
    <Layout title="Blog | Guardian Trading">

      {/* ── FEATURED POST ── */}
      <section
        className="relative overflow-hidden"
        style={{
          marginTop: "78px",
          backgroundColor: "#141414",
          minHeight: "280px",
        }}
      >
        <div
          className="absolute inset-y-0 right-0 pointer-events-none"
          style={{
            width: "320px",
            backgroundImage: `url('${PATTERN_BG}')`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right center",
            backgroundSize: "contain",
            opacity: 0.55,
          }}
        />
        <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-4">
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.12em" }}>
              {featured.category}
            </span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>|</span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>{featured.date}</span>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {featured.readTime}
            </span>
          </div>
          <h1 className="text-white font-bold mb-5" style={{ fontSize: "clamp(22px, 3vw, 32px)", maxWidth: "720px", lineHeight: 1.3 }}>
            {featured.title}
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.78)", maxWidth: "760px", lineHeight: 1.7, marginBottom: "28px" }}>
            {featured.excerpt}
          </p>
          <button
            style={{
              border: "1.5px solid #ffffff",
              background: "transparent",
              color: "#ffffff",
              padding: "10px 22px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.03em",
            }}
          >
            Read More
          </button>
        </div>
      </section>

      {/* ── CATEGORY FILTER BAR ── */}
      <section style={{ backgroundColor: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="flex items-center overflow-x-auto" style={{ gap: "0" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeCategory === cat ? "#76d1f5" : "rgba(255,255,255,0.75)",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "18px 22px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  borderBottom: activeCategory === cat ? "2px solid #76d1f5" : "2px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARDIAN BLOG LISTING ── */}
      <section style={{ backgroundColor: "#141414" }} className="py-12 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-white font-bold mb-3" style={{ fontSize: "clamp(24px, 3vw, 32px)" }}>
            Guardian Blog
          </h2>
          <div style={{ borderBottom: "1.5px dashed rgba(255,255,255,0.18)", marginBottom: "32px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {filtered.map((post, idx) => (
              <div
                key={post.id}
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
                  padding: "28px 0",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "48px",
                  alignItems: "start",
                }}
                className="blog-post-row"
              >
                <div>
                  <h3
                    className="text-white font-bold"
                    style={{ fontSize: "clamp(16px, 2vw, 20px)", lineHeight: 1.35 }}
                  >
                    {post.title}
                  </h3>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.1em" }}>
                      {post.category}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>|</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>{post.date}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: "14px" }}>
                    {post.excerpt}
                  </p>
                  <button
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Read More
                    <ReadMoreArrow />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
}
