import { Link } from "wouter";
import { BlogPost, getPostHref } from "@/data/blogPosts";

interface Props {
  post: BlogPost;
}

const CATEGORY_COLORS: Record<string, string> = {
  "das-hotkeys": "#5fc4f0",
  "margin": "#f0a05f",
  "risk-management": "#f05f5f",
  "short-selling": "#a05ff0",
  "tools": "#5ff0a0",
};

function getCategoryColor(slug: string) {
  return CATEGORY_COLORS[slug] ?? "#5fc4f0";
}

export function BlogPostCard({ post }: Props) {
  const { href, external } = getPostHref(post);
  const color = getCategoryColor(post.categorySlug);

  return (
    <article
      className="flex flex-col rounded-lg overflow-hidden border border-[#1f2a30] bg-[#0c1114] hover:border-[#2a3a48] transition-colors"
      style={{ height: "100%" }}
    >
      {/* Category + Date */}
      <div className="px-5 pt-5 pb-0 flex items-center gap-3">
        <Link
          href={`/category/${post.categorySlug}`}
          className="nav-hover-link nav-hover-link--underline text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ color, background: `${color}18` }}
          onClick={(e) => e.stopPropagation()}
        >
          {post.category}
        </Link>
        <span className="text-[#6b7280] text-[12px]">{post.date}</span>
        {post.readTime && (
          <span className="text-[#6b7280] text-[12px]">{post.readTime}</span>
        )}
      </div>

      {/* Title */}
      <div className="px-5 pt-3 pb-2 flex-1">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold text-[16px] leading-snug hover:text-[#5fc4f0] transition-colors line-clamp-3 block"
          >
            {post.title}
          </a>
        ) : (
          <Link
            href={href}
            className="text-white font-bold text-[16px] leading-snug hover:text-[#5fc4f0] transition-colors line-clamp-3 block"
          >
            {post.title}
          </Link>
        )}

        {post.excerpt && (
          <p className="text-[#8a9ab0] text-[13px] leading-[1.65] mt-2 line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Read More */}
      <div className="px-5 pb-5 pt-3">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color }}
          >
            Read More
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ) : (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color }}
          >
            Read More
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </article>
  );
}
