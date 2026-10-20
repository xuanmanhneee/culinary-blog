import { ArrowUpRight, Clock3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FeaturedRecipe } from "@/lib/mock-data";
import { formatMinutes } from "@/lib/utils";

export function RecipeCard({ recipe, priority = false }: { recipe: FeaturedRecipe; priority?: boolean }) {
  return (
    <article className="recipe-card group">
      <Link href={`/recipes/${recipe.slug}`} className="block overflow-hidden rounded-[1.35rem]" aria-label={`Xem công thức ${recipe.title}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e8dfd4]">
          <Image src={recipe.image} alt={recipe.title} fill priority={priority} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <Badge className="absolute top-4 left-4 bg-[#fbf8f2]/92 backdrop-blur-sm" variant="outline">{recipe.category}</Badge>
          <span className="absolute right-4 bottom-4 grid size-10 translate-y-2 place-items-center rounded-full bg-[#fbf8f2] text-[#1f4b3f] opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight className="size-4" /></span>
        </div>
      </Link>
      <div className="px-1 pt-5">
        <div className="flex items-center gap-4 text-xs font-semibold text-[#796f67]">
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-[#b65338]" />{formatMinutes(recipe.time)}</span>
          <span className="inline-flex items-center gap-1.5"><Star className="size-3.5 fill-[#d89941] text-[#d89941]" />{recipe.rating}</span>
          <span>{recipe.difficulty}</span>
        </div>
        <h3 className="font-display mt-3 text-[1.55rem] leading-[1.18] font-bold tracking-[-0.025em] text-[#2e2925]">
          <Link href={`/recipes/${recipe.slug}`} className="transition-colors hover:text-[#b65338]">{recipe.title}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#70675f]">{recipe.excerpt}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1f4b3f]">Bởi {recipe.author}</p>
      </div>
    </article>
  );
}
