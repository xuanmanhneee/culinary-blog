import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({ currentPage, totalPages, hrefForPage }: { currentPage: number; totalPages: number; hrefForPage: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-2">
      <PageLink href={hrefForPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} label="Trang trước"><ChevronLeft /></PageLink>
      {pages.map((page, index) => (
        <span className="contents" key={page}>
          {index > 0 && pages[index - 1] !== page - 1 && <span className="px-1 text-[#9a9188]">…</span>}
          <Link href={hrefForPage(page)} aria-current={page === currentPage ? "page" : undefined} className={cn("grid size-10 place-items-center rounded-full text-sm font-bold transition", page === currentPage ? "bg-[#1f4b3f] text-white" : "text-[#5f5750] hover:bg-[#efe6da]")}>{page}</Link>
        </span>
      ))}
      <PageLink href={hrefForPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} label="Trang sau"><ChevronRight /></PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  return <Link href={href} aria-label={label} aria-disabled={disabled} tabIndex={disabled ? -1 : undefined} className={cn("grid size-10 place-items-center rounded-full border border-[#d8cdbf] text-[#4f4842] transition hover:border-[#1f4b3f]", disabled && "pointer-events-none opacity-35")}>{children}</Link>;
}
