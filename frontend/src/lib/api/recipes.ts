import { API_V1 } from "@/lib/config/env";
import { apiFetch } from "@/lib/api/client";
import type { CategoryDto } from "@/lib/types/category";
import type { PagedResult } from "@/lib/types/api";
import type { RecipeDetailDto, RecipeListItemDto } from "@/lib/types/recipe";
import type { RecipeQuery } from "@/lib/types/recipe";

export async function getPublicCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>("/categories", {
    next: { revalidate: 300, tags: ["categories"] },
  });
}

export async function getLatestPublicRecipes(pageSize = 6): Promise<PagedResult<RecipeListItemDto>> {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(pageSize),
    sort: "-createdAt",
  });

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${query}`, {
    next: { revalidate: 300, tags: ["recipes"] },
  });
}

export async function getPublicRecipes(query: RecipeQuery = {}): Promise<PagedResult<RecipeListItemDto>> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 12),
    sort: query.sort ?? "-createdAt",
  });

  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.difficulty !== undefined) params.set("difficulty", String(query.difficulty));
  if (query.maxCookTime !== undefined) params.set("maxCookTime", String(query.maxCookTime));

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${params}`, {
    next: { revalidate: 60, tags: ["recipes"] },
  });
}

export async function getPublicRecipePool(pageSize = 50): Promise<PagedResult<RecipeListItemDto>> {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(Math.min(pageSize, 50)),
    sort: "-createdAt",
  });

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${query}`, {
    next: { revalidate: 60, tags: ["recipes"] },
  });
}

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
