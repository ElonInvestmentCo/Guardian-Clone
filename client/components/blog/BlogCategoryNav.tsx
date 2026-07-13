import { Link } from "wouter";
import { CATEGORIES } from "@/data/blogPosts";

interface Props {
  /** Slug of the currently active category, e.g. "das-hotkeys" or "all" */
  activeSlug?: string;
}

/**
 * Horizontal category navigation bar that matches the live Guardian Trading
 * website. Background #828387, Roboto 16px/400, items centred, height ~44 px.
 *
 * Sits directly below the fixed main navbar (marginTop: 78px clears the
 * navbar; the Layout's main paddingTop: 36px clears the stock ticker so the
 * two together place this bar flush beneath the ticker).
 */
export function BlogCategoryNav({ activeSlug = "all" }: Props) {
  return (
    <nav
      aria-label="Blog categories"
      style={{
        background: "#828387",
        marginTop: "78px",
        /* Ensure it sits above the page content but below the fixed bars */
        position: "relative",
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0 40px",
          /* 10px top + 24px line-height + 10px bottom = 44px bar */
          minHeight: "44px",
        }}
      >
        {CATEGORIES.map((c) => {
          const isActive = c.slug === activeSlug;
          return (
            <Link
              key={c.slug}
              href={c.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                fontFamily: "Roboto, sans-serif",
                fontSize: "16px",
                fontWeight: 400,
                lineHeight: "24px",
                letterSpacing: "normal",
                textDecoration: "none",
                textTransform: "none" as const,
                whiteSpace: "nowrap" as const,
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: isActive
                  ? "2px solid #ffffff"
                  : "2px solid transparent",
                /* Slightly reduce opacity for inactive items, matching live site */
                opacity: isActive ? 1 : 0.85,
                transition: "opacity 0.15s ease, border-color 0.15s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.outline =
                  "2px solid rgba(255,255,255,0.6)";
                (e.currentTarget as HTMLElement).style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.outline = "none";
              }}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
