import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <><main className="flex-1">{children}</main><Footer /></>;
}
