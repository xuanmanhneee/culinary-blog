import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { getPublicCategories, getPublicRecipes } from "@/lib/api/recipes";
import { getRatingSummaries } from "@/lib/api/engagement";
import { getErrorMessage } from "@/lib/errors";
import { RECIPE_DIFFICULTY_LABELS, RecipeDifficulty, type RecipeQuery, type RecipeSort } from "@/lib/types/recipe";

export const metadata: Metadata = {
  title: "Khám phá công thức",
  description: "Tìm công thức nấu ăn phù hợp với khẩu vị và thời gian của bạn.",
  alternates: { canonical: "/recipes" },
};

const sortOptions = {
  "-createdAt": "Mới nhất",
  createdAt: "Cũ nhất",
  title: "Tên A–Z",
  "-title": "Tên Z–A",
  cookTime: "Nấu nhanh nhất",
  "-cookTime": "Nấu lâu nhất",
} satisfies Partial<Record<RecipeSort, string>>;

const numericFilters = [
  { name: "minPrepTime", label: "Chuẩn bị tối thiểu (phút)" },
  { name: "maxCookTime", label: "Nấu tối đa (phút)" },
  { name: "minServings", label: "Số khẩu phần tối thiểu" },
] as const;

const controlClass = "mt-1.5 h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm font-normal outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

function positiveNumber(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 2_147_483_647 ? parsed : undefined;
}

function recipeUrl(filters: RecipeQuery, page: number): string {
  const query = new URLSearchParams(Object.entries(filters)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)]));
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/recipes?${text}` : "/recipes";
}

export default async function RecipesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const page = positiveNumber(params.page) ?? 1;
  const difficulty = Object.values(RecipeDifficulty).find((value) => value === positiveNumber(params.difficulty));
  const sort = (Object.keys(sortOptions) as RecipeSort[]).find((value) => value === params.sort);
  const filters = {
    categoryId: typeof params.categoryId === "string" && params.categoryId ? params.categoryId : undefined,
    difficulty,
    minPrepTime: positiveNumber(params.minPrepTime),
    maxCookTime: positiveNumber(params.maxCookTime),
    minServings: positiveNumber(params.minServings),
    sort,
  };
  const [recipesResult, categoriesResult] = await Promise.allSettled([
    getPublicRecipes({ ...filters, page }),
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
  const ratings = await getRatingSummaries(recipes.items.map((recipe) => recipe.id));
  const categories = categoriesResult.value;
  const activeFilters = Object.values(filters).filter((value) => value !== undefined).length;

  return (
    <section className="site-container py-8 sm:py-12">
      <PageHeader eyebrow="Kho công thức" title="Món ngon cho mọi ngày" description="Lọc theo loại món, độ khó và thời gian để tìm cảm hứng vào bếp hôm nay." />

      <details open={activeFilters > 0} className="group mt-8">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-b border-border pb-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-baseline gap-3"><h2 className="font-display text-2xl font-bold text-foreground">Kết quả</h2><p className="text-sm text-muted-foreground">{recipes.totalCount} công thức</p></div>
          <span className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary group-open:border-primary">
            <SlidersHorizontal className="size-4" aria-hidden />Bộ lọc{activeFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilters}</span>}
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </summary>
      <form key={recipeUrl(filters, 1)} action="/recipes" method="get" aria-label="Lọc và sắp xếp công thức" className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold text-foreground">Danh mục
          <select name="categoryId" defaultValue={filters.categoryId ?? ""} className={controlClass}>
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground">Độ khó
          <select name="difficulty" defaultValue={difficulty ?? ""} className={controlClass}>
            <option value="">Mọi độ khó</option>
            {Object.entries(RECIPE_DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-foreground">Sắp xếp
          <select name="sort" defaultValue={sort ?? "-createdAt"} className={controlClass}>
            {Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {numericFilters.map(({ name, label }) => (
          <label key={name} className="text-sm font-semibold text-foreground">{label}
            <input name={name} type="number" min={1} max={2_147_483_647} defaultValue={filters[name]} placeholder="Không giới hạn" className={controlClass} />
          </label>
        ))}
        <div className="flex flex-wrap gap-2 sm:col-span-full sm:justify-end">
          <Button asChild variant="ghost"><Link href="/recipes">Xóa bộ lọc</Link></Button>
          <Button type="submit"><SlidersHorizontal />Áp dụng</Button>
        </div>
      </form>
      </details>
      {recipes.items.length ? <div className="mt-8 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{recipes.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} rating={ratings[recipe.id]} />)}</div> : <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Không tìm thấy công thức phù hợp với bộ lọc.</p>}
      <div className="mt-16"><Pagination currentPage={recipes.page} totalPages={recipes.totalPages} hrefForPage={(nextPage) => recipeUrl(filters, nextPage)} /></div>
    </section>
  );
}
