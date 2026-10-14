"use client";

import { useEffect, useState } from "react";
import { API_V1 } from "@/lib/config/env";
import type { SearchRecipesResponse } from "@/lib/types/recipe";

interface RecipeSearchState {
  data: SearchRecipesResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useRecipeSearch(
  searchTerm: string,
  page: number,
  pageSize = 10,
): RecipeSearchState {
  const [state, setState] = useState<RecipeSearchState>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState((current) => ({ ...current, isLoading: true, error: null }));

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
        setState({ data, isLoading: false, error: null });
      } catch (searchError) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
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
  }, [searchTerm, page, pageSize]);

  return state;
}
