import { apiFetch, type ApiFetchOptions } from "@/lib/api/client";
import { API_V1 } from "@/lib/config/env";
import type { EngagementSummary, SavedRecipePage } from "@/lib/types/engagement";

function engagementFetch<T>(path: string, options?: ApiFetchOptions) {
  return apiFetch<T>(path, { ...options, baseUrl: API_V1 });
}

export const getEngagementSummary = (recipeId: string, token?: string | null, signal?: AbortSignal) =>
  engagementFetch<EngagementSummary>(`/ratings/${recipeId}`, { token, signal, cache: "no-store" });

export const saveRecipe = (recipeId: string, slug: string, token: string) =>
  engagementFetch<void>(`/saved-recipes/${recipeId}`, { method: "PUT", token, body: { slug } });

export const unsaveRecipe = (recipeId: string, token: string) =>
  engagementFetch<void>(`/saved-recipes/${recipeId}`, { method: "DELETE", token });

export const rateRecipe = (recipeId: string, slug: string, score: number, token: string) =>
  engagementFetch<void>(`/ratings/${recipeId}`, { method: "PUT", token, body: { slug, score } });

export const getSavedRecipes = (page: number, pageSize: number, token: string) =>
  engagementFetch<SavedRecipePage>(`/saved-recipes?page=${page}&pageSize=${pageSize}`, { token, cache: "no-store" });
