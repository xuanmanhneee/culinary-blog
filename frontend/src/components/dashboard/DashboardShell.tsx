"use client";

import { BookOpenText, ClipboardList, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const workspaceLinks = [
  { href: "/dashboard", label: "Bếp đang làm", icon: ClipboardList },
  { href: "/dashboard/recipes", label: "Công thức của tôi", icon: BookOpenText },
  { href: "/dashboard/recipes?tab=saved", label: "Món đã lưu", icon: Heart, tab: "saved" },
  { href: "/dashboard/recipes?tab=deleted", label: "Thùng rác", icon: Trash2, tab: "deleted" },
];

export function DashboardShell({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  const pathname = usePathname();
  const currentTab = useSearchParams().get("tab");
  // Admin điều hướng bằng header chung (xem components/layout/Header.tsx), không lặp lại thanh tab ở đây.
  const links = isAdmin ? [] : workspaceLinks;
  return (
    <main className="min-h-[calc(100vh-74px)] bg-muted/60 px-4 py-7 sm:px-6 md:px-8 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-[1440px]">
        {!isAdmin && <nav aria-label="Điều hướng Bếp của tôi" className="mb-7 flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card p-2">
          {links.map(({ href, label, icon: Icon, tab }) => {
            const route = href.split("?")[0];
            const exact = pathname === route && (tab ? currentTab === tab : !currentTab);
            const active = exact || (!tab && route !== "/dashboard" && !currentTab && pathname.startsWith(`${route}/`));
            return (
              <Button key={href} asChild variant={active ? "secondary" : "ghost"} className="justify-start px-3">
                <Link href={href} aria-current={exact ? "page" : active ? "location" : undefined}>
                  <Icon aria-hidden="true" />
                  {label}
                </Link>
              </Button>
            );
          })}
        </nav>}
        {children}
      </div>
    </main>
  );
}
