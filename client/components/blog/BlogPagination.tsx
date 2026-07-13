import { Link } from "wouter";

interface Props {
  currentPage: number;
  totalPages: number;
  /** e.g. "/blog" or "/category/das-hotkeys" */
  baseHref: string;
}

function pageHref(base: string, page: number) {
  return page === 1 ? base : `${base}/page/${page}`;
}

export function BlogPagination({ currentPage, totalPages, baseHref }: Props) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10 mb-4" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 && (
        <Link
          href={pageHref(baseHref, currentPage - 1)}
          className="flex items-center justify-center w-7 h-7 text-[13px] text-[#8a9ab0] hover:text-white transition-colors"
          aria-label="Previous page"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-[#8a9ab0] text-[13px]">…</span>
        ) : currentPage === p ? (
          <span
            key={p}
            className="w-7 h-7 flex items-center justify-center text-[13px] font-bold text-white"
            style={{ background: "rgba(126,182,217,0.18)", border: "1px solid #7eb6d9" }}
            aria-current="page"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(baseHref, p)}
            className="w-7 h-7 flex items-center justify-center text-[13px] text-[#8a9ab0] hover:text-white transition-colors"
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages && (
        <Link
          href={pageHref(baseHref, currentPage + 1)}
          className="flex items-center justify-center w-7 h-7 text-[13px] text-[#8a9ab0] hover:text-white transition-colors"
          aria-label="Next page"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}
    </nav>
  );
}
