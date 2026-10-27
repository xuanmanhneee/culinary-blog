import type { Metadata } from "next";
import { mockCategories } from "@/lib/mocks/recipes";
import { RecipeFormWizard } from "../_components/recipe-form/RecipeFormWizard";

export const metadata: Metadata = {
  title: "Tạo công thức",
};

/**
 * /dashboard/recipes/new – form tạo công thức nhiều bước (FR-RCP-003): React Hook Form + Zod,
 * dữ liệu giữ trong recipe-form-store. Giao diện tĩnh: danh mục lấy từ dữ liệu mẫu.
 */
export default function NewRecipePage() {
  return <RecipeFormWizard mode="create" categories={mockCategories} />;
}
