import { API_V1 } from "@/lib/config/env";
import type { RecipeDetailDto } from "@/lib/types/recipe";

export async function getRecipeBySlug(slug: string): Promise<RecipeDetailDto | null> {
  const response = await fetch(
    `${API_V1}/recipes/${encodeURIComponent(slug)}`,
    { next: { revalidate: 300, tags: ["recipes", `recipe:${slug}`] } },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe (${response.status}).`);
  }

  return response.json() as Promise<RecipeDetailDto>;
}
