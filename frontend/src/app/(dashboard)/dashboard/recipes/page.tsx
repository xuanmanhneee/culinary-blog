import type { Metadata } from "next";
import { mockDashboardRecipes } from "@/lib/mocks/recipes";
import { RecipeListView } from "./_components/RecipeListView";

export const metadata: Metadata = {
  // Template "%s | ..." của layout chỉ áp dụng cho trang con, trang cùng cấp phải ghi đầy đủ.
  title: { absolute: "Công thức của tôi | Quản lý công thức | Culinary Blog" },
};

/**
 * /dashboard/recipes – danh sách công thức của tác giả đang đăng nhập (Draft, Published, Archived).
 * Giao diện tĩnh dùng dữ liệu mẫu; khi nối API sẽ lấy từ GET /api/v1/recipes kèm access token (FR-RCP-001).
 */
export default function RecipeDashboardPage() {
  return <RecipeListView initialRecipes={mockDashboardRecipes} />;
}
