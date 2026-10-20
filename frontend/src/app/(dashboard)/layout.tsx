import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

/**
 * Layout của khu vực /dashboard (CSR, cần đăng nhập). Bọc TanStack Query và Toaster ở đây thay vì
 * root layout để các trang public (SSR/ISR) không phải tải thêm thư viện phía client.
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
