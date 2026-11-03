import type { Metadata } from "next";
import { getPublicCategories, getPublicRecipePool } from "@/lib/api/recipes";
import { RandomRecipePicker } from "./RandomRecipePicker";

export const metadata: Metadata = {
  title: "Không biết ăn gì?",
  description: "Để Bếp Nhà chọn ngẫu nhiên một món ngon cho bữa ăn tiếp theo của bạn.",
};

// The random pool must reflect currently published recipes and must not require the API
// to be reachable while producing the frontend build artifact.
export const dynamic = "force-dynamic";

export default async function RandomRecipePage() {
  const [recipes, categories] = await Promise.all([getPublicRecipePool(), getPublicCategories()]);

  return <RandomRecipePicker recipes={recipes.items} categories={categories} />;
}
