/**
 * Schema Zod cho từng bước của form công thức. Rule trùng với validation backend
 * (RecipeService.ValidateRecipeFields, RecipeValidation) để báo lỗi ngay trên trình duyệt.
 */
import { z } from "zod";
import { RecipeDifficulty } from "@/lib/types/recipe";

const requiredPositiveInt = (label: string) =>
  z
    .number({ error: `${label} là bắt buộc.` })
    .int(`${label} phải là số nguyên.`)
    .positive(`${label} phải lớn hơn 0.`);

/** Ô số có thể bỏ trống (null); nếu nhập thì phải > 0. */
const optionalPositive = (label: string) => z.number().positive(`${label} phải lớn hơn 0.`).nullable();

/** Ô số có thể bỏ trống (null); nếu nhập thì không được âm. */
const optionalNonNegative = (label: string) => z.number().min(0, `${label} không được âm.`).nullable();

export const basicInfoSchema = z.object({
  title: z.string().trim().min(5, "Tiêu đề phải từ 5–200 ký tự.").max(200, "Tiêu đề phải từ 5–200 ký tự."),
  description: z.string().trim().min(1, "Mô tả là bắt buộc."),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  prepTimeMinutes: requiredPositiveInt("Thời gian chuẩn bị"),
  cookTimeMinutes: requiredPositiveInt("Thời gian nấu"),
  servings: requiredPositiveInt("Khẩu phần"),
  difficulty: z.enum(RecipeDifficulty, "Độ khó không hợp lệ."),
  instructions: z.string(),
});

export const ingredientSchema = z.object({
  key: z.string(),
  id: z.string().optional(),
  name: z.string().trim().min(1, "Tên nguyên liệu là bắt buộc.").max(100, "Tên nguyên liệu tối đa 100 ký tự."),
  quantity: optionalPositive("Số lượng"),
  unit: z.string().trim().max(50, "Đơn vị tối đa 50 ký tự."),
  notes: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự."),
});

export const ingredientsSchema = z.object({
  ingredients: z.array(ingredientSchema),
});

export const stepSchema = z.object({
  key: z.string(),
  id: z.string().optional(),
  title: z.string().trim().max(200, "Tiêu đề bước tối đa 200 ký tự."),
  description: z.string().trim().min(1, "Mô tả bước là bắt buộc.").max(2000, "Mô tả bước tối đa 2000 ký tự."),
  timerMinutes: optionalPositive("Thời gian của bước"),
});

/** Publish cần ít nhất 1 bước (FR-RCP-005) nên form yêu cầu luôn ở đây. */
export const stepsSchema = z.object({
  steps: z.array(stepSchema).min(1, "Cần ít nhất 1 bước thực hiện."),
});

export const nutritionSchema = z.object({
  calories: optionalNonNegative("Calo"),
  protein: optionalNonNegative("Protein"),
  carbohydrates: optionalNonNegative("Carbohydrate"),
  fat: optionalNonNegative("Chất béo"),
  fiber: optionalNonNegative("Chất xơ"),
  sodium: optionalNonNegative("Natri"),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;
export type IngredientsValues = z.infer<typeof ingredientsSchema>;
export type StepsValues = z.infer<typeof stepsSchema>;
export type NutritionValues = z.infer<typeof nutritionSchema>;

/** register(..., { setValueAs }) cho ô số bắt buộc: trống → NaN để Zod báo "là bắt buộc". */
export const requiredNumber = (value: unknown) => (value === "" || value === null ? Number.NaN : Number(value));

/** register(..., { setValueAs }) cho ô số tùy chọn: trống → null. */
export const optionalNumber = (value: unknown) => (value === "" || value === null ? null : Number(value));
