import { apiFetch, publicDataCache, type ApiFetchOptions } from "@/lib/api/client";
import { API_V1 } from "@/lib/config/env";
import type { EngagementSummary, RatingSummary, SavedRecipePage } from "@/lib/types/engagement";

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

export type RatingMap = Record<string, { average: number; count: number }>;

/**
 * Điểm trung bình của nhiều món trong một request. Engagement là dịch vụ phụ nên mọi lỗi
 * (mạng, timeout, 5xx) đều trả về bảng rỗng để UI ẩn số sao thay vì làm hỏng trang danh sách.
 */
export async function getRatingSummaries(recipeIds: string[]): Promise<RatingMap> {
  const ids = [...new Set(recipeIds)];
  if (ids.length === 0) return {};
  try {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
    const pages = await Promise.all(
      chunks.map((chunk) =>
        engagementFetch<RatingSummary[]>(`/ratings/summaries?ids=${chunk.join(",")}`, {
          signal: AbortSignal.timeout(2500),
          ...publicDataCache(60, ["ratings"]),
        }),
      ),
    );
    const map: RatingMap = {};
    for (const item of pages.flat()) {
      if (item.ratingCount > 0) map[item.recipeId] = { average: item.averageRating, count: item.ratingCount };
    }
    return map;
  } catch {
    return {};
  }
}
