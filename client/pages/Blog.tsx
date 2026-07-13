import { useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { BlogCategoryNav } from "@/components/blog/BlogCategoryNav";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { getPaginatedPosts, getPostsByCategory, getPostHref } from "@/data/blogPosts";
import { Link } from "wouter";

// ─── Featured hero (most recent post, page 1 only) ─────────────────────────
function FeaturedHero() {
  const allPosts = getPostsByCategory();
  const post = allPosts[0];
  if (!post) return null;
  const { href, external } = getPostHref(post);

  const title = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-[#5fc4f0] transition-colors"
    >
      {post.title}
    </a>
  ) : (
    <Link href={href} className="hover:text-[#5fc4f0] transition-colors">
      {post.title}
    </Link>
  );

  const readMore = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-[14px] font-semibold text-white transition-colors"
      style={{ background: "#1a4a6a", border: "1px solid #5fc4f0" }}
    >
      Read More
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </a>
  ) : (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-[14px] font-semibold text-white transition-colors"
      style={{ background: "#1a4a6a", border: "1px solid #5fc4f0" }}
    >
      Read More
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0b1a28 0%, #0d1117 60%, #0a1520 100%)",
        borderBottom: "1px solid #1a2a3a",
      }}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(95,196,240,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(95,196,240,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto px-6 py-14 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href={`/category/${post.categorySlug}`}
                className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded"
                style={{ color: "#5fc4f0", background: "rgba(95,196,240,0.12)" }}
              >
                {post.category}
              </Link>
              <span className="text-[#5a6a7a] text-[13px]">{post.date}</span>
              {post.readTime && (
                <span className="text-[#5a6a7a] text-[13px]">{post.readTime}</span>
              )}
            </div>

            <h2 className="text-white font-bold text-[28px] lg:text-[36px] leading-tight mb-4">
              {title}
            </h2>

            {post.excerpt && (
              <p className="text-[#8a9ab0] text-[15px] leading-[1.75] mb-6 max-w-[600px]">
                {post.excerpt}
              </p>
            )}

            {readMore}
          </div>

          {/* Decorative visual */}
          <div className="hidden lg:flex flex-shrink-0 w-[340px] h-[220px] items-center justify-center rounded-xl overflow-hidden"
               style={{ background: "linear-gradient(135deg, #0f2533 0%, #0c1c2e 100%)", border: "1px solid #1f2a30" }}>
            <div className="text-center px-8">
              <div className="text-[64px] mb-3 opacity-40">📈</div>
              <p className="text-[#3a5a7a] text-[13px] font-medium">Guardian Trading</p>
              <p className="text-[#2a4a6a] text-[11px] mt-1">Market Insights</p>
            </div>
          </div>
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

      {/* Post grid */}
      <section style={{ background: "#0d1117", minHeight: "60vh" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {/* Section heading */}
          <div className="flex items-baseline justify-between mb-8">
            <h1 className="text-white font-bold text-[28px]">Guardian Blog</h1>
            <p className="text-[#4a5a6a] text-[13px]">
              {totalPosts} article{totalPosts !== 1 ? "s" : ""}
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#4a5a6a] text-[15px]">No posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
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
