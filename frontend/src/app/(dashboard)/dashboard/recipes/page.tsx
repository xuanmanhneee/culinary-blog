import type { Metadata } from "next";
import { BookOpenText, Clock3, Edit3, Eye, Heart, MoreHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";
import type { RecipeListItemDto } from "@/lib/types/recipe";

export const metadata: Metadata = { title: "Công thức của tôi" };

export default async function RecipeDashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const isSavedTab = tab === "saved";
  const session = await auth();
  const result = session?.accessToken
    ? await apiFetch<PagedResult<RecipeListItemDto>>("/recipes?page=1&pageSize=50&sort=-createdAt", { token: session.accessToken, cache: "no-store" })
    : { items: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  const recipes = result.items;
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Góc bếp của bạn</p><h1 className="font-display mt-2 text-4xl font-bold tracking-[-.04em] text-[#29231f]">Bếp của tôi</h1><p className="mt-2 text-sm text-[#786e66]">Quản lý công thức và những món bạn muốn nấu.</p></div><Button asChild><Link href="/dashboard/recipes/new"><Plus />Tạo công thức</Link></Button></div>

      <nav className="mt-7 flex gap-1 border-b border-[#d9cdbf]" aria-label="Nội dung bếp của tôi">
        <Link href="/dashboard/recipes" aria-current={!isSavedTab ? "page" : undefined} className={tabClass(!isSavedTab)}><BookOpenText />Công thức của tôi</Link>
        <Link href="/dashboard/recipes?tab=saved" aria-current={isSavedTab ? "page" : undefined} className={tabClass(isSavedTab)}><Heart />Món đã lưu</Link>
      </nav>

      {isSavedTab ? (
        <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#d3c5b5] bg-[#fffdf9] px-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#f1e7da] text-[#b65338]"><Heart className="size-5" /></span>
          <h2 className="font-display mt-4 text-2xl font-bold text-[#302a26]">Chưa có món nào được lưu</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#7b7169]">Khi thấy một công thức yêu thích, hãy lưu lại để tìm thấy nhanh hơn trong Bếp của tôi.</p>
          <Button variant="outline" className="mt-5" asChild><Link href="/recipes">Khám phá công thức</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat label="Tổng công thức" value={String(result.totalCount)} /><Stat label="Đã xuất bản" value={String(recipes.filter((recipe) => recipe.status === 1).length)} /><Stat label="Lượt xem tháng này" value="—" /></div>
          <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-[#ddd1c3] bg-[#fffdf9] shadow-[0_16px_45px_rgba(75,57,41,.06)]">
            <div className="flex items-center justify-between border-b border-[#e3d9cd] px-5 py-4"><h3 className="font-display text-xl font-bold">Gần đây</h3><Button variant="ghost" size="sm">Lọc theo trạng thái</Button></div>
            <div className="divide-y divide-[#e8dfd4]">{recipes.slice(0, 8).map((recipe) => (
              <div key={recipe.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eee5da]">{recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={recipe.status === 0 ? "outline" : "default"}>{recipe.status === 0 ? "Bản nháp" : "Đã đăng"}</Badge><span className="inline-flex items-center gap-1 text-xs text-[#857b72]"><Clock3 className="size-3" />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút</span></div><h4 className="mt-2 truncate font-bold text-[#3d3732]">{recipe.title}</h4><p className="mt-1 text-xs text-[#887d74]">{recipe.description}</p></div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" asChild><Link href={`/recipes/${recipe.slug}`} aria-label="Xem công thức"><Eye /></Link></Button><Button variant="ghost" size="icon" asChild><Link href={`/dashboard/recipes/${recipe.id}/edit`} aria-label="Sửa công thức"><Edit3 /></Link></Button><Button variant="ghost" size="icon" aria-label="Thao tác khác"><MoreHorizontal /></Button></div>
              </div>
            ))}</div>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-[1.25rem] border border-[#ded3c6] bg-[#f1e7da] p-5 shadow-[0_10px_30px_rgba(75,57,41,.04)]"><p className="text-xs font-semibold text-[#776d65]">{label}</p><p className="font-display mt-2 text-3xl font-bold text-[#1f4b3f]">{value}</p></div>; }

function tabClass(active: boolean): string {
  return `inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${active ? "border-[#1f4b3f] text-[#1f4b3f]" : "border-transparent text-[#776d65] hover:text-[#1f4b3f]"}`;
}
