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
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Suspense, useState } from "react";
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
import { canUseDashboard, Roles } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/recipes", label: "Tất cả món ăn" },
  { href: "/categories", label: "Danh mục" },
  { href: "/search", label: "Tìm công thức" },
  { href: "/random", label: "Gợi ý món" },
  { href: "/dashboard", label: "Bếp của tôi" },
];

const accountNavigation = [
  { href: "/account#profile", label: "Hồ sơ cá nhân", icon: UserRound },
  { href: "/dashboard", label: "Bếp của tôi", icon: BookOpenText },
  { href: "/account#settings", label: "Cài đặt tài khoản", icon: Settings },
  { href: "/account#help", label: "Trợ giúp", icon: CircleHelp },
] as const;

interface NavItem {
  href: string;
  label: string;
  /** Mục chỉ sáng khi đúng đường dẫn (tránh "/dashboard" sáng ở mọi trang con). */
  exact?: boolean;
  /** Mục nằm trên cùng đường dẫn nhưng phân biệt bằng ?tab=. */
  tab?: string;
}

// Điều hướng quản trị gộp chung vào header (trước đây lặp lại ở thanh tab trong dashboard).
const adminNavigation: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", exact: true },
  { href: "/dashboard/recipes", label: "Quản lý công thức" },
  { href: "/dashboard/recipes?tab=deleted", label: "Thùng rác", tab: "deleted" },
  { href: "/dashboard/users", label: "Quản lý người dùng" },
  { href: "/dashboard/categories", label: "Quản lý danh mục" },
  { href: "/dashboard/automation", label: "Tác vụ tự động" },
];

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
    <span className={cn("relative grid shrink-0 place-items-center rounded-full", isAdmin && "overflow-hidden before:absolute before:inset-0 before:rounded-full before:bg-[conic-gradient(var(--accent),#d9a441,#2f7965,#6a56a5,var(--accent))] before:animate-[spin_5s_linear_infinite]", className)}>
      <span className={cn("relative z-10 grid place-items-center overflow-hidden rounded-full bg-primary font-bold text-white", isAdmin ? "absolute inset-[2px]" : "size-full")}>
        {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes="44px" unoptimized className="object-cover" /> : getInitials(name, email)}
      </span>
    </span>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isItemActive(pathname: string, item: NavItem, tab: string | null): boolean {
  const route = item.href.split("?")[0];
  if (item.tab) return pathname === route && tab === item.tab;
  const base = item.exact ? pathname === route : isActive(pathname, route);
  // Khi đang ở tab riêng của cùng đường dẫn (vd. thùng rác) thì mục gốc không sáng.
  return base && !(pathname === route && tab === "deleted");
}

/**
 * Danh sách link điều hướng. Tách riêng vì useSearchParams cần Suspense; fallback hiển thị
 * cùng các link (chưa đánh dấu active) nên header vẫn có trong HTML render sẵn.
 */
function NavLinks({ items, variant, onNavigate }: { items: NavItem[]; variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinkList items={items} variant={variant} tab={null} active={false} onNavigate={onNavigate} />}>
      <NavLinksWithTab items={items} variant={variant} onNavigate={onNavigate} />
    </Suspense>
  );
}

function NavLinksWithTab({ items, variant, onNavigate }: { items: NavItem[]; variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const tab = useSearchParams().get("tab");
  return <NavLinkList items={items} variant={variant} tab={tab} active onNavigate={onNavigate} />;
}

function NavLinkList({ items, variant, tab, active, onNavigate }: { items: NavItem[]; variant: "desktop" | "mobile"; tab: string | null; active: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return items.map((item) => {
    const current = active && isItemActive(pathname, item, tab);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={current ? "page" : undefined}
        className={variant === "desktop"
          ? cn("nav-link", current && "text-primary after:scale-x-100")
          : cn("rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted", current && "bg-primary-soft text-primary")}
      >
        {item.label}
      </Link>
    );
  });
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
  const showWorkspace = canUseDashboard(user?.roles);
  const accountItems = isAdmin
    ? []
    : accountNavigation.filter((item) => item.href !== "/dashboard" || showWorkspace);
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;
  const navigation: NavItem[] = isAdmin
    ? adminNavigation
    : navigationItems.filter((item) => item.href !== "/dashboard" || showWorkspace);

  function logOut() {
    void signOut({ callbackUrl: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-muted/90 backdrop-blur-xl">
      <div className="site-container flex h-[74px] items-center justify-between gap-5">
        <Logo href={isAdmin ? "/dashboard" : "/"} label={isAdmin ? "Bếp Nhà - Tổng quan quản trị" : "Bếp Nhà - Trang chủ"} />
        <nav className={cn("hidden items-center lg:flex", isAdmin ? "gap-5 xl:gap-7" : "gap-7")} aria-label="Điều hướng chính">
          <NavLinks items={navigation} variant="desktop" />
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="group flex h-10 max-w-56 items-center gap-2.5 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label="Mở menu tài khoản"
                >
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{user.fullName || "Tài khoản"}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-xl border border-border bg-card p-1.5 shadow-sm">
                <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2">
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-9 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{user.fullName || "Tài khoản"}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accountItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2.5 focus:bg-primary-soft">
                      <Link href={item.href}>
                        <Icon className="size-4 text-primary" />
                        <span className="font-semibold text-foreground">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                {accountItems.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem variant="destructive" onSelect={logOut} className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2.5"><LogOut />Đăng xuất</DropdownMenuItem>
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
        <div id="mobile-navigation" className="border-t border-border bg-card px-5 py-4 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Điều hướng di động">
            <NavLinks items={navigation} variant="mobile" onNavigate={() => setIsOpen(false)} />
            {!user && <Button variant="outline" className="mt-3" asChild><Link href={loginHref}><UserRound />Đăng nhập</Link></Button>}
            {user && (
              <div className="mt-4 rounded-xl border border-border p-2">
                <div className="flex items-center gap-3 px-2 py-2">
                  <UserAvatar avatarUrl={user.avatarUrl} name={user.fullName} email={user.email} isAdmin={isAdmin} className="size-10 text-xs" />
                  <span className="min-w-0 truncate text-sm font-bold">{user.fullName || "Tài khoản"}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                  {accountItems.map((item) => {
                    const Icon = item.icon;
                    return <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-soft hover:text-primary"><Icon className="size-4" />{item.label}</Link>;
                  })}
                  <button type="button" onClick={logOut} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-accent-hover hover:bg-accent-soft"><LogOut className="size-4" />Đăng xuất</button>
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
