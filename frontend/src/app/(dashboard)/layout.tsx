import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";

/**
 * Layout của khu vực /dashboard (CSR, cần đăng nhập). Bọc TanStack Query ở cấp route group.
 */
export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
