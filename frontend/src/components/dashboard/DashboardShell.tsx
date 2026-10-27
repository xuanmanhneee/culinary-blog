"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "./DashboardSidebar";
import type { DashboardUser } from "./DashboardTopbar";

/**
 * Khung chung khu /dashboard: thanh trên + sidebar (desktop cố định bên trái, mobile mở bằng nút menu).
 */
export function DashboardShell({ user, children }: { user: DashboardUser; children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      {isMenuOpen && (
        <DashboardSidebar
          roles={user.roles}
          onNavigate={() => setIsMenuOpen(false)}
          className="border-b bg-sidebar md:hidden"
        />
      )}

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
          <DashboardSidebar roles={user.roles} className="sticky top-0" />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mb-4 md:hidden"><Button variant="outline" size="sm" onClick={() => setIsMenuOpen((open) => !open)}>{isMenuOpen ? <X /> : <Menu />} {isMenuOpen ? "Đóng menu" : "Mở menu"}</Button></div>
          {children}
        </main>
      </div>
    </div>
  );
}
