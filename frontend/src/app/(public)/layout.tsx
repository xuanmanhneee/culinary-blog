import type { ReactNode } from "react";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
