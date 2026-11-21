/**
 * Kiểu dữ liệu module Categories (FR-CAT), khớp DTO backend
 * CulinaryBlog.Application.Categories.Models.
 */
import type { Guid } from "./api";
import type { PagedResult } from "./api";
import type { RecipeListItemDto } from "./recipe";

/** CategoryDto — dùng cho GET /api/v1/categories và GET /api/v1/categories/{slug}. */
export interface CategoryDto {
  id: Guid;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  /** Thứ tự hiển thị mong muốn. */
  orderIndex: number;
  recipeCount: number;
}

export interface CategoryDetailDto {
  category: CategoryDto;
  recipes: PagedResult<RecipeListItemDto>;
}

/** POST /api/v1/categories (FR-CAT-003) — chỉ Admin; trùng tên/slug trả 409. */
export interface CreateCategoryRequest {
  /** 2–100 ký tự, backend tự trim. */
  name: string;
  /** Bỏ trống để backend tạo từ tên. */
  slug?: string;
  description?: string | null;
  orderIndex?: number;
  imageUrl?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
}
