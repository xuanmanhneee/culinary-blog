import type { RecipeIngredientDto } from "@/lib/types/recipe";

const quantityFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** 0.25 → "0,25"; null (vừa đủ) → null. `ratio` để nhân định lượng theo số khẩu phần. */
export function formatQuantity(quantity: number | null, ratio = 1): string | null {
  return quantity === null ? null : quantityFormatter.format(quantity * ratio);
}

/** "500 g Cá lóc" | "Muối" (không có số lượng = vừa đủ). */
export function formatIngredient(ingredient: RecipeIngredientDto, ratio = 1): string {
  return [formatQuantity(ingredient.quantity, ratio), ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}
