import type { Metadata } from "next";
import { BookOpenText, LayoutDashboard, PlusCircle, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { template: "%s | Bếp của tôi", default: "Bếp của tôi" }, robots: { index: false, follow: false } };

const navItems = [
  { href: "/dashboard/recipes", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/recipes", label: "Công thức của tôi", icon: BookOpenText },
  { href: "/dashboard/recipes/new", label: "Tạo công thức", icon: PlusCircle },
  { href: "#", label: "Cài đặt", icon: Settings },
];

export default function RecipeDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-container grid gap-8 py-10 lg:grid-cols-[240px_1fr] lg:py-14">
      <aside className="h-fit rounded-[1.5rem] border border-[#ddd1c3] bg-white/65 p-4 lg:sticky lg:top-28">
        <div className="border-b border-[#e1d6ca] px-3 pb-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#b65338]">Không gian tác giả</p><h1 className="font-display mt-2 text-2xl font-bold">Bếp của tôi</h1></div>
        <nav className="mt-3 space-y-1" aria-label="Quản lý nội dung">{navItems.map((item, index) => <Link key={`${item.label}-${index}`} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#665e57] transition hover:bg-[#eee5da] hover:text-[#1f4b3f]"><item.icon className="size-4" />{item.label}</Link>)}</nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
