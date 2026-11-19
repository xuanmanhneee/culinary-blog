import { API_V1 } from "@/lib/config/env";
import { apiFetch, publicDataCache } from "@/lib/api/client";
import type { CategoryDetailDto, CategoryDto } from "@/lib/types/category";
import type { PagedResult } from "@/lib/types/api";
import type { RecipeDetailDto, RecipeListItemDto } from "@/lib/types/recipe";
import type { RecipeQuery } from "@/lib/types/recipe";

export async function getPublicCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>("/categories", publicDataCache(300, ["categories"]));
}

export async function getPublicCategory(slug: string, page = 1): Promise<CategoryDetailDto> {
  return apiFetch<CategoryDetailDto>(
    `/categories/${encodeURIComponent(slug)}?page=${page}&pageSize=12&sort=-createdAt`,
    publicDataCache(300, ["categories", "recipes", `category:${slug}`]),
  );
}

export async function getLatestPublicRecipes(pageSize = 6): Promise<PagedResult<RecipeListItemDto>> {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(pageSize),
    sort: "-createdAt",
  });

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${query}`, publicDataCache(300, ["recipes"]));
}

export async function getPublicRecipes(query: RecipeQuery = {}): Promise<PagedResult<RecipeListItemDto>> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 12),
    sort: query.sort ?? "-createdAt",
  });

  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.difficulty !== undefined) params.set("difficulty", String(query.difficulty));
  if (query.minPrepTime !== undefined) params.set("minPrepTime", String(query.minPrepTime));
  if (query.maxCookTime !== undefined) params.set("maxCookTime", String(query.maxCookTime));
  if (query.minServings !== undefined) params.set("minServings", String(query.minServings));
  if (query.status !== undefined) params.set("status", String(query.status));

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${params}`, publicDataCache(60, ["recipes"]));
}

export async function getPublicRecipePool(pageSize = 50): Promise<PagedResult<RecipeListItemDto>> {
  const query = new URLSearchParams({
    page: "1",
    pageSize: String(Math.min(pageSize, 50)),
    sort: "-createdAt",
  });

  return apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${query}`, publicDataCache(60, ["recipes"]));
}

export async function getRecipeBySlug(slug: string): Promise<RecipeDetailDto | null> {
  const response = await fetch(
    `${API_V1}/recipes/${encodeURIComponent(slug)}`,
    publicDataCache(300, ["recipes", `recipe:${slug}`]),
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch recipe (${response.status}).`);
  }

  return response.json() as Promise<RecipeDetailDto>;
}
