/**
 * Gọi API quản lý công thức (dashboard) – FR-RCP-001/003–010. Mọi hàm nhận access token của
 * người đang đăng nhập; lỗi backend được ném ra dạng ApiError (RFC 7807).
 * Trang công khai (/recipes/[slug], tìm kiếm) dùng lib/api/recipes.ts.
 */
import { apiFetch, apiFetchWithHeaders } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";
import type { CategoryDto } from "@/lib/types/category";
import type {
  CreateIngredientRequest,
  CreateRecipeRequest,
  CreateStepRequest,
  RecipeDetailDto,
  RecipeImageDto,
  RecipeIngredientDto,
  RecipeListItemDto,
  RecipeQuery,
  RecipeStatus,
  RecipeStepDto,
  UpdateIngredientRequest,
  UpdateRecipeRequest,
  UpdateStepRequest,
} from "@/lib/types/recipe";

const RECIPES = "/api/v1/recipes";

type Token = string | null | undefined;

export interface MyRecipesQuery extends RecipeQuery {
  status?: RecipeStatus;
}

function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** RowVersion lấy từ header ETag (dạng "abc=="), dùng lại cho If-Match. */
function readEtag(headers: Headers, fallback: string): string {
  return headers.get("ETag") ?? `"${fallback}"`;
}

export interface RecipeWithEtag {
  recipe: RecipeDetailDto;
  /** Giá trị gửi lại qua If-Match ở lần cập nhật tiếp theo. */
  etag: string;
}

// ---------------------------------------------------------------- Recipe

/** GET /recipes?mine=true – công thức của chính mình, mọi trạng thái (FR-RCP-001). */
export function listMyRecipes(query: MyRecipesQuery, token: Token): Promise<PagedResult<RecipeListItemDto>> {
  return apiFetch(`${RECIPES}${toQueryString({ ...query, mine: true })}`, { token });
}

/** GET /recipes/{id} – trang sửa, kèm ETag (FR-RCP-004). */
export async function getRecipeById(id: string, token: Token): Promise<RecipeWithEtag> {
  const { data, headers } = await apiFetchWithHeaders<RecipeDetailDto>(`${RECIPES}/${id}`, { token });
  return { recipe: data, etag: readEtag(headers, data.rowVersion) };
}

/** POST /recipes – tạo bản nháp, có thể kèm nguyên liệu/bước (FR-RCP-003). */
export function createRecipe(body: CreateRecipeRequest, token: Token): Promise<RecipeDetailDto> {
  return apiFetch(RECIPES, { method: "POST", body, token });
}

/** PUT /recipes/{id} với If-Match; bản cũ → ApiError 422 RECIPE_CONCURRENCY_CONFLICT (FR-RCP-004). */
export async function updateRecipe(
  id: string,
  body: UpdateRecipeRequest,
  etag: string,
  token: Token,
): Promise<RecipeWithEtag> {
  const { data, headers } = await apiFetchWithHeaders<RecipeDetailDto>(`${RECIPES}/${id}`, {
    method: "PUT",
    body,
    token,
    headers: { "If-Match": etag },
  });
  return { recipe: data, etag: readEtag(headers, data.rowVersion) };
}

export type RecipeStatusAction = "publish" | "unpublish" | "archive";

/** PATCH /recipes/{id}/publish | unpublish | archive (FR-RCP-005/006). */
export function changeRecipeStatus(id: string, action: RecipeStatusAction, token: Token): Promise<RecipeDetailDto> {
  return apiFetch(`${RECIPES}/${id}/${action}`, { method: "PATCH", token });
}

/** DELETE /recipes/{id} – xóa vĩnh viễn (FR-RCP-007). */
export function deleteRecipe(id: string, token: Token): Promise<void> {
  return apiFetch(`${RECIPES}/${id}`, { method: "DELETE", token });
}

// ---------------------------------------------------------------- Nguyên liệu (FR-RCP-009)

export function addIngredient(recipeId: string, body: CreateIngredientRequest, token: Token): Promise<RecipeIngredientDto> {
  return apiFetch(`${RECIPES}/${recipeId}/ingredients`, { method: "POST", body, token });
}

export function updateIngredient(
  recipeId: string,
  ingredientId: string,
  body: UpdateIngredientRequest,
  token: Token,
): Promise<RecipeIngredientDto> {
  return apiFetch(`${RECIPES}/${recipeId}/ingredients/${ingredientId}`, { method: "PUT", body, token });
}

export function deleteIngredient(recipeId: string, ingredientId: string, token: Token): Promise<void> {
  return apiFetch(`${RECIPES}/${recipeId}/ingredients/${ingredientId}`, { method: "DELETE", token });
}

// ---------------------------------------------------------------- Các bước (FR-RCP-010)

export function addStep(recipeId: string, body: CreateStepRequest, token: Token): Promise<RecipeStepDto> {
  return apiFetch(`${RECIPES}/${recipeId}/steps`, { method: "POST", body, token });
}

export function updateStep(recipeId: string, stepId: string, body: UpdateStepRequest, token: Token): Promise<RecipeStepDto> {
  return apiFetch(`${RECIPES}/${recipeId}/steps/${stepId}`, { method: "PUT", body, token });
}

export function deleteStep(recipeId: string, stepId: string, token: Token): Promise<void> {
  return apiFetch(`${RECIPES}/${recipeId}/steps/${stepId}`, { method: "DELETE", token });
}

// ---------------------------------------------------------------- Ảnh (FR-RCP-008)

export function setPrimaryImage(recipeId: string, imageId: string, token: Token): Promise<RecipeImageDto[]> {
  return apiFetch(`${RECIPES}/${recipeId}/images/${imageId}/primary`, { method: "PATCH", token });
}

export function deleteImage(recipeId: string, imageId: string, token: Token): Promise<void> {
  return apiFetch(`${RECIPES}/${recipeId}/images/${imageId}`, { method: "DELETE", token });
}

// ---------------------------------------------------------------- Danh mục (cho form)

/** GET /categories – danh sách danh mục để chọn trong form (FR-CAT-001, public). */
export function listCategories(): Promise<CategoryDto[]> {
  return apiFetch("/api/v1/categories");
}
