import { Link } from "wouter";
import { BlogPost, getPostHref } from "@/data/blogPosts";

interface Props {
  post: BlogPost;
}

/**
 * Single row in the "Guardian Blog" list on the All Blogs page — rebuilt to
 * match the production guardiantrading.com/blog list layout pixel-for-pixel:
 * title on the left, category/date + excerpt + Read More on the right, no
 * card border/background (the production list rows sit directly on the page
 * background, separated only by vertical spacing).
 */
export function BlogListRow({ post }: Props) {
  const { href, external } = getPostHref(post);
  const linkProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  const TitleTag: any = external ? "a" : Link;
  const ReadMoreTag: any = external ? "a" : Link;

  return (
    <article className="grid grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] gap-4 lg:gap-10 py-7 lg:py-8">
      {/* Title */}
      <TitleTag
        href={href}
        {...linkProps}
        className="nav-hover-link text-white font-bold text-[24px] lg:text-[28px] leading-[1.2] transition-colors hover:text-[#7eb6d9]"
        style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
      >
        {post.title}
      </TitleTag>

      {/* Meta + excerpt + read more */}
      <div className="min-w-0">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3">
          <Link
            href={`/category/${post.categorySlug}`}
            className="nav-hover-link nav-hover-link--underline text-[13px] font-bold uppercase tracking-wider text-white"
          >
            {post.category}
          </Link>
          <span className="text-[#7eb6d9]">|</span>
          <span className="text-[13px] font-bold text-white">{post.date}</span>
        </div>

        {post.excerpt && (
          <p className="text-[#a9b4bf] text-[15px] leading-[1.7] mb-4 max-w-[720px]">
            {post.excerpt}
          </p>
        )}

        <ReadMoreTag
          href={href}
          {...linkProps}
          className="inline-flex items-center gap-2.5 text-[14px] font-bold text-white group"
        >
          Read More
          <span
            className="inline-flex items-center justify-center w-6 h-6 transition-colors group-hover:bg-[#7eb6d9]"
            style={{ background: "#3d6a94" }}
          >
            <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
              <path d="M0.5 0.5L8.5 5L0.5 9.5V0.5Z" fill="white" />
            </svg>
          </span>
        </ReadMoreTag>
      </div>
    </article>
  );
}
