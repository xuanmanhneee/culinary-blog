import type { ReactNode } from "react";

/**
 * Vùng nội dung khu /dashboard. Điều hướng được xử lý bởi header chung theo ngữ cảnh.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-74px)] bg-[#f8f2e9] px-4 py-7 sm:px-6 md:px-8 lg:px-10 lg:py-9">
      <div className="mx-auto w-full max-w-[1440px]">{children}</div>
    </main>
  );
}
