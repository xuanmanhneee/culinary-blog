import { CookingPot } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/", label = "Bếp Nhà - Trang chủ" }: { className?: string; href?: string; label?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label={label}>
      <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
        <CookingPot className="size-5" strokeWidth={1.8} />
      </span>
      <span className="font-display text-[1.65rem] leading-none font-bold tracking-[-0.04em] text-foreground">
        Bếp <em className="font-normal text-accent">Nhà</em>
      </span>
    </Link>
  );
}
