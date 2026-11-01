"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";

export interface SearchRecipeItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  rank: number;
}

interface RecipeSearchState {
  key: string | null;
  data: PagedResult<SearchRecipeItem> | null;
  error: string | null;
}

export function useRecipeSearch(
  searchTerm: string,
  categorySlug: string,
  page: number,
  pageSize = 10,
) {
  const query = searchTerm.trim();
  const selectedCategory = categorySlug.trim();
  const requestKey = query.length >= 2
    ? `${query}\u0000${selectedCategory}\u0000${page}\u0000${pageSize}`
    : null;
  const [state, setState] = useState<RecipeSearchState>({
    key: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!requestKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (selectedCategory) params.set("categorySlug", selectedCategory);

    void apiFetch<PagedResult<SearchRecipeItem>>(
      `/recipes/search?${params}`,
      { signal: controller.signal },
    ).then(
      (data) => {
        if (!controller.signal.aborted) {
          setState({ key: requestKey, data, error: null });
        }
      },
      (requestError: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            data: null,
            error: requestError instanceof Error
              ? requestError.message
              : "Không thể tìm công thức.",
          });
        }
      },
    );

    return () => controller.abort();
  }, [requestKey, query, selectedCategory, page, pageSize]);

  if (!requestKey) {
    return { data: null, isLoading: false, error: null };
  }

  if (state.key !== requestKey) {
    return { data: null, isLoading: true, error: null };
  }

  return { data: state.data, isLoading: false, error: state.error };
}
