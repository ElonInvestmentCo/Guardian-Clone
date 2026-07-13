import { Link } from "wouter";
import { CATEGORIES } from "@/data/blogPosts";

interface Props {
  activeSlug?: string;
}

export function BlogCategoryNav({ activeSlug = "all" }: Props) {
  return (
    <div className="bg-[#9a9ea4]" style={{ marginTop: "78px" }}>
      <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap items-center gap-x-8 gap-y-0">
        {CATEGORIES.map((c) => {
          const isActive = c.slug === activeSlug;
          return (
            <Link
              key={c.slug}
              href={c.href}
              className={`relative text-[13px] font-medium py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "text-white border-[#5fc4f0]"
                  : "text-[#e4e6e8] border-transparent hover:text-white"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
