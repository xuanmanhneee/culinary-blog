import Link from "next/link";
import { Clock, ImageOff, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTotalTime } from "@/lib/recipe-format";
import type { RecipeListItemDto } from "@/lib/types/recipe";
import { RecipeDifficultyBadge } from "./RecipeDifficultyBadge";
import { RecipeStatusBadge } from "./RecipeStatusBadge";

interface RecipeCardProps {
  recipe: RecipeListItemDto;
  /** Mặc định mở trang công khai /recipes/{slug}; dashboard truyền link trang sửa. */
  href?: string;
  /** Hiện badge trạng thái (dashboard); trang công khai chỉ có recipe Published nên ẩn. */
  showStatus?: boolean;
}

/** Card một công thức trong danh sách (FR-RCP-001): ảnh chính, tiêu đề, danh mục, thời gian, độ khó. */
export function RecipeCard({ recipe, href = `/recipes/${recipe.slug}`, showStatus = false }: RecipeCardProps) {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={href} className="flex h-full flex-col focus-visible:outline-none">
        <div className="relative aspect-[4/3] bg-muted">
          {recipe.primaryImageUrl ? (
            // Ảnh lưu trên MinIO/CDN với host thay đổi theo môi trường nên dùng <img> thường,
            // không cần khai báo remotePatterns cho next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.primaryImageUrl}
              alt={recipe.title}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" aria-hidden />
              <span className="sr-only">Chưa có ảnh</span>
            </div>
          )}
          {showStatus && <RecipeStatusBadge status={recipe.status} className="absolute top-3 left-3 shadow-sm" />}
        </div>

        <CardHeader className="gap-1 pt-4">
          {recipe.category && (
            <span className="text-xs font-medium tracking-wide text-emerald-700 uppercase">
              {recipe.category.name}
            </span>
          )}
          <CardTitle className="line-clamp-2 text-base leading-snug">{recipe.title}</CardTitle>
          <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
        </CardHeader>

        <CardContent className="mt-auto pt-3" />

        <CardFooter className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 pb-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" aria-hidden />
            {formatTotalTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" aria-hidden />
            {recipe.servings} phần
          </span>
          <RecipeDifficultyBadge difficulty={recipe.difficulty} className="ml-auto" />
        </CardFooter>
      </Link>
    </Card>
  );
}
