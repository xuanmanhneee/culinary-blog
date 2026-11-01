import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { getPublicCategories, getPublicRecipes } from "@/lib/api/recipes";
import { getErrorMessage } from "@/lib/errors";
import { RECIPE_DIFFICULTY_LABELS, type RecipeDifficulty } from "@/lib/types/recipe";

export const metadata: Metadata = {
  title: "Khám phá công thức",
  description: "Tìm công thức nấu ăn phù hợp với khẩu vị và thời gian của bạn.",
};

interface RecipeSearchParams {
  page?: string;
  categoryId?: string;
  difficulty?: string;
  maxCookTime?: string;
}

function positiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function recipeUrl(params: RecipeSearchParams, page?: number): string {
  const query = new URLSearchParams();
  if (page && page > 1) query.set("page", String(page));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.maxCookTime) query.set("maxCookTime", params.maxCookTime);
  const text = query.toString();
  return text ? `/recipes?${text}` : "/recipes";
}

export default async function RecipesPage({ searchParams }: { searchParams: Promise<RecipeSearchParams> }) {
  const params = await searchParams;
  const page = positiveNumber(params.page) ?? 1;
  const difficulty = positiveNumber(params.difficulty) as RecipeDifficulty | undefined;
  const maxCookTime = positiveNumber(params.maxCookTime);
  const [recipesResult, categoriesResult] = await Promise.allSettled([
    getPublicRecipes({ page, pageSize: 12, categoryId: params.categoryId, difficulty, maxCookTime }),
    getPublicCategories(),
  ]);

  if (recipesResult.status === "rejected" || categoriesResult.status === "rejected") {
    const reason = recipesResult.status === "rejected"
      ? recipesResult.reason
      : categoriesResult.status === "rejected"
        ? categoriesResult.reason
        : new Error("Không tải được dữ liệu công thức.");
    return <section className="site-container py-20"><ErrorState title="Không tải được công thức" message={getErrorMessage(reason)} /></section>;
  }

  const recipes = recipesResult.value;
  const categories = categoriesResult.value;

  return (
    <main className="site-container py-14 sm:py-20">
      <header className="mx-auto max-w-3xl text-center">
        <Badge variant="warm">Kho công thức</Badge>
        <h1 className="font-display mt-5 text-5xl font-bold tracking-[-.05em] text-[#2e2925] sm:text-6xl">Món ngon cho mọi ngày</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#746a62]">Lọc theo loại món, độ khó và thời gian để tìm cảm hứng vào bếp hôm nay.</p>
      </header>

      <form method="get" className="mx-auto mt-10 grid max-w-5xl gap-3 rounded-[1.35rem] border border-[#ddd1c3] bg-white/70 p-4 shadow-[0_14px_40px_rgba(80,57,38,.06)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
        <label className="text-sm font-semibold text-[#5d554e]">Danh mục<select name="categoryId" defaultValue={params.categoryId ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#ddd1c3] bg-white px-3 text-sm font-normal outline-none"><option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="text-sm font-semibold text-[#5d554e]">Độ khó<select name="difficulty" defaultValue={params.difficulty ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#ddd1c3] bg-white px-3 text-sm font-normal outline-none"><option value="">Mọi độ khó</option>{Object.entries(RECIPE_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm font-semibold text-[#5d554e]">Thời gian<select name="maxCookTime" defaultValue={params.maxCookTime ?? ""} className="mt-2 h-11 w-full rounded-xl border border-[#ddd1c3] bg-white px-3 text-sm font-normal outline-none"><option value="">Không giới hạn</option><option value="30">Tối đa 30 phút</option><option value="60">Tối đa 60 phút</option><option value="90">Tối đa 90 phút</option></select></label>
        <Button type="submit"><SlidersHorizontal />Lọc công thức</Button>
      </form>

      <div className="mt-14 flex items-end justify-between gap-4 border-b border-[#ddd2c5] pb-5"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Gợi ý cho bạn</p><h2 className="font-display mt-2 text-3xl font-bold text-[#302a26]">Công thức mới nhất</h2></div><p className="hidden text-sm text-[#80766d] sm:block">{recipes.totalCount} công thức</p></div>
      {recipes.items.length ? <div className="mt-9 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{recipes.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div> : <p className="mt-10 rounded-2xl border border-dashed border-[#d9cdbd] bg-white/70 p-10 text-center text-sm text-[#70675f]">Không tìm thấy công thức phù hợp với bộ lọc.</p>}
      <div className="mt-16"><Pagination currentPage={recipes.page} totalPages={recipes.totalPages} hrefForPage={(nextPage) => recipeUrl(params, nextPage)} /></div>
    </main>
  );
}
