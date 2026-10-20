import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
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
        <div className="flex min-h-screen flex-col overflow-x-clip">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
