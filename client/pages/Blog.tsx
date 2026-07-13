import { useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { BlogCategoryNav } from "@/components/blog/BlogCategoryNav";
import { BlogListRow } from "@/components/blog/BlogListRow";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { getPaginatedPosts, getPostsByCategory, getPostHref } from "@/data/blogPosts";
import { Link } from "wouter";

// ─── Decorative bar-chart graphic in the hero card's right edge, matching
// the production All Blogs hero ────────────────────────────────────────────
function HeroBars() {
  const heights = [8, 14, 10, 20, 16, 28, 22, 36, 30, 46, 38, 56, 48, 64];
  return (
    <div
      className="hidden md:flex absolute right-0 bottom-0 items-end gap-[6px] pointer-events-none"
      style={{ height: "80px", paddingRight: "24px" }}
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: "3px",
            height: `${h}px`,
            background: "rgba(126,182,217,0.55)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Featured hero (most recent post, page 1 only) ─────────────────────────
// Rebuilt to match the production guardiantrading.com/blog hero card:
// dark card, uppercase category tag, date + reading time on the right,
// large title, excerpt, and a square-cornered outlined "Read More" button.
function FeaturedHero() {
  const allPosts = getPostsByCategory();
  const post = allPosts[0];
  if (!post) return null;
  const { href, external } = getPostHref(post);
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  const TitleTag: any = external ? "a" : Link;
  const ReadMoreTag: any = external ? "a" : Link;

  return (
    <section style={{ background: "#0d1117" }}>
      <div className="max-w-[1200px] mx-auto px-6 pt-8">
        <div
          className="relative overflow-hidden px-6 py-8 lg:px-12 lg:py-12"
          style={{ background: "#1a1a1c" }}
        >
          <HeroBars />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <Link
              href={`/category/${post.categorySlug}`}
              className="nav-hover-link nav-hover-link--underline text-[14px] font-bold uppercase tracking-wider text-white"
            >
              {post.category}
            </Link>
            <div className="flex items-center gap-3 text-white text-[14px] font-bold">
              <span>{post.date}</span>
              {post.readTime && (
                <>
                  <span className="text-[#7eb6d9]">|</span>
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#7eb6d9" strokeWidth="1.3" />
                      <path d="M7 3.8V7l2.3 1.3" stroke="#7eb6d9" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {post.readTime}
                  </span>
                </>
              )}
            </div>
          </div>

          <TitleTag
            href={href}
            {...linkProps}
            className="relative block text-white font-bold text-[26px] lg:text-[34px] leading-[1.2] mb-4 hover:text-[#7eb6d9] transition-colors"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            {post.title}
          </TitleTag>

          {post.excerpt && (
            <p className="relative text-[#c7cdd3] text-[15px] leading-[1.7] mb-8 max-w-[820px]">
              {post.excerpt}
            </p>
          )}

          <ReadMoreTag
            href={href}
            {...linkProps}
            className="relative inline-flex items-center px-8 py-3 text-[14px] font-bold text-white transition-colors hover:bg-[rgba(126,182,217,0.1)]"
            style={{ border: "1px solid #7eb6d9" }}
          >
            Read More
          </ReadMoreTag>
        </div>
      </div>
    </section>
  );
}

// ─── Main Blog page ─────────────────────────────────────────────────────────
export default function Blog() {
  const { page: pageParam } = useParams<{ page?: string }>();
  const pageNum = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { posts, totalPages, totalPosts, currentPage } = getPaginatedPosts(undefined, pageNum);

  return (
    <Layout
      title="Blog | Guardian Trading — Insights for Active Traders"
      description="Trading insights, DAS Trader Pro hotkeys, risk management guides, short selling strategies and more from the Guardian Trading team."
    >
      {/* Category nav */}
      <BlogCategoryNav activeSlug="all" />

      {/* Featured hero — only on page 1 */}
      {currentPage === 1 && <FeaturedHero />}

      {/* Post list */}
      <section style={{ background: "#0d1117", minHeight: "60vh" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12 lg:py-16">
          {/* Section heading + dotted divider, matching production */}
          <h1
            className="text-white font-bold text-[30px] lg:text-[34px] mb-4"
            style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
          >
            Guardian Blog
          </h1>
          <div
            style={{
              borderTop: "2px dotted rgba(255,255,255,0.3)",
              marginBottom: "8px",
            }}
          />

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#4a5a6a] text-[15px]">No posts found.</p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <BlogListRow key={post.slug} post={post} />
              ))}
            </div>
          )}

          <BlogPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseHref="/blog"
          />
        </div>
      </section>
    </Layout>
  );
}
