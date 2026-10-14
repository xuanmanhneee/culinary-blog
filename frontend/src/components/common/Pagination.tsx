interface PaginationProps {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  ariaLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  isDisabled = false,
  ariaLabel = "Phân trang",
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

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
