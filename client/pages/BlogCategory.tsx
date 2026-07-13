import { useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { BlogCategoryNav } from "@/components/blog/BlogCategoryNav";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { getPaginatedPosts, getCategoryBySlug } from "@/data/blogPosts";
import NotFound from "@/pages/not-found";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "das-hotkeys":
    "DAS Trader Pro hotkey scripts, automation techniques, and advanced scripting guides by Peter Benci.",
  margin:
    "Everything you need to know about margin trading, Regulation T, and broker margin requirements.",
  "risk-management":
    "Risk vs. reward frameworks, position sizing, and portfolio risk management strategies for active traders.",
  "short-selling":
    "Short sale strategies, trading scenarios, and borrowing mechanics explained for professional short sellers.",
  tools:
    "Trading simulators, technical indicators, fundamental analysis tools, and platform guides for active traders.",
};

export default function BlogCategory() {
  const { slug, page: pageParam } = useParams<{ slug: string; page?: string }>();
  const category = getCategoryBySlug(slug ?? "");

  // Unknown category → 404
  if (!category || category.slug === "all") {
    return <NotFound />;
  }

  const pageNum = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const { posts, totalPages, totalPosts, currentPage } = getPaginatedPosts(
    category.slug,
    pageNum
  );
  const description = CATEGORY_DESCRIPTIONS[category.slug] ?? "";

  return (
    <Layout
      title={`${category.name} | Guardian Trading Blog`}
      description={description || `${category.name} articles from the Guardian Trading blog.`}
    >
      {/* Category nav */}
      <BlogCategoryNav activeSlug={category.slug} />

      {/* Category header */}
      <section
        style={{
          background: "linear-gradient(135deg, #0b1a28 0%, #0d1117 100%)",
          borderBottom: "1px solid #1a2a3a",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <p className="text-[#5fc4f0] text-[12px] font-semibold uppercase tracking-widest mb-2">
            Category
          </p>
          <h1 className="text-white font-bold text-[32px] lg:text-[40px] leading-tight mb-3">
            {category.name}
          </h1>
          {description && (
            <p className="text-[#8a9ab0] text-[15px] leading-relaxed max-w-[640px]">
              {description}
            </p>
          )}
          <p className="text-[#4a5a6a] text-[13px] mt-3">
            {totalPosts} article{totalPosts !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section style={{ background: "#0d1117", minHeight: "60vh" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#4a5a6a] text-[15px]">No posts in this category yet.</p>
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
            baseHref={`/category/${category.slug}`}
          />
        </div>
      </section>
    </Layout>
  );
}
