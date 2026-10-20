import type { Metadata } from "next";
import { RecipeListView } from "./_components/RecipeListView";

export const metadata: Metadata = {
  // Template "%s | ..." của layout chỉ áp dụng cho trang con, trang cùng cấp phải ghi đầy đủ.
  title: { absolute: "Công thức của tôi | Quản lý công thức | Culinary Blog" },
};

/**
 * /dashboard/recipes – danh sách công thức của tác giả đang đăng nhập (Draft, Published, Archived).
 * Dữ liệu tải phía client qua TanStack Query: GET /api/v1/recipes?mine=true kèm access token (FR-RCP-001).
 */
export default function RecipeDashboardPage() {
  return <RecipeListView />;
}
