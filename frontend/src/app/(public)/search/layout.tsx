import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tìm kiếm công thức",
  description: "Tìm công thức theo từ khóa, danh mục và thời gian nấu.",
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: LayoutProps<"/search">) {
  return children;
}
