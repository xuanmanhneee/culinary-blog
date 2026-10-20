"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Roles, type Role } from "@/lib/types/auth";

export interface DashboardUser {
  name: string | null;
  email: string | null;
  roles: Role[];
}

interface DashboardTopbarProps {
  user: DashboardUser;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

function initials(user: DashboardUser): string {
  const source = user.name?.trim() || user.email || "?";
  return source
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardTopbar({ user, isMenuOpen, onToggleMenu }: DashboardTopbarProps) {
  const roleLabel = user.roles.includes(Roles.Admin) ? "Quản trị viên" : "Tác giả";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleMenu}
        aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={isMenuOpen}
      >
        {isMenuOpen ? <X /> : <Menu />}
      </Button>

      <Link href="/dashboard/recipes" className="font-heading text-lg font-semibold text-emerald-800">
        Culinary Blog
        <span className="ml-2 text-sm font-normal text-muted-foreground">Quản trị</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/">
            <ExternalLink />
            Xem trang web
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Tài khoản">
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white"
              >
                {initials(user)}
              </span>
              <span className="hidden max-w-40 truncate sm:inline">{user.name ?? user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate">{user.name ?? "Tài khoản"}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
              <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOut({ callbackUrl: "/" })}>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
