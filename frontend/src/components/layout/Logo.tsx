import { CookingPot } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Bếp Nhà - Trang chủ">
      <span className="grid size-10 place-items-center rounded-full bg-[#1f4b3f] text-white transition-transform group-hover:-rotate-6">
        <CookingPot className="size-5" strokeWidth={1.8} />
      </span>
      <span className="font-display text-[1.65rem] leading-none font-bold tracking-[-0.04em] text-[#28231f]">
        Bếp <em className="font-normal text-[#b65338]">Nhà</em>
      </span>
    </Link>
  );
}
