export interface RecipeImageDto {
  id?: string;
  url?: string;
  originalUrl?: string;
  isPrimary?: boolean;
}

export interface RecipeIngredientDto {
  name: string;
  quantity?: string | number | null;
  unit?: string | null;
}

export interface RecipeStepDto {
  description: string;
}

export interface RecipeNutritionDto {
  calories?: string | number | null;
  proteinContent?: string | number | null;
  carbohydrateContent?: string | number | null;
  fatContent?: string | number | null;
}

export interface RecipeDetailDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  images: RecipeImageDto[];
  author: {
    displayName: string;
  };
  publishedAt: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  category: {
    name: string;
  };
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  nutrition?: RecipeNutritionDto | null;
  status: string | number;
}
