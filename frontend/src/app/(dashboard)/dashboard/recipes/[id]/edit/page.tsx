import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMockRecipeDetail, mockCategories } from "@/lib/mocks/recipes";
import { RecipeFormWizard } from "../../_components/recipe-form/RecipeFormWizard";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Sửa công thức",
};

/**
 * /dashboard/recipes/[id]/edit – sửa công thức theo id (slug có thể đổi khi còn Draft).
 * Giao diện tĩnh: dữ liệu lấy từ getMockRecipeDetail; khi nối API dùng GET /api/v1/recipes/{id}
 * (kèm ETag) và PUT kèm If-Match (FR-RCP-004).
 */
export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const recipe = getMockRecipeDetail(id);

  if (!recipe) {
    notFound();
  }

  return <RecipeFormWizard mode="edit" categories={mockCategories} recipe={recipe} />;
}
