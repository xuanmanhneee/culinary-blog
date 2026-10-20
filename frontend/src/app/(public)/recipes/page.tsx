import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categories, featuredRecipes } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Khám phá công thức",
  description: "Tìm công thức nấu ăn phù hợp với khẩu vị, thời gian và nguyên liệu của bạn.",
};

export default async function RecipesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  return (
    <div className="site-container py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Badge variant="warm">Kho công thức</Badge>
        <h1 className="font-display mt-5 text-5xl font-bold tracking-[-.05em] text-[#2e2925] sm:text-6xl">Món ngon cho mọi ngày</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#746a62]">Lọc theo khẩu vị, chọn theo thời gian — và tìm một món khiến bạn muốn vào bếp ngay hôm nay.</p>
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-[1.35rem] border border-[#ddd1c3] bg-white/70 p-3 shadow-[0_14px_40px_rgba(80,57,38,.06)] md:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-full bg-[#f5eee5] px-5">
          <Search className="size-4 text-[#8d8278]" /><span className="sr-only">Tìm công thức</span>
          <input className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#968b82]" placeholder="Tên món, nguyên liệu..." />
        </label>
        <select aria-label="Chọn danh mục" className="h-12 rounded-full border border-[#ddd1c3] bg-white px-5 text-sm font-semibold text-[#5d554e] outline-none">
          <option>Tất cả danh mục</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}
        </select>
        <Button><SlidersHorizontal />Lọc công thức</Button>
      </div>

      <div className="mt-14 flex items-end justify-between gap-4 border-b border-[#ddd2c5] pb-5">
        <div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Gợi ý cho bạn</p><h2 className="font-display mt-2 text-3xl font-bold text-[#302a26]">Công thức mới nhất</h2></div>
        <p className="hidden text-sm text-[#80766d] sm:block">Hiển thị {featuredRecipes.length} công thức</p>
      </div>
      <div className="mt-9 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {featuredRecipes.map((recipe) => <RecipeCard key={recipe.slug} recipe={recipe} />)}
      </div>
      <div className="mt-16"><Pagination currentPage={currentPage} totalPages={4} hrefForPage={(page) => `/recipes?page=${page}`} /></div>
    </div>
  );
}
