import type { Metadata } from "next";

export const metadata: Metadata = {
  // Template "%s | ..." của layout chỉ áp dụng cho trang con, trang cùng cấp phải ghi đầy đủ.
  title: { absolute: "Công thức của tôi | Quản lý công thức | Culinary Blog" },
};

/**
 * /dashboard/recipes – danh sách công thức của tác giả đang đăng nhập (Draft, Published, Archived).
 * Dữ liệu: GET /api/v1/recipes kèm access token (FR-RCP-001); thao tác publish/archive/xóa (FR-RCP-005/006/007).
 */
export default function RecipeDashboardPage() {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Công thức của tôi</h2>
      <p className="text-sm text-zinc-600">Danh sách công thức đang được xây dựng.</p>
    </section>
  );
}
