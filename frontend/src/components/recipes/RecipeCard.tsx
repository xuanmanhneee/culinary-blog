import { ArrowUpRight, ChefHat, Clock3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FeaturedRecipe } from "@/lib/mock-data";
import { RECIPE_DIFFICULTY_LABELS, type RecipeListItemDto } from "@/lib/types/recipe";
import { formatMinutes } from "@/lib/utils";

type RecipeCardData = FeaturedRecipe | RecipeListItemDto;

function isApiRecipe(recipe: RecipeCardData): recipe is RecipeListItemDto {
  return "prepTimeMinutes" in recipe;
}

export function RecipeCard({ recipe, priority = false }: { recipe: RecipeCardData; priority?: boolean }) {
  const image = isApiRecipe(recipe) ? recipe.primaryImageUrl : recipe.image;
  const category = isApiRecipe(recipe) ? recipe.category?.name ?? "Công thức" : recipe.category;
  const time = isApiRecipe(recipe) ? recipe.prepTimeMinutes + recipe.cookTimeMinutes : recipe.time;
  const difficulty = isApiRecipe(recipe) ? RECIPE_DIFFICULTY_LABELS[recipe.difficulty] : recipe.difficulty;
  const excerpt = isApiRecipe(recipe) ? recipe.description : recipe.excerpt;
  const author = isApiRecipe(recipe) ? recipe.author?.displayName : recipe.author;

  return (
    <article className="recipe-card group">
      <Link href={`/recipes/${recipe.slug}`} className="block overflow-hidden rounded-[1.35rem]" aria-label={`Xem công thức ${recipe.title}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8dfd4]">
          {image ? (
            <Image src={image} alt={recipe.title} fill priority={priority} unoptimized={isApiRecipe(recipe)} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
          ) : (
            <span className="grid size-full place-items-center text-[#9b8c7c]"><ChefHat className="size-14" aria-hidden /></span>
          )}
          <Badge className="absolute top-4 left-4 bg-[#fbf8f2]/92 backdrop-blur-sm" variant="outline">{category}</Badge>
          <span className="absolute right-4 bottom-4 grid size-10 translate-y-2 place-items-center rounded-full bg-[#fbf8f2] text-[#1f4b3f] opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="size-4" /></span>
        </div>
      </Link>
      <div className="px-1 pt-5">
        <div className="flex items-center gap-4 text-xs font-semibold text-[#796f67]">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-[#b65338]" />{formatMinutes(time)}</span>
          {!isApiRecipe(recipe) && <span className="inline-flex items-center gap-1.5"><Star className="size-3.5 fill-[#d89941] text-[#d89941]" />{recipe.rating}</span>}
          <span>{difficulty}</span>
        </div>
        <h3 className="font-display mt-3 text-[1.55rem] leading-[1.18] font-bold tracking-[-0.025em] text-[#2e2925]">
          <Link href={`/recipes/${recipe.slug}`} className="transition-colors hover:text-[#b65338]">{recipe.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#70675f]">{excerpt}</p>
        {author && <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1f4b3f]">Bởi {author}</p>}
      </div>
    </article>
  );
}
