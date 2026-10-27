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

export function useRecipeSearch(searchTerm: string, page: number, pageSize = 10) {
  const [data, setData] = useState<PagedResult<SearchRecipeItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) { setData(null); setError(null); setIsLoading(false); return; }
    const controller = new AbortController();
    setIsLoading(true); setError(null);
    void apiFetch<PagedResult<SearchRecipeItem>>(`/recipes/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((requestError: unknown) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Không thể tìm công thức."); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [searchTerm, page, pageSize]);

  return { data, isLoading, error };
}
