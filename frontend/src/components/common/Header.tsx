"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function Header() {
  const { user, isLoading } = useAuthStore();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold text-emerald-800" aria-label="Culinary Blog - Trang chủ">
          Culinary Blog
        </Link>

        <Link
          href="/search"
          className="order-3 flex min-w-0 flex-1 items-center rounded-md border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-500 hover:border-emerald-700 hover:text-emerald-800 sm:order-none sm:ml-4 sm:max-w-md"
          aria-label="Tìm kiếm công thức"
        >
          Tìm kiếm công thức...
        </Link>

        <nav aria-label="Điều hướng chính" className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-emerald-800">Trang chủ</Link>
          <Link href="/search" className="hover:text-emerald-800">Tìm kiếm</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="text-sm text-zinc-500" role="status">Đang tải...</span>
          ) : user ? (
            <>
              <Link
                href="/dashboard/recipes"
                className="max-w-36 truncate text-sm font-medium text-zinc-700 hover:text-emerald-800"
                title={user.name ?? user.email ?? "Tài khoản"}
              >
                {user.name ?? user.email ?? "Tài khoản"}
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
