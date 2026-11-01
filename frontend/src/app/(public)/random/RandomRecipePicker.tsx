"use client";

import { Dices, RotateCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Badge } from "@/components/ui/badge";
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
    <main className="site-container py-14 sm:py-20">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#1f4b3f] px-6 py-10 text-white shadow-[0_24px_70px_rgba(31,75,63,.18)] sm:px-12 sm:py-14">
        <div className="max-w-2xl">
          <Badge className="border-white/20 bg-white/10 text-[#f6d9c5]"><Sparkles className="mr-1.5 size-3" />Góc ngẫu hứng</Badge>
          <h1 className="font-display mt-5 text-5xl font-bold tracking-[-.05em] sm:text-7xl">Không biết ăn gì?</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">Chọn một vài gợi ý, phần còn lại cứ để Bếp Nhà quyết định giúp bạn.</p>
        </div>

        <div className="mt-9 grid gap-3 rounded-[1.35rem] bg-[#fffaf3] p-4 text-[#332d28] sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">Bữa ăn<select value={meal} onChange={(event) => setMeal(event.target.value as Meal)} className="mt-2 h-11 w-full rounded-xl border border-[#d9cdbd] bg-white px-3 text-sm font-normal outline-none focus:border-[#1f4b3f]">{mealOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="text-sm font-semibold">Loại món<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d9cdbd] bg-white px-3 text-sm font-normal outline-none focus:border-[#1f4b3f]"><option value="">Tất cả loại món</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Độ khó<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d9cdbd] bg-white px-3 text-sm font-normal outline-none focus:border-[#1f4b3f]"><option value="">Mọi độ khó</option>{Object.entries(RECIPE_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-semibold">Thời gian<select value={maxCookTime} onChange={(event) => setMaxCookTime(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#d9cdbd] bg-white px-3 text-sm font-normal outline-none focus:border-[#1f4b3f]"><option value="">Không giới hạn</option><option value="30">Tối đa 30 phút</option><option value="60">Tối đa 60 phút</option><option value="90">Tối đa 90 phút</option></select></label>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-white/65">{filteredRecipes.length ? `${filteredRecipes.length} món phù hợp với lựa chọn của bạn` : "Chưa có món phù hợp với bộ lọc này"}</p>
          <Button type="button" size="lg" onClick={chooseRecipe} disabled={!filteredRecipes.length} className="bg-[#f3d8c5] text-[#1f4b3f] hover:bg-white"><Dices />Đổi món khác</Button>
        </div>
      </section>

      {recipe ? (
        <section className="mx-auto mt-12 max-w-md">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-[.16em] text-[#a84f37]">Món dành cho bạn hôm nay</p>
          <RecipeCard recipe={recipe} priority />
          <Button type="button" variant="ghost" className="mx-auto mt-7 flex" onClick={chooseRecipe}><RotateCw />Bốc lại một món khác</Button>
        </section>
      ) : (
        <p className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-[#d9cdbd] bg-white/70 p-8 text-center text-sm text-[#70675f]">Thử nới lỏng một bộ lọc để Bếp Nhà tìm được món cho bạn nhé.</p>
      )}
    </main>
  );
}
