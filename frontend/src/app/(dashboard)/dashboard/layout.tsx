import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Roles } from "@/lib/types/auth";

export const metadata: Metadata = {
  // Khu vực quản trị, không cho công cụ tìm kiếm index.
  robots: { index: false, follow: false },
};

/**
 * Layout chung cho mọi trang /dashboard/*. Chỉ người đã đăng nhập với role Author hoặc Admin
 * được vào (backend vẫn kiểm tra lại quyền ở từng API).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roles = session.user.roles ?? [];
  if (!roles.some((role) => role === Roles.Author || role === Roles.Admin)) {
    redirect("/");
  }

  return (
    <DashboardShell
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, roles }}
    >
      {children}
    </DashboardShell>
  );
}
