export interface RecipeImageDto {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  orderIndex: number;
}

export interface RecipeIngredientDto {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  orderIndex: number;
}

export interface RecipeStepDto {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes: number | null;
  imageUrl: string | null;
}

export interface RecipeNutritionDto {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
}

export interface RecipeDetailDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  images: RecipeImageDto[];
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  publishedAt: string | null;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  nutrition?: RecipeNutritionDto | null;
  difficulty: string | number;
  status: string | number;
}
