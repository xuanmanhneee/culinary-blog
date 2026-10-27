import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Bếp Nhà",
    default: "Quản lý công thức | Bếp Nhà",
  },
};

/**
 * Nhóm trang /dashboard/recipes/* (FR-RCP). Khung (thanh trên, sidebar) và kiểm tra đăng nhập
 * nằm ở app/(dashboard)/dashboard/layout.tsx; layout này chỉ đặt title chung.
 */
export default function RecipeDashboardLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl">{children}</div>;
}
