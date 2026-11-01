"use client";

import { Dices, RotateCw, Sparkles } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Button } from "@/components/ui/button";
import type { CategoryDto } from "@/lib/types/category";
import { RECIPE_DIFFICULTY_LABELS, type RecipeListItemDto } from "@/lib/types/recipe";

type Meal = "any" | "breakfast" | "lunch" | "dinner";

const mealOptions: { value: Meal; label: string }[] = [
  { value: "any", label: "Bất kỳ bữa nào" },
  { value: "breakfast", label: "Bữa sáng" },
  { value: "lunch", label: "Bữa trưa" },
  { value: "dinner", label: "Bữa tối" },
];

const mealKeywords: Record<Exclude<Meal, "any">, string[]> = {
  breakfast: ["sáng", "bánh mì", "mì - phở", "ăn vặt"],
  lunch: ["món chính", "salad", "súp", "món chay", "hải sản", "món á", "món âu", "món kho", "món hấp"],
  dinner: ["món chính", "lẩu", "món nướng", "hải sản", "món kho", "món hấp", "món á", "món âu"],
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
}

function matchesMeal(recipe: RecipeListItemDto, meal: Meal): boolean {
  if (meal === "any") return true;
  const text = normalize(`${recipe.title} ${recipe.description} ${recipe.category?.name ?? ""}`);
  return mealKeywords[meal].some((keyword) => text.includes(normalize(keyword)));
}

function randomItem(items: RecipeListItemDto[]): RecipeListItemDto | null {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

export function RandomRecipePicker({ recipes, categories }: { recipes: RecipeListItemDto[]; categories: CategoryDto[] }) {
  const [meal, setMeal] = useState<Meal>("any");
  const [categoryId, setCategoryId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [maxCookTime, setMaxCookTime] = useState("");
  const [recipe, setRecipe] = useState<RecipeListItemDto | null>(() => randomItem(recipes));

  const filteredRecipes = useMemo(() => recipes.filter((item) => {
    if (!matchesMeal(item, meal)) return false;
    if (categoryId && item.category?.id !== categoryId) return false;
    if (difficulty && item.difficulty !== Number(difficulty)) return false;
    if (maxCookTime && item.prepTimeMinutes + item.cookTimeMinutes > Number(maxCookTime)) return false;
    return true;
  }), [categoryId, difficulty, meal, maxCookTime, recipes]);

  function chooseRecipe() {
    setRecipe(randomItem(filteredRecipes));
  }

  return (
    <main className="site-container flex min-h-[calc(100svh-74px)] flex-col justify-center py-6 sm:py-8">
      <section className="mx-auto w-full max-w-5xl text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#a84f37]"><Sparkles className="size-3" />Gợi ý hôm nay</div>
        <h1 className="font-display text-3xl font-bold tracking-[-.04em] text-[#2e2925] sm:text-4xl">Món dành cho bạn hôm nay</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[#746a62]">Không biết ăn gì? Hãy để Bếp Nhà chọn giúp bạn.</p>

        {recipe ? (
          <div className="mx-auto mt-5 w-full max-w-[22rem] text-left"><RecipeCard recipe={recipe} priority /></div>
        ) : (
          <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed border-[#d9cdbd] bg-white/70 p-7 text-center text-sm text-[#70675f]">Thử nới lỏng một bộ lọc để Bếp Nhà tìm được món cho bạn nhé.</p>
        )}

        <div className="mx-auto mt-6 max-w-4xl rounded-[1.35rem] bg-[#1f4b3f] p-4 text-left text-white shadow-[0_18px_50px_rgba(31,75,63,.16)] sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">Muốn đổi theo khẩu vị?</p><p className="text-xs text-white/65">{filteredRecipes.length} món phù hợp</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.15fr_1.35fr_1fr_1fr_auto] lg:items-end">
            <Filter label="Bữa ăn"><select value={meal} onChange={(event) => setMeal(event.target.value as Meal)}>{mealOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Filter>
            <Filter label="Loại món"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Tất cả loại món</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Filter>
            <Filter label="Độ khó"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">Mọi độ khó</option>{Object.entries(RECIPE_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Filter>
            <Filter label="Thời gian"><select value={maxCookTime} onChange={(event) => setMaxCookTime(event.target.value)}><option value="">Không giới hạn</option><option value="30">Tối đa 30 phút</option><option value="60">Tối đa 60 phút</option><option value="90">Tối đa 90 phút</option></select></Filter>
            <Button type="button" onClick={chooseRecipe} disabled={!filteredRecipes.length} className="h-11 bg-[#f3d8c5] text-[#1f4b3f] hover:bg-white"><Dices />Đổi món</Button>
          </div>
        </div>
        <Button type="button" variant="ghost" className="mx-auto mt-3 flex" onClick={chooseRecipe} disabled={!filteredRecipes.length}><RotateCw />Bốc lại món khác</Button>
      </section>
    </main>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return <label className="text-xs font-semibold text-white/80">{label}<span className="mt-1.5 block [&>select]:h-11 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-[#d9cdbd] [&>select]:bg-white [&>select]:px-3 [&>select]:text-sm [&>select]:font-normal [&>select]:text-[#332d28] [&>select]:outline-none">{children}</span></label>;
}
