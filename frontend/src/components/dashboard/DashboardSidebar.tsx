"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types/auth";
import { isNavItemActive, visibleNavItems } from "./dashboard-nav";

interface DashboardSidebarProps {
  roles: Role[];
  /** Gọi sau khi chọn một mục (đóng menu trên mobile). */
  onNavigate?: () => void;
  className?: string;
}

export function DashboardSidebar({ roles, onNavigate, className }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng quản trị" className={cn("flex flex-col gap-1 p-3", className)}>
      {visibleNavItems(roles).map((item) => {
        const active = isNavItemActive(item, pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
