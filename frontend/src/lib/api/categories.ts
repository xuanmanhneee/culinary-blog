import { apiFetch } from "@/lib/api/client";
import type { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from "@/lib/types/category";

type Token = string | null | undefined;

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch("/categories", { cache: "no-store" });
}

export function createCategory(body: CreateCategoryRequest, token: Token): Promise<CategoryDto> {
  return apiFetch("/categories", { method: "POST", body, token });
}

export function updateCategory(id: string, body: UpdateCategoryRequest, token: Token): Promise<CategoryDto> {
  return apiFetch(`/categories/${id}`, { method: "PUT", body, token });
}

export function deleteCategory(id: string, token: Token): Promise<void> {
  return apiFetch(`/categories/${id}`, { method: "DELETE", token });
}
