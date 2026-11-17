"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock3, Eye, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleFavoriteRecipe } from "@/lib/api/recipe-management";
import type { RecipeListItemDto } from "@/lib/types/recipe";

interface SavedRecipeItemProps {
  recipe: RecipeListItemDto;
  token?: string;
  onRemoved?: (recipeId: string) => void;
}

export function SavedRecipeItem({ recipe, token, onRemoved }: SavedRecipeItemProps) {
  const [isRemoved, setIsRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isRemoved) return null;

  async function handleUnsave() {
    if (!token) return;

    startTransition(async () => {
      try {
        const res = await toggleFavoriteRecipe(recipe.id, token);
        if (!res.isFavorite) {
          setIsRemoved(true);
          toast.info(`Đã bỏ lưu món "${recipe.title}"`);
          onRemoved?.(recipe.id);
        }
      } catch {
        toast.error("Không thể bỏ lưu lúc này. Vui lòng thử lại!");
      }
    });
  }

  return (
    <div className="grid items-center gap-4 px-5 py-4 transition hover:bg-[#faf6f0] sm:grid-cols-[72px_1fr_auto]">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eee5da]">
        {recipe.primaryImageUrl ? (
          <Image
            src={recipe.primaryImageUrl}
            alt={recipe.title}
            fill
            sizes="72px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-[#a3988c]">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.category?.name && (
            <Badge variant="outline">{recipe.category.name}</Badge>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-[#857b72]">
            <Clock3 className="size-3" />
            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút
          </span>
          {recipe.author?.displayName && (
            <span className="text-xs text-[#857b72]">
              • Bởi <strong className="font-semibold text-[#1f4b3f]">{recipe.author.displayName}</strong>
            </span>
          )}
        </div>
        <h4 className="mt-2 truncate font-bold text-[#3d3732]">
          <Link href={`/recipes/${recipe.slug}`} className="hover:text-[#1f4b3f] hover:underline">
            {recipe.title}
          </Link>
        </h4>
        <p className="mt-1 line-clamp-1 text-xs text-[#887d74]">{recipe.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild title="Xem chi tiết">
          <Link href={`/recipes/${recipe.slug}`} aria-label="Xem công thức">
            <Eye className="size-4" />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleUnsave()}
          disabled={isPending}
          title="Bỏ lưu món này"
          className="border-[#d9cdbf] text-xs font-semibold text-[#b65338] hover:bg-[#fff0ed] hover:text-[#a64227]"
        >
          {isPending ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <Heart className="mr-1 size-3.5 fill-[#b65338] text-[#b65338]" />
          )}
          Bỏ lưu
        </Button>
      </div>
    </div>
  );
}
