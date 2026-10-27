"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar, type DashboardUser } from "./DashboardTopbar";

/**
 * Khung chung khu /dashboard: thanh trên + sidebar (desktop cố định bên trái, mobile mở bằng nút menu).
 */
export function DashboardShell({ user, children }: { user: DashboardUser; children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <DashboardTopbar
        user={user}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((open) => !open)}
      />

      {isMenuOpen && (
        <DashboardSidebar
          roles={user.roles}
          onNavigate={() => setIsMenuOpen(false)}
          className="border-b bg-sidebar md:hidden"
        />
      )}

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
          <DashboardSidebar roles={user.roles} className="sticky top-14" />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
