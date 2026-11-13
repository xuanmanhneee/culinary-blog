import type { Guid, IsoDateTime } from "@/lib/types/api";

export interface EngagementSummary {
  recipeId: Guid;
  averageRating: number;
  ratingCount: number;
  isSaved: boolean;
  myRating: number | null;
}

export interface SavedRecipeDto {
  recipeId: Guid;
  slug: string;
  title: string;
  description: string;
  primaryImageUrl: string | null;
  totalTimeMinutes: number;
  savedAt: IsoDateTime;
}

export interface SavedRecipePage {
  items: SavedRecipeDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
