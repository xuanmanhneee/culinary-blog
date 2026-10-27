import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
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
        <AuthSessionProvider>
          <div className="min-h-screen flex flex-col overflow-x-clip">{children}</div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
