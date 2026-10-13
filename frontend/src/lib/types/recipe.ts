/**
 * Kiểu dữ liệu module Recipe (FR-RCP), khớp với DTO backend
 * CulinaryBlog.Application.Recipes.Models (RecipeDto.cs, RecipeRequests.cs).
 * Enum được backend gửi dạng số; field nullable bên C# là `| null` ở đây.
 */
import type { Guid, IsoDateTime, PagedResult } from "./api";

// ---------------------------------------------------------------- Enum

export const RecipeDifficulty = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
} as const;
export type RecipeDifficulty = (typeof RecipeDifficulty)[keyof typeof RecipeDifficulty];

export const RecipeStatus = {
  Draft: 0,
  Published: 1,
  Archived: 2,
} as const;
export type RecipeStatus = (typeof RecipeStatus)[keyof typeof RecipeStatus];

export const RECIPE_DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  1: "Dễ",
  2: "Trung bình",
  3: "Khó",
  4: "Chuyên gia",
};

export const RECIPE_STATUS_LABELS: Record<RecipeStatus, string> = {
  0: "Bản nháp",
  1: "Đã xuất bản",
  2: "Đã lưu trữ",
};

/** Giá trị `sort` của GET /api/v1/recipes; tiền tố "-" là giảm dần. */
export type RecipeSort = "createdAt" | "-createdAt" | "title" | "-title" | "cookTime" | "-cookTime";

// ---------------------------------------------------------------- Response DTO

export interface RecipeCategoryDto {
  id: Guid;
  name: string;
  slug: string;
}

export interface RecipeAuthorDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Ảnh trong chi tiết recipe; ảnh chính đứng đầu danh sách. */
export interface RecipeImageDto {
  id: Guid;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  orderIndex: number;
}

/** Dinh dưỡng mỗi khẩu phần: calories (kcal), protein/carbohydrates/fat/fiber (g), sodium (mg). */
export interface RecipeNutritionDto {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
}

export interface RecipeIngredientDto {
  id: Guid;
  name: string;
  /** null = "vừa đủ"; phân số như 1/2 được gửi dạng 0.5. */
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface RecipeStepDto {
  id: Guid;
  /** Do hệ thống quản lý: liên tục 1, 2, 3... */
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes: number | null;
  imageUrl: string | null;
}

/** Một card trong GET /api/v1/recipes (FR-RCP-001). */
export interface RecipeListItemDto {
  id: Guid;
  title: string;
  slug: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  createdAt: IsoDateTime;
  publishedAt: IsoDateTime | null;
  primaryImageUrl: string | null;
  category: RecipeCategoryDto | null;
  author: RecipeAuthorDto | null;
}

/** Một kết quả từ GET /api/v1/recipes/search. */
export interface RecipeSummaryDto {
  id: Guid;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  rank: number;
}

/** Response phân trang của GET /api/v1/recipes/search. */
export type SearchRecipesResponse = PagedResult<RecipeSummaryDto>;

/** GET /api/v1/recipes/{slug} và /{id} (FR-RCP-002, FR-RCP-004). */
export interface RecipeDetailDto {
  id: Guid;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  publishedAt: IsoDateTime | null;
  category: RecipeCategoryDto | null;
  author: RecipeAuthorDto | null;
  images: RecipeImageDto[];
  nutrition: RecipeNutritionDto;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  /** Concurrency token (base64), gửi lại qua header If-Match khi cập nhật (FR-RCP-004). */
  rowVersion: string;
}

// ---------------------------------------------------------------- Request

/** Query string của GET /api/v1/recipes (FR-RCP-001). */
export interface RecipeQuery {
  page?: number;
  /** 1–50, mặc định 12. */
  pageSize?: number;
  categoryId?: Guid;
  difficulty?: RecipeDifficulty;
  maxCookTime?: number;
  sort?: RecipeSort;
}

export interface NutritionRequest {
  calories?: number | null;
  protein?: number | null;
  carbohydrates?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sodium?: number | null;
}

/** POST /api/v1/recipes/{id}/ingredients, hoặc gửi kèm khi tạo recipe. */
export interface CreateIngredientRequest {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  /** Bỏ trống thì xếp cuối danh sách. */
  orderIndex?: number | null;
}

/** PUT /api/v1/recipes/{id}/ingredients/{ingredientId}. */
export interface UpdateIngredientRequest {
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  orderIndex: number;
}

/** POST /api/v1/recipes/{id}/steps, hoặc gửi kèm khi tạo recipe. Title trống thì mặc định "Bước n". */
export interface CreateStepRequest {
  description: string;
  title?: string | null;
  timerMinutes?: number | null;
  imageUrl?: string | null;
}

/** PUT /api/v1/recipes/{id}/steps/{stepId}. Title trống thì giữ title hiện tại. */
export type UpdateStepRequest = CreateStepRequest;

/** POST /api/v1/recipes (FR-RCP-003). Tác giả lấy từ access token, recipe mới luôn là Draft. */
export interface CreateRecipeRequest {
  title: string;
  description: string;
  categoryId: Guid;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions?: string | null;
  nutrition?: NutritionRequest | null;
  ingredients?: CreateIngredientRequest[];
  steps?: CreateStepRequest[];
}

/** PUT /api/v1/recipes/{id} (FR-RCP-004). Gửi rowVersion qua header If-Match; nutrition null = giữ nguyên. */
export interface UpdateRecipeRequest {
  title: string;
  description: string;
  categoryId: Guid;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions?: string | null;
  nutrition?: NutritionRequest | null;
  rowVersion?: string | null;
}
