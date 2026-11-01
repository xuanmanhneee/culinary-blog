"use client";

/**
 * Hook TanStack Query cho dashboard công thức. Query key tập trung ở `recipeKeys` để mutation
 * làm mới (invalidate) đúng dữ liệu sau khi tạo/sửa/đổi trạng thái/xóa.
 */
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeRecipeStatus,
  createRecipe,
  deleteRecipe,
  getRecipeById,
  listCategories,
  listMyRecipes,
  updateRecipe,
  type MyRecipesQuery,
  type RecipeStatusAction,
} from "@/lib/api/recipe-management";
import { saveRecipeEdit } from "@/lib/api/recipe-sync";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import type { RecipeFormDraft } from "@/lib/stores/recipe-form-store";
import {
  RecipeStatus,
  type CreateRecipeRequest,
  type RecipeDetailDto,
  type UpdateRecipeRequest,
} from "@/lib/types/recipe";

export const recipeKeys = {
  all: ["recipes"] as const,
  mine: () => [...recipeKeys.all, "mine"] as const,
  mineList: (query: MyRecipesQuery) => [...recipeKeys.mine(), "list", query] as const,
  mineCount: (status: RecipeStatus | "all") => [...recipeKeys.mine(), "count", status] as const,
  detail: (id: string) => [...recipeKeys.all, "detail", id] as const,
  categories: ["categories"] as const,
};

/** Danh sách công thức của tôi theo trang/tab (GET /recipes?mine=true). */
export function useMyRecipes(query: MyRecipesQuery) {
  const { token, isReady } = useAccessToken();
  return useQuery({
    queryKey: recipeKeys.mineList(query),
    queryFn: () => listMyRecipes(query, token),
    enabled: isReady,
    // Giữ trang cũ trong lúc tải trang mới để bảng không nháy trống.
    placeholderData: keepPreviousData,
  });
}

const countStatuses = ["all", RecipeStatus.Draft, RecipeStatus.Published, RecipeStatus.Archived] as const;

/** Số công thức theo từng tab (Tất cả / Bản nháp / Đã xuất bản / Đã lưu trữ), mỗi tab 1 request pageSize=1. */
export function useMyRecipeCounts(): Record<(typeof countStatuses)[number], number | undefined> {
  const { token, isReady } = useAccessToken();
  const results = useQueries({
    queries: countStatuses.map((status) => ({
      queryKey: recipeKeys.mineCount(status),
      queryFn: () => listMyRecipes({ pageSize: 1, status: status === "all" ? undefined : status }, token),
      enabled: isReady,
      select: (page: { totalCount: number }) => page.totalCount,
    })),
  });
  return Object.fromEntries(countStatuses.map((status, index) => [status, results[index].data])) as Record<
    (typeof countStatuses)[number],
    number | undefined
  >;
}

/** Chi tiết công thức cho trang sửa, kèm ETag (GET /recipes/{id}). Không truyền id thì không tải. */
export function useRecipeForEdit(id: string | undefined) {
  const { token, isReady } = useAccessToken();
  return useQuery({
    queryKey: recipeKeys.detail(id ?? ""),
    queryFn: () => getRecipeById(id!, token),
    enabled: isReady && Boolean(id),
    // Trang sửa luôn lấy bản mới nhất để RowVersion (If-Match) không bị cũ.
    staleTime: 0,
  });
}

/** Danh mục cho ô chọn trong form – ít thay đổi nên cache lâu. */
export function useCategories() {
  return useQuery({ queryKey: recipeKeys.categories, queryFn: listCategories, staleTime: 10 * 60 * 1000 });
}

export function useChangeRecipeStatus() {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: RecipeStatusAction }) => changeRecipeStatus(id, action, token),
    onSuccess: (recipe) => {
      void queryClient.invalidateQueries({ queryKey: recipeKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipe.id) });
    },
  });
}

export function useDeleteRecipe() {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecipe(id, token),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: recipeKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: recipeKeys.mine() });
    },
  });
}

export function useCreateRecipe() {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRecipeRequest) => createRecipe(body, token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: recipeKeys.mine() }),
  });
}

/**
 * Lưu form sửa: PUT thông tin chính (If-Match) rồi đồng bộ nguyên liệu/các bước (saveRecipeEdit).
 * Thành công → cache chi tiết nhận bản mới (ETag mới); lỗi → tải lại chi tiết vì có thể đã lưu một phần.
 */
export function useSaveRecipeEdit(id: string) {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ original, draft, etag }: { original: RecipeDetailDto; draft: RecipeFormDraft; etag: string }) =>
      saveRecipeEdit(original, draft, etag, token),
    onSuccess: (result) => {
      queryClient.setQueryData(recipeKeys.detail(id), result);
      void queryClient.invalidateQueries({ queryKey: recipeKeys.mine() });
    },
    onError: () => void queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) }),
  });
}

export function useUpdateRecipe(id: string) {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ body, etag }: { body: UpdateRecipeRequest; etag: string }) => updateRecipe(id, body, etag, token),
    onSuccess: (result) => {
      queryClient.setQueryData(recipeKeys.detail(id), result);
      void queryClient.invalidateQueries({ queryKey: recipeKeys.mine() });
    },
  });
}
