import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <QueryProvider><main className="flex-1">{children}</main><Footer /></QueryProvider>;
}
