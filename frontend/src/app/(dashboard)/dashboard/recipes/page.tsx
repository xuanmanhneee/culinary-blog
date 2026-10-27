import type { Metadata } from "next";
import { Clock3, Edit3, Eye, MoreHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";
import type { RecipeListItemDto } from "@/lib/types/recipe";

export const metadata: Metadata = { title: "Công thức của tôi" };

export default async function RecipeDashboardPage() {
  const session = await auth();
  const result = session?.accessToken
    ? await apiFetch<PagedResult<RecipeListItemDto>>("/recipes?page=1&pageSize=50&sort=-createdAt", { token: session.accessToken, cache: "no-store" })
    : { items: [], totalCount: 0, page: 1, pageSize: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
  const recipes = result.items;
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Xin chào, Người yêu bếp</p><h2 className="font-display mt-2 text-4xl font-bold tracking-[-.04em]">Công thức của tôi</h2><p className="mt-2 text-sm text-[#786e66]">Quản lý những món ngon bạn đã và đang chuẩn bị.</p></div><Button asChild><Link href="/dashboard/recipes/new"><Plus />Tạo công thức</Link></Button></div>
      <div className="mt-9 grid gap-4 sm:grid-cols-3"><Stat label="Tổng công thức" value={String(result.totalCount)} /><Stat label="Đã xuất bản" value={String(recipes.filter((recipe) => recipe.status === 1).length)} /><Stat label="Lượt xem tháng này" value="—" /></div>
      <div className="mt-9 overflow-hidden rounded-[1.5rem] border border-[#ddd1c3] bg-white/75">
        <div className="flex items-center justify-between border-b border-[#e3d9cd] px-5 py-4"><h3 className="font-display text-xl font-bold">Gần đây</h3><Button variant="ghost" size="sm">Lọc theo trạng thái</Button></div>
        <div className="divide-y divide-[#e8dfd4]">{recipes.slice(0, 8).map((recipe) => (
          <div key={recipe.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eee5da]">{recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={recipe.status === 0 ? "outline" : "default"}>{recipe.status === 0 ? "Bản nháp" : "Đã đăng"}</Badge><span className="inline-flex items-center gap-1 text-xs text-[#857b72]"><Clock3 className="size-3" />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút</span></div><h4 className="mt-2 truncate font-bold text-[#3d3732]">{recipe.title}</h4><p className="mt-1 text-xs text-[#887d74]">{recipe.description}</p></div>
            <div className="flex gap-1"><Button variant="ghost" size="icon" asChild><Link href={`/recipes/${recipe.slug}`} aria-label="Xem công thức"><Eye /></Link></Button><Button variant="ghost" size="icon" asChild><Link href={`/dashboard/recipes/${recipe.id}/edit`} aria-label="Sửa công thức"><Edit3 /></Link></Button><Button variant="ghost" size="icon" aria-label="Thao tác khác"><MoreHorizontal /></Button></div>
          </div>
        ))}</div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-[1.25rem] border border-[#ded3c6] bg-[#f3eadf] p-5"><p className="text-xs font-semibold text-[#776d65]">{label}</p><p className="font-display mt-2 text-3xl font-bold text-[#1f4b3f]">{value}</p></div>; }
