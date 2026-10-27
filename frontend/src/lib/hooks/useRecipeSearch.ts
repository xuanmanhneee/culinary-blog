"use client";

import { useEffect, useState } from "react";
import { API_V1 } from "@/lib/config/env";
import type { SearchRecipesResponse } from "@/lib/types/recipe";

interface RecipeSearchState {
  data: SearchRecipesResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface StoredRecipeSearchState extends RecipeSearchState {
  key: string | null;
}

export function useRecipeSearch(
  searchTerm: string,
  page: number,
  pageSize = 10,
): RecipeSearchState {
  const query = searchTerm.trim();
  const searchKey = query.length >= 2 ? `${query}\u0000${page}\u0000${pageSize}` : null;
  const [state, setState] = useState<StoredRecipeSearchState>({
    key: null,
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!searchKey) return;

    const controller = new AbortController();

    async function search() {
      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          pageSize: String(pageSize),
        });
        const response = await fetch(
          `${API_V1}/recipes/search?${params}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => null) as {
            detail?: unknown;
            title?: unknown;
          } | null;
          const message = typeof body?.detail === "string"
            ? body.detail
            : typeof body?.title === "string"
              ? body.title
              : `Không thể tìm công thức (HTTP ${response.status}).`;
          throw new Error(message);
        }

        const data = await response.json() as SearchRecipesResponse;
        if (controller.signal.aborted) {
          return;
        }
        setState({ key: searchKey, data, isLoading: false, error: null });
      } catch (searchError) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          key: searchKey,
          data: null,
          isLoading: false,
          error: searchError instanceof Error
            ? searchError.message
            : "Đã xảy ra lỗi khi tìm công thức.",
        });
      }
    }

    void search();
    return () => controller.abort();
  }, [searchKey, query, page, pageSize]);

  if (!searchKey) {
    return { data: null, isLoading: false, error: null };
  }

  return state.key === searchKey
    ? state
    : { data: null, isLoading: true, error: null };
}
