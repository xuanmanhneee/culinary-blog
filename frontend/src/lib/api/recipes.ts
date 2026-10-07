import type { RecipeDetailDto } from "@/lib/types/recipe";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function getRecipeBySlug(slug: string): Promise<RecipeDetailDto | null> {
  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/v1/recipes/${encodeURIComponent(slug)}`,
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
