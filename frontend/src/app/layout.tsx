import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Header } from "@/components/layout/Header";
import { SITE_URL } from "@/lib/config/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bếp Nhà — Gói trọn vị ngon trong từng câu chuyện",
    template: "%s | Bếp Nhà",
  },
  description: "Khám phá những công thức gần gũi, câu chuyện căn bếp và cảm hứng nấu ăn mỗi ngày từ cộng đồng Bếp Nhà.",
  keywords: ["công thức nấu ăn", "ẩm thực Việt", "blog ẩm thực", "Bếp Nhà"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full scroll-smooth antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full">
        <AuthSessionProvider>
          <QueryProvider>
            <div className="min-h-screen overflow-x-clip"><Header />{children}</div>
            <Toaster position="bottom-right" richColors />
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
