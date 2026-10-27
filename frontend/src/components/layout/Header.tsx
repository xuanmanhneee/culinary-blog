"use client";

import { Menu, Search, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { useAuthStore } from "@/stores/auth-store";

const navigation = [
  { href: "/#cong-thuc", label: "Công thức" },
  { href: "/#danh-muc", label: "Danh mục" },
  { href: "/#cau-chuyen", label: "Chuyện bếp" },
  { href: "/dashboard/recipes", label: "Bếp của tôi" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const storeUser = useAuthStore((state) => state.user);
  const { data: session } = useSession();
  const user = storeUser ?? (session?.user ? { fullName: session.user.name ?? "", email: session.user.email ?? "" } : null);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ded3c5]/80 bg-[#fbf8f2]/90 backdrop-blur-xl">
      <div className="site-container flex h-[74px] items-center justify-between gap-5">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="icon" aria-label="Tìm kiếm">
            <Search />
          </Button>
          {user ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/recipes"><UserRound />{user.fullName}</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/login"><UserRound />Đăng nhập</Link>
            </Button>
          )}
          {user && <Button asChild><Link href="/dashboard/recipes/new">Chia sẻ món ngon</Link></Button>}
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? "Đóng menu" : "Mở menu"}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>
      {isOpen && (
        <div id="mobile-navigation" className="border-t border-[#ded3c5] bg-[#fbf8f2] px-5 py-5 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Điều hướng di động">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="rounded-xl px-3 py-3 font-semibold text-[#3e3833] hover:bg-[#f1e8db]">
                {item.label}
              </Link>
            ))}
            {!user && <Button variant="outline" className="mt-3" asChild><Link href="/login"><UserRound />Đăng nhập</Link></Button>}
            {user && <Button className="mt-3" asChild><Link href="/dashboard/recipes/new">Chia sẻ món ngon</Link></Button>}
          </nav>
        </div>
      )}
    </header>
  );
}
