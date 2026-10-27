import type { Metadata } from "next";
import { RecipeFormWizard } from "../../_components/recipe-form/RecipeFormWizard";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Sửa công thức",
};

/**
 * /dashboard/recipes/[id]/edit – sửa công thức theo id (slug có thể đổi khi còn Draft).
 * Dữ liệu tải phía client: GET /api/v1/recipes/{id} (kèm ETag), lưu bằng PUT kèm If-Match (FR-RCP-004)
 * rồi đồng bộ nguyên liệu/các bước (FR-RCP-009/010). Không tồn tại / không có quyền → báo lỗi trong trang.
 */
export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  return <RecipeFormWizard mode="edit" recipeId={id} />;
}
