import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Roles } from "@/lib/types/auth";
import { RecipeFormWizard } from "../_components/recipe-form/RecipeFormWizard";

export const metadata: Metadata = {
  title: "Tạo công thức",
};

/**
 * /dashboard/recipes/new – form tạo công thức nhiều bước (FR-RCP-003): React Hook Form + Zod,
 * dữ liệu giữ trong recipe-form-store, lưu bằng POST /api/v1/recipes (recipe mới ở trạng thái Draft).
 */
export default async function NewRecipePage() {
  const session = await auth();
  if (session?.user.roles?.includes(Roles.Admin)) redirect("/dashboard/recipes");
  return <RecipeFormWizard mode="create" />;
}
