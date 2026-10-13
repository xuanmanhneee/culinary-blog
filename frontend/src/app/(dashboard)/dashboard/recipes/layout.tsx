import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Quản lý công thức | Culinary Blog",
    default: "Quản lý công thức | Culinary Blog",
  },
  // Khu vực quản trị, không cho công cụ tìm kiếm index.
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/dashboard/recipes", label: "Công thức của tôi" },
  { href: "/dashboard/recipes/new", label: "Tạo công thức" },
] as const;

/**
 * Khung chung cho /dashboard/recipes/* (FR-RCP). Các trang bên trong là CSR, gọi API qua TanStack Query.
 * TODO(Auth): chuyển hướng về /auth/login khi chưa đăng nhập (guard thuộc module Auth phía frontend).
 */
export default function RecipeDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <h1 className="text-2xl font-semibold">Quản lý công thức</h1>
        <nav className="flex gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
