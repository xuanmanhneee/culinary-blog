import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CallbackPaginationProps {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  ariaLabel?: string;
}

interface LinkPaginationProps {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

type PaginationProps = CallbackPaginationProps | LinkPaginationProps;

export function Pagination(props: PaginationProps) {
  if ("hrefForPage" in props) {
    const { currentPage, totalPages, hrefForPage } = props;
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
      .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);

    return (
      <nav aria-label="Phân trang" className="flex items-center justify-center gap-2">
        <PageLink
          href={hrefForPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          label="Trang trước"
        >
          <ChevronLeft />
        </PageLink>
        {pages.map((page, index) => (
          <span className="contents" key={page}>
            {index > 0 && pages[index - 1] !== page - 1 && (
              <span className="px-1 text-[#9a9188]">…</span>
            )}
            <Link
              href={hrefForPage(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "grid size-10 place-items-center rounded-full text-sm font-bold transition",
                page === currentPage
                  ? "bg-[#1f4b3f] text-white"
                  : "text-[#5f5750] hover:bg-[#efe6da]",
              )}
            >
              {page}
            </Link>
          </span>
        ))}
        <PageLink
          href={hrefForPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          label="Trang sau"
        >
          <ChevronRight />
        </PageLink>
      </nav>
    );
  }

  const {
    page,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    onPageChange,
    isDisabled = false,
    ariaLabel = "Phân trang",
  } = props;

  if (totalPages <= 1) return null;

  return (
    <nav aria-label={ariaLabel} className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={!hasPreviousPage || isDisabled}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-md border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Trước
      </button>
      <span aria-live="polite" className="text-sm text-zinc-600">
        Trang {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={!hasNextPage || isDisabled}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="rounded-md border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sau
      </button>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        "grid size-10 place-items-center rounded-full border border-[#d8cdbf] text-[#4f4842] transition hover:border-[#1f4b3f]",
        disabled && "pointer-events-none opacity-35",
      )}
    >
      {children}
    </Link>
  );
}

export default Pagination;
