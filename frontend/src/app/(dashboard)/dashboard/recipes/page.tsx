import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { Clock3, Edit3, Eye, Heart, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { getCategories } from "@/lib/api/categories";
import { getSavedRecipes } from "@/lib/api/engagement";
import type { PagedResult } from "@/lib/types/api";
import type { SavedRecipePage } from "@/lib/types/engagement";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Roles } from "@/lib/types/auth";
import type { CategoryDto } from "@/lib/types/category";
import { RECIPE_STATUS_LABELS, RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";
import { RecipeRowActions } from "./_components/RecipeRowActions";
import { RestoreRecipeButton } from "./_components/RestoreRecipeButton";
import { SavedRecipeActions } from "./_components/SavedRecipeActions";

const PAGE_SIZE = 10;
const EMPTY_PAGE: PagedResult<RecipeListItemDto> = { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
const EMPTY_SAVED_PAGE: SavedRecipePage = { items: [], totalCount: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 };

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
export const metadata: Metadata = { title: "Công thức" };

interface RecipeDashboardSearchParams {
  tab?: string;
  status?: string;
  page?: string;
  notice?: string;
  title?: string;
  categoryId?: string;
}

/**
 * /dashboard/recipes: Author lấy công thức cá nhân với mine=true; Admin lấy toàn bộ công thức.
 */
export default async function RecipeDashboardPage({ searchParams }: { searchParams: Promise<RecipeDashboardSearchParams> }) {
  const { tab, status: statusParam, page: pageParam, notice, title, categoryId } = await searchParams;
  const status = parseStatus(statusParam);
  const page = Math.max(1, Number(pageParam) || 1);
  const session = await auth();
  const token = session?.accessToken;
  const isAdmin = session?.user.roles?.includes(Roles.Admin) ?? false;
  const isDeletedTab = tab === "deleted";
  const isSavedTab = !isAdmin && tab === "saved";

  if (isDeletedTab) {
    const deleted = token
      ? await apiFetch<PagedResult<RecipeListItemDto>>(`/recipes/deleted?page=${page}&pageSize=${PAGE_SIZE}`, { token, cache: "no-store" })
      : EMPTY_PAGE;
    return <DeletedRecipeList result={deleted} isAdmin={isAdmin} />;
  }

  const fetchRecipes = (query: string) => token
    ? apiFetch<PagedResult<RecipeListItemDto>>(`/recipes?${isAdmin ? "" : "mine=true&"}${query}`, { token, cache: "no-store" })
    : Promise.resolve(EMPTY_PAGE);
  const categoryQuery = isAdmin && categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : "";
  // Số đếm cho thống kê: mỗi trạng thái một request pageSize=1, chỉ lấy totalCount.
  const [result, all, published, drafts, savedRecipes, categories] = await Promise.all([
    isSavedTab ? EMPTY_PAGE : fetchRecipes(`page=${page}&pageSize=${PAGE_SIZE}&sort=-updatedAt${status === undefined ? "" : `&status=${status}`}${categoryQuery}`),
    isSavedTab ? EMPTY_PAGE : fetchRecipes("pageSize=1"),
    isSavedTab ? EMPTY_PAGE : fetchRecipes(`pageSize=1&status=${RecipeStatus.Published}`),
    isSavedTab ? EMPTY_PAGE : fetchRecipes(`pageSize=1&status=${RecipeStatus.Draft}`),
    isSavedTab && token ? getSavedRecipes(page, PAGE_SIZE, token).catch(() => null) : EMPTY_SAVED_PAGE,
    isAdmin ? getCategories() : Promise.resolve([] as CategoryDto[]),
  ]);
  const recipes = result.items;
  const hrefFor = (next: { status?: RecipeStatus; page?: number; categoryId?: string }) => {
    const params = new URLSearchParams();
    if (next.status !== undefined) params.set("status", String(next.status));
    if (next.categoryId) params.set("categoryId", next.categoryId);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return query ? `/dashboard/recipes?${query}` : "/dashboard/recipes";
  };

  if (isAdmin) {
    return (
      <AdminRecipeList
        result={result}
        categories={categories}
        status={status}
        categoryId={categoryId}
        notice={notice}
        title={title}
        hrefFor={hrefFor}
      />
    );
  }

  return (
    <section>
      <PageHeader eyebrow="Bếp của tôi" title="Công thức" description="Quản lý công thức và những món bạn muốn nấu." actions={<Button asChild><Link href="/dashboard/recipes/new"><Plus />Tạo công thức</Link></Button>} />

      {notice && noticeMessages[notice] && (
        <p role="status" className="mt-6 rounded-xl border border-primary-soft bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
          {noticeMessages[notice]}{title ? ` "${title}"` : ""}.
        </p>
      )}

      {isSavedTab ? (
        <>
          {savedRecipes === null ? (
            <p role="status" className="mt-7 rounded-xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">Món đã lưu tạm thời không khả dụng.</p>
          ) : savedRecipes.items.length === 0 ? (
            <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted px-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted text-accent"><Heart className="size-5" /></span>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Chưa có món nào được lưu</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Khi thấy một công thức yêu thích, hãy lưu lại để tìm thấy nhanh hơn trong Bếp của tôi.</p>
              <Button variant="outline" className="mt-5" asChild><Link href="/recipes">Khám phá công thức</Link></Button>
            </div>
          ) : (
            <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4"><h2 className="text-lg font-bold">Món đã lưu ({savedRecipes.totalCount})</h2></div>
              <div className="divide-y divide-border">{savedRecipes.items.map((recipe) => (
                <div key={recipe.recipeId} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">{recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}</div>
                  <div className="min-w-0"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{recipe.totalTimeMinutes} phút</span><h3 className="mt-2 truncate font-bold text-foreground"><Link href={`/recipes/${recipe.slug}`} className="hover:text-primary">{recipe.title}</Link></h3><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{recipe.description}</p></div>
                  <div className="flex gap-1"><Button variant="ghost" size="icon" asChild><Link href={`/recipes/${recipe.slug}`} aria-label="Xem công thức"><Eye /></Link></Button><SavedRecipeActions recipeId={recipe.recipeId} /></div>
                </div>
              ))}</div>
            </div>
          )}
          {savedRecipes && <div className="mt-7"><Pagination currentPage={savedRecipes.page} totalPages={savedRecipes.totalPages} hrefForPage={(next) => `/dashboard/recipes?tab=saved${next > 1 ? `&page=${next}` : ""}`} /></div>}
        </>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><Stat label="Tổng công thức" value={String(all.totalCount)} /><Stat label="Đã xuất bản" value={String(published.totalCount)} /><Stat label="Bản nháp" value={String(drafts.totalCount)} /></div>
          <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><h3 className="text-lg font-bold">Gần đây</h3>
              <nav className="flex flex-wrap gap-1" aria-label="Lọc theo trạng thái">{statusFilters.map((filter) => (
                <Link key={filter.label} href={hrefFor({ status: filter.value })} aria-current={filter.value === status ? "page" : undefined} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter.value === status ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{filter.label}</Link>
              ))}</nav></div>
            {recipes.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 px-5 py-10 text-center sm:flex-row sm:gap-6 sm:py-8 sm:text-left">
                <Image src="/empty-kitchen-capybara.png" alt="Capybara đội mũ đầu bếp đang chờ món ăn đầu tiên" width={180} height={180} className="size-36 object-contain sm:size-40" />
                <div className="max-w-sm">
                  <div className="relative rounded-2xl border border-border bg-card px-5 py-4 text-sm text-foreground shadow-sm before:absolute before:-bottom-2 before:left-1/2 before:size-4 before:-translate-x-1/2 before:rotate-45 before:border-b before:border-r before:border-border before:bg-muted sm:before:bottom-auto sm:before:left-[-9px] sm:before:top-1/2 sm:before:-translate-y-1/2 sm:before:rotate-[135deg]">
                    <p className="relative font-semibold text-foreground">{status === undefined ? "Chưa có gì trong bếp cả..." : "Kệ này đang trống rồi..."}</p>
                    <p className="relative mt-1">Nấu ăn nào!</p>
                  </div>
                  <Link href="/dashboard/recipes/new" className="mt-4 inline-block font-bold text-primary hover:underline">Tạo công thức đầu tiên →</Link>
                </div>
              </div>
            )}
            <div className="divide-y divide-border">{recipes.map((recipe) => (
              <div key={recipe.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">{recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={recipe.status === RecipeStatus.Published ? "default" : recipe.status === RecipeStatus.Draft ? "outline" : "warm"}>{RECIPE_STATUS_LABELS[recipe.status]}</Badge><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} phút</span></div><h4 className="mt-2 truncate font-bold text-foreground">{recipe.title}</h4><p className="mt-1 text-xs text-muted-foreground">{recipe.description}</p></div>
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

function AdminRecipeList({
  result,
  categories,
  status,
  categoryId,
  notice,
  title,
  hrefFor,
}: {
  result: PagedResult<RecipeListItemDto>;
  categories: CategoryDto[];
  status?: RecipeStatus;
  categoryId?: string;
  notice?: string;
  title?: string;
  hrefFor: (next: { status?: RecipeStatus; page?: number; categoryId?: string }) => string;
}) {
  return (
    <section className="space-y-7">
      <PageHeader eyebrow="Quản trị" title="Quản lý công thức" description="Kiểm tra và xử lý công thức của tất cả tác giả." />
      {notice && noticeMessages[notice] && (
        <p role="status" className="rounded-xl border border-primary-soft bg-primary-soft px-4 py-3 text-sm font-semibold text-primary">
          {noticeMessages[notice]}{title ? ` "${title}"` : ""}.
        </p>
      )}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-1" aria-label="Lọc công thức theo trạng thái">
          {statusFilters.map((filter) => (
            <Link key={filter.label} href={hrefFor({ status: filter.value, categoryId })} aria-current={filter.value === status ? "page" : undefined} className={`rounded-full px-3 py-2 text-xs font-bold transition ${filter.value === status ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{filter.label}</Link>
          ))}
        </nav>
        <form action="/dashboard/recipes" className="flex flex-wrap gap-2">
          {status !== undefined && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="categoryId">Lọc theo danh mục</label>
          <select id="categoryId" name="categoryId" defaultValue={categoryId ?? ""} className="h-10 min-w-52 rounded-xl border border-border bg-card px-3 text-sm">
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <Button type="submit" variant="outline">Lọc</Button>
        </form>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {result.items.length === 0 ? (
          <EmptyState title="Không có công thức phù hợp" description="Thử thay đổi trạng thái hoặc danh mục đang lọc." className="m-5" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-3">Công thức</th><th className="px-5 py-3">Tác giả</th><th className="px-5 py-3">Danh mục</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Cập nhật</th><th className="px-5 py-3"><span className="sr-only">Thao tác</span></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-muted/60">
                    <td className="max-w-80 px-5 py-4"><strong className="block truncate">{recipe.title}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{recipe.description}</span></td>
                    <td className="px-5 py-4">{recipe.author?.displayName ?? "Không xác định"}</td>
                    <td className="px-5 py-4">{recipe.category?.name ?? "Chưa phân loại"}</td>
                    <td className="px-5 py-4"><Badge variant={recipe.status === RecipeStatus.Published ? "default" : recipe.status === RecipeStatus.Draft ? "outline" : "warm"}>{RECIPE_STATUS_LABELS[recipe.status]}</Badge></td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(recipe.updatedAt)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon"><Link href={`/recipes/${recipe.slug}`} aria-label={`Kiểm tra ${recipe.title}`}><Eye /></Link></Button><RecipeRowActions recipe={recipe} allowArchive={false} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination currentPage={result.page} totalPages={result.totalPages} hrefForPage={(next) => hrefFor({ status, categoryId, page: next })} />
    </section>
  );
}

function DeletedRecipeList({ result, isAdmin }: { result: PagedResult<RecipeListItemDto>; isAdmin: boolean }) {
  return (
    <section className="space-y-7">
      <PageHeader
        eyebrow={isAdmin ? "Quản trị" : "Bếp của tôi"}
        title="Công thức đã xóa"
        description={isAdmin ? "Khôi phục công thức đã xóa của mọi tác giả." : "Khôi phục những công thức bạn đã xóa."}
      />
      {result.items.length === 0 ? (
        <EmptyState title="Thùng rác đang trống" description="Công thức đã xóa sẽ xuất hiện tại đây để bạn có thể khôi phục." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {result.items.map((recipe) => (
              <div key={recipe.id} className="grid items-center gap-4 px-5 py-4 sm:grid-cols-[72px_1fr_auto]">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  {recipe.primaryImageUrl && <Image src={recipe.primaryImageUrl} alt="" fill sizes="72px" unoptimized className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-foreground">{recipe.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isAdmin && `${recipe.author?.displayName ?? "Không xác định"} · `}Đã xóa {formatDate(recipe.updatedAt)}
                  </p>
                </div>
                <RestoreRecipeButton id={recipe.id} title={recipe.title} />
              </div>
            ))}
          </div>
        </div>
      )}
      <Pagination currentPage={result.page} totalPages={result.totalPages} hrefForPage={(next) => `/dashboard/recipes?tab=deleted${next > 1 ? `&page=${next}` : ""}`} />
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold text-primary">{value}</p></div>; }
