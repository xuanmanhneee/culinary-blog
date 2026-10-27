"use client";

import {
  BookOpenText,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/Logo";
import { Roles } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const publicNavigation = [
  { href: "/#cong-thuc", label: "Công thức" },
  { href: "/#danh-muc", label: "Danh mục" },
  { href: "/#cau-chuyen", label: "Chuyện bếp" },
  { href: "/dashboard/recipes", label: "Bếp của tôi" },
];

const kitchenNavigation = [
  { href: "/", label: "Khám phá món ăn" },
  { href: "/dashboard/recipes", label: "Công thức của tôi" },
  { href: "/dashboard/recipes/new", label: "Tạo công thức" },
];

const accountNavigation = [
  { href: "/account#profile", label: "Hồ sơ cá nhân", icon: UserRound },
  { href: "/dashboard/recipes", label: "Bếp của tôi", icon: BookOpenText },
  { href: "/account#settings", label: "Cài đặt tài khoản", icon: Settings },
  { href: "/account#help", label: "Trợ giúp", icon: CircleHelp },
] as const;

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "BN";
  return source
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("vi");
}

function UserAvatar({ avatarUrl, name, email, isAdmin, className }: { avatarUrl: string | null; name: string; email: string; isAdmin?: boolean; className?: string }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center rounded-full", isAdmin && "overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-[conic-gradient(#b65338,#d9a441,#2f7965,#6a56a5,#b65338)] before:animate-[spin_5s_linear_infinite]", className)}>
      <span className={cn("relative z-10 grid place-items-center overflow-hidden rounded-full bg-[#1f4b3f] font-bold text-white", isAdmin ? "absolute inset-[2px]" : "size-full")}>
        {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="44px" unoptimized className="object-cover" /> : getInitials(name, email)}
      </span>
    </span>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard/recipes") {
    return pathname.startsWith(href) && !pathname.startsWith("/dashboard/recipes/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  if (pathname === "/login" || pathname === "/register") return null;
  const user = session?.user ? {
    fullName: session.user.name ?? "",
    email: session.user.email ?? "",
    avatarUrl: session.user.image ?? null,
    roles: session.user.roles ?? [],
  } : null;
  const isAdmin = user?.roles?.includes(Roles.Admin) ?? false;
  const isKitchen = pathname.startsWith("/dashboard");
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;
  const navigation = (isKitchen ? kitchenNavigation : publicNavigation).map((item) =>
    item.href === "/dashboard/recipes" && !user
      ? { ...item, href: "/login?callbackUrl=%2Fdashboard%2Frecipes" }
      : item,
  );

  function logOut() {
    void signOut({ callbackUrl: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#ded3c5]/80 bg-[#fbf8f2]/90 backdrop-blur-xl">
      <div className="site-container flex h-[74px] items-center justify-between gap-5">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={cn("nav-link", isActive(pathname, item.href) && "text-[#1f4b3f] after:scale-x-100")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex h-11 max-w-56 items-center gap-2.5 rounded-full border border-[#d9cdbd] bg-white/75 py-1.5 pr-3 pl-1.5 text-left shadow-[0_5px_18px_rgba(72,54,38,.05)] outline-none transition hover:border-[#bcae9c] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1f4b3f]/30"
                  aria-label="Mở menu tài khoản"
                >
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#3a342f]">{user.fullName || "Tài khoản"}</span>
                  <ChevronDown className="size-4 shrink-0 text-[#82776e] transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl border border-[#ddd2c5] bg-[#fffdf9] p-1.5 shadow-[0_18px_45px_rgba(58,45,34,.14)]">
                <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2">
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-9 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#302a26]">{user.fullName || "Tài khoản"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accountNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 focus:bg-[#edf3ef]">
                      <Link href={item.href}>
                        <Icon className="size-4 text-[#1f4b3f]" />
                        <span className="font-semibold text-[#3b3530]">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={logOut} className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5"><LogOut />Đăng xuất</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild>
              <Link href={loginHref}><UserRound />Đăng nhập</Link>
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-controls="mobile-navigation" aria-label={isOpen ? "Đóng menu" : "Mở menu"}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>
      {isOpen && (
        <div id="mobile-navigation" className="border-t border-[#ded3c5] bg-[#fbf8f2] px-5 py-5 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Điều hướng di động">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={cn("rounded-xl px-3 py-3 font-semibold text-[#3e3833] hover:bg-[#f1e8db]", isActive(pathname, item.href) && "bg-[#dce8e1] text-[#1f4b3f]")}>
                {item.label}
              </Link>
            ))}
            {!user && <Button variant="outline" className="mt-3" asChild><Link href={loginHref}><UserRound />Đăng nhập</Link></Button>}
            {user && (
              <div className="mt-4 rounded-2xl border border-[#d9cdbd] bg-white/70 p-2">
                <div className="flex items-center gap-3 px-2 py-2">
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-10 text-xs" />
                  <span className="min-w-0 truncate text-sm font-bold">{user.fullName || "Tài khoản"}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1 border-t border-[#e6ddd2] pt-2">
                  {accountNavigation.map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#4a433d] hover:bg-[#edf3ef] hover:text-[#1f4b3f]"><Icon className="size-4" />{item.label}</Link>;
                  })}
                  <button type="button" onClick={logOut} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#a43d2c] hover:bg-[#f8e8e4]"><LogOut className="size-4" />Đăng xuất</button>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
