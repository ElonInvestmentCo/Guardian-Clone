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
    <nav className="flex items-center justify-center gap-2 mt-12 mb-4" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageHref(baseHref, currentPage - 1)}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#8a9ab0] hover:text-white transition-colors"
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#3a4a5a] cursor-not-allowed" aria-disabled>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-[#3a4a5a] text-[13px]">…</span>
        ) : currentPage === p ? (
          <span
            key={p}
            className="w-9 h-9 flex items-center justify-center rounded text-[13px] font-semibold text-white"
            style={{ background: "#1a3a5c", border: "1px solid #5fc4f0" }}
            aria-current="page"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(baseHref, p)}
            className="w-9 h-9 flex items-center justify-center rounded text-[13px] font-medium text-[#8a9ab0] hover:text-white hover:bg-[#1a2a3a] transition-colors border border-transparent hover:border-[#2a3a48]"
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(baseHref, currentPage + 1)}
          className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#8a9ab0] hover:text-white transition-colors"
          aria-label="Next page"
        >
          Next
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#3a4a5a] cursor-not-allowed" aria-disabled>
          Next
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </nav>
  );
}
