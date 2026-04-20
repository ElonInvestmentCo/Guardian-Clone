import { useState } from "react";
import { Layout } from "@/components/Layout";
import readMoreBtn from "@assets/Guardian-Clone_-_Replit_-_Google_Chrome_4_18_2026_7_43_01_PM_1776655378942.png";

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
    title: "DAS Trader Pro \u2013 A simple green light for entries",
    excerpt:
      "I used to struggle with forgetting some of the rules for my entries. I was able to get around it with the help of a simple solution - a green light button for entries. It is working in a few stepsCheck if my condition is metChange the color of the button to green if yes or\u2026",
  },
  {
    id: 3,
    category: "DAS HOTKEYS",
    categorySlug: "DAS Hotkeys",
    date: "04/07/2026",
    readTime: "3m",
    title: "DAS Trader Pro \u2013 symbol notes",
    excerpt:
      "Often we need to put some notes on the symbols, being either warnings, whole trade plans, or just any other note.3 types of notesThere are 3 types of notes as of today, if I do not count any text you can write into a button by editing it. Although it is a valid way, there\u2026",
  },
  {
    id: 4,
    category: "DAS HOTKEYS",
    categorySlug: "DAS Hotkeys",
    date: "03/23/2026",
    readTime: "5m",
    title: "DAS Trader Pro \u2013 how to save the stop loss price value for later",
    excerpt:
      "Everybody has experienced it. You enter a trade having automated stop loss or update the stop loss to the value you like, but then you mis-click in the orders window and lose the stop loss. Now you are pressured to retrieve it back to stay protected.Here is the solution for such cases.setvar() and getvar() functionas\u2026",
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

const POSTS_PER_PAGE = 4;
const TOTAL_PAGES = 6;

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All Blogs");
  const [currentPage, setCurrentPage] = useState(1);

  const featured = POSTS[0];
  const filtered =
    activeCategory === "All Blogs"
      ? POSTS
      : POSTS.filter((p) => p.categorySlug === activeCategory);

  const paginated = filtered.slice(0, POSTS_PER_PAGE);

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
            width: "340px",
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
          <h1
            className="text-white font-bold mb-5"
            style={{ fontSize: "clamp(22px, 3vw, 30px)", maxWidth: "600px", lineHeight: 1.3 }}
          >
            {featured.title}
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.78)", maxWidth: "680px", lineHeight: 1.7, marginBottom: "28px" }}>
            {featured.excerpt}
          </p>
          <a href="#" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity group">
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Read More</span>
            <img src={readMoreBtn} alt="Read More" style={{ height: "28px", width: "auto" }} />
          </a>
        </div>
      </section>

      {/* ── CATEGORY FILTER BAR ── */}
      <section style={{ backgroundColor: "#1a1a1a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="flex items-center overflow-x-auto" style={{ gap: "0" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
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
          <h2 className="text-white font-bold mb-3" style={{ fontSize: "clamp(22px, 3vw, 30px)" }}>
            Guardian Blog
          </h2>
          <div style={{ borderBottom: "1.5px dashed rgba(255,255,255,0.2)", marginBottom: "0" }} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            {paginated.map((post, idx) => (
              <div
                key={post.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-14"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  padding: "32px 0",
                  alignItems: "start",
                }}
              >
                {/* Left: title */}
                <div>
                  <h3
                    className="text-white font-bold"
                    style={{ fontSize: "clamp(16px, 1.8vw, 20px)", lineHeight: 1.35 }}
                  >
                    {post.title}
                  </h3>
                </div>
                {/* Right: meta + excerpt + button */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.1em" }}>
                      {post.category}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "16px" }}>|</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>{post.date}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: "16px" }}>
                    {post.excerpt}
                  </p>
                  <a href="#" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em" }}>Read More</span>
                    <img src={readMoreBtn} alt="Read More" style={{ height: "28px", width: "auto" }} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* ── PAGINATION ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "32px",
              paddingTop: "16px",
            }}
          >
            {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: currentPage === page ? "#4a7fbd" : "transparent",
                  border: currentPage === page ? "1px solid #4a7fbd" : "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, TOTAL_PAGES))}
              style={{
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ffffff",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              &gt;
            </button>
          </div>
        </div>
      </section>

    </Layout>
  );
}
