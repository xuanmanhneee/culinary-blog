import type { Metadata } from "next";
import { BookOpenText, Clock3, Edit3, Eye, Heart, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import type { PagedResult } from "@/lib/types/api";
import { Pagination } from "@/components/common/Pagination";
import { RECIPE_STATUS_LABELS, RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";
import { RecipeRowActions } from "./_components/RecipeRowActions";

const PAGE_SIZE = 10;
const EMPTY_PAGE: PagedResult<RecipeListItemDto> = { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNextPage: false, hasPreviousPage: false };

const statusFilters: { value: RecipeStatus | undefined; label: string }[] = [
  { value: undefined, label: "Tất cả" },
  { value: RecipeStatus.Draft, label: RECIPE_STATUS_LABELS[RecipeStatus.Draft] },
  { value: RecipeStatus.Published, label: RECIPE_STATUS_LABELS[RecipeStatus.Published] },
  { value: RecipeStatus.Archived, label: RECIPE_STATUS_LABELS[RecipeStatus.Archived] },
];

/** Thông báo sau khi tạo/sửa (form) hoặc đổi trạng thái/xóa (menu thao tác) – dự án không dùng toast. */
const noticeMessages: Record<string, string> = {
  created: "Đã lưu bản nháp",
  updated: "Đã lưu thay đổi cho",
  published: "Đã xuất bản",
  unpublished: "Đã chuyển về bản nháp",
  archived: "Đã lưu trữ",
  deleted: "Đã xóa",
};

function parseStatus(value: string | undefined): RecipeStatus | undefined {
  const status = Number(value);
  return value !== undefined && Object.values(RecipeStatus).includes(status as RecipeStatus) ? (status as RecipeStatus) : undefined;
}

export const metadata: Metadata = { title: "Công thức của tôi" };

interface RecipeDashboardSearchParams {
  tab?: string;
  status?: string;
  page?: string;
  notice?: string;
  title?: string;
}

/**
 * /dashboard/recipes – "Công thức của tôi": GET /recipes?mine=true (chỉ công thức của người đang đăng nhập,
 * mọi trạng thái), lọc trạng thái và phân trang qua URL (?status=, ?page=).
 */
export default async function RecipeDashboardPage({ searchParams }: { searchParams: Promise<RecipeDashboardSearchParams> }) {
  const { tab, status: statusParam, page: pageParam, notice, title } = await searchParams;
  const isSavedTab = tab === "saved";
  const status = parseStatus(statusParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const session = await auth();
  const token = session?.accessToken;

  const fetchMine = (query: string) =>
    token ? apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?mine=true&${query}`, { token, cache: "no-store" }) : Promise.resolve(EMPTY_PAGE);
  // Số đếm cho thống kê: mỗi trạng thái một request pageSize=1, chỉ lấy totalCount.
  const [result, all, published, drafts] = await Promise.all([
    fetchMine(`page=${page}&pageSize=${PAGE_SIZE}&sort=-createdAt${status === undefined ? "" : `&status=${status}`}`),
    fetchMine("pageSize=1"),
    fetchMine(`pageSize=1&status=${RecipeStatus.Published}`),
    fetchMine(`pageSize=1&status=${RecipeStatus.Draft}`),
  ]);
  const recipes = result.items;
  const hrefFor = (next: { status?: RecipeStatus; page?: number }) => {
    const params = new URLSearchParams();
    if (next.status !== undefined) params.set("status", String(next.status));
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return query ? `/dashboard/recipes?${query}` : "/dashboard/recipes";
  };
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#a84f37]">Góc bếp của bạn</p><h1 className="font-display mt-2 text-4xl font-bold tracking-[-.04em] text-[#29231f]">Bếp của tôi</h1><p className="mt-2 text-sm text-[#786e66]">Quản lý công thức và những món bạn muốn nấu.</p></div><Button asChild><Link href="/dashboard/recipes/new"><Plus />Tạo công thức</Link></Button></div>

      <nav className="mt-7 flex gap-1 border-b border-[#d9cdbf]" aria-label="Nội dung bếp của tôi">
        <Link href="/dashboard/recipes" aria-current={!isSavedTab ? "page" : undefined} className={tabClass(!isSavedTab)}><BookOpenText />Công thức của tôi</Link>
        <Link href="/dashboard/recipes?tab=saved" aria-current={isSavedTab ? "page" : undefined} className={tabClass(isSavedTab)}><Heart />Món đã lưu</Link>
      </nav>

      {notice && noticeMessages[notice] && (
        <p role="status" className="mt-6 rounded-xl border border-[#cfe0d4] bg-[#e4eee7] px-4 py-3 text-sm font-semibold text-[#1f4b3f]">
          {noticeMessages[notice]}{title ? ` "${title}"` : ""}.
        </p>
      )}

      {isSavedTab ? (
        <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#d3c5b5] bg-[#fffdf9] px-6 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#f1e7da] text-[#b65338]"><Heart className="size-5" /></span>
          <h2 className="font-display mt-4 text-2xl font-bold text-[#302a26]">Chưa có món nào được lưu</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#7b7169]">Khi thấy một công thức yêu thích, hãy lưu lại để tìm thấy nhanh hơn trong Bếp của tôi.</p>
          <Button variant="outline" className="mt-5" asChild><Link href="/recipes">Khám phá công thức</Link></Button>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat label="Tổng công thức" value={String(all.totalCount)} /><Stat label="Đã xuất bản" value={String(published.totalCount)} /><Stat label="Bản nháp" value={String(drafts.totalCount)} /></div>
          <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-[#ddd1c3] bg-[#fffdf9] shadow-[0_16px_45px_rgba(75,57,41,.06)]">
            <div className="flex items-center justify-between border-b border-[#e3d9cd] px-5 py-4"><h3 className="font-display text-xl font-bold">Gần đây</h3>
              <nav className="flex flex-wrap gap-1" aria-label="Lọc theo trạng thái">{statusFilters.map((filter) => (
                <Link key={filter.label} href={hrefFor({ status: filter.value })} aria-current={filter.value === status ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter.value === status ? "bg-[#1f4b3f] text-white" : "text-[#6f655d] hover:bg-[#efe6da]"}`}>{filter.label}</Link>
              ))}</nav></div>
            {recipes.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-[#7b7169]">
                {status === undefined ? "Bạn chưa có công thức nào. " : "Không có công thức ở trạng thái này. "}
                <Link href="/dashboard/recipes/new" className="font-bold text-[#1f4b3f] hover:underline">Tạo công thức</Link>
              </p>
            )}
            <div className="divide-y divide-[#e8dfd4]">{recipes.map((recipe) => (
              <div key={recipe.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#eee5da]">{recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={recipe.status === RecipeStatus.Published ? "default" : recipe.status === RecipeStatus.Draft ? "outline" : "warm"}>{RECIPE_STATUS_LABELS[recipe.status]}</Badge><span className="inline-flex items-center gap-1 text-xs text-[#857b72]"><Clock3 className="size-3" />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút</span></div><h4 className="mt-2 truncate font-bold text-[#3d3732]">{recipe.title}</h4><p className="mt-1 text-xs text-[#887d74]">{recipe.description}</p></div>
                <div className="flex gap-1"><Button variant="ghost" size="icon" asChild><Link href={`/recipes/${recipe.slug}`} aria-label="Xem công thức"><Eye /></Link></Button><Button variant="ghost" size="icon" asChild><Link href={`/dashboard/recipes/${recipe.id}/edit`} aria-label="Sửa công thức"><Edit3 /></Link></Button><RecipeRowActions recipe={recipe} /></div>
              </div>
            ))}</div>
          </div>
          <div className="mt-7"><Pagination currentPage={result.page} totalPages={result.totalPages} hrefForPage={(next) => hrefFor({ status, page: next })} /></div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-[1.25rem] border border-[#ded3c6] bg-[#f1e7da] p-5 shadow-[0_10px_30px_rgba(75,57,41,.04)]"><p className="text-xs font-semibold text-[#776d65]">{label}</p><p className="font-display mt-2 text-3xl font-bold text-[#1f4b3f]">{value}</p></div>; }

function tabClass(active: boolean): string {
  return `inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${active ? "border-[#1f4b3f] text-[#1f4b3f]" : "border-transparent text-[#776d65] hover:text-[#1f4b3f]"}`;
}
