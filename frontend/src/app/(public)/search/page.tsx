"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { fieldClass, Input } from "@/components/ui/input";

import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Pagination } from "@/components/common/Pagination";
import { useRecipeSearch } from "@/lib/hooks/useRecipeSearch";
import { useCategories } from "@/lib/hooks/useRecipeManagement";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId")?.trim() ?? "";
  const sort = searchParams.get("sort")?.trim() ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const { data, isLoading, error } = useRecipeSearch(searchTerm, categoryId, page, sort);
  const categories = useCategories();

  function navigate(query: string, selectedCategory: string, selectedSort: string, nextPage = 1) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    if (selectedSort) params.set("sort", selectedSort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(String(form.get("q") ?? "").trim(), categoryId, sort);
  }

  return <div className="site-container py-8 sm:py-12">
    <PageHeader eyebrow="Tìm kiếm" title="Tìm kiếm công thức" description="Nhập từ khóa và kết hợp bộ lọc danh mục." />
    <form key={searchTerm} onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)_minmax(12rem,auto)_auto]">
      <label htmlFor="recipe-search" className="sr-only">Từ khóa tìm kiếm</label>
      <Input id="recipe-search" name="q" defaultValue={searchTerm} minLength={2} required placeholder="Nhập ít nhất 2 ký tự..." />
      <label htmlFor="category-filter" className="sr-only">Lọc theo danh mục</label>
      <select id="category-filter" className={fieldClass}
        value={categoryId}
        disabled={categories.isLoading}
        onChange={(event) => navigate(searchTerm, event.target.value, sort)}
>
        <option value="">Tất cả danh mục</option>
        {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <label htmlFor="sort" className="sr-only">Sắp xếp kết quả</label>
      <select id="sort" value={sort} onChange={(event) => navigate(searchTerm, categoryId, event.target.value)} className={fieldClass}>
        <option value="">Liên quan nhất</option>
        <option value="-createdAt">Mới nhất</option>
        <option value="createdAt">Cũ nhất</option>
        <option value="title">Tên A–Z</option>
        <option value="-title">Tên Z–A</option>
        <option value="cookTime">Nấu nhanh nhất</option>
        <option value="-cookTime">Nấu lâu nhất</option>
      </select>
      <Button type="submit" className="h-11">Tìm</Button>
    </form>
    {categories.error && <p role="alert" className="mt-3 text-sm text-destructive">Không tải được danh mục: {categories.error.message}</p>}
    {searchTerm.length === 1 && <p className="mt-4 text-sm text-muted-foreground">Từ khóa cần có ít nhất 2 ký tự.</p>}
    {searchTerm.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Nhập từ khóa để tìm công thức; có thể kết hợp bộ lọc danh mục.</p>}
    {isLoading && <LoadingState label="Đang tìm công thức..." />}{error && <ErrorState message={error} />}
    {data && <section aria-live="polite" className="mt-8"><p className="mb-4 text-sm text-muted-foreground">Tìm thấy {data.totalCount} công thức.</p>{data.items.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((recipe) => <li key={recipe.id} className="overflow-hidden rounded-2xl border border-border bg-card">{recipe.thumbnailUrl && <Image src={recipe.thumbnailUrl} alt="" width={640} height={480} unoptimized className="aspect-[4/3] w-full object-cover" />}<div className="p-4"><h2 className="text-lg font-bold"><Link href={`/recipes/${encodeURIComponent(recipe.slug)}`} className="hover:text-primary">{recipe.title}</Link></h2>{recipe.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{recipe.description}</p>}</div></li>)}</ul> : <p className="text-muted-foreground">Không tìm thấy công thức phù hợp.</p>}
      <Pagination page={data.page} totalPages={data.totalPages} hasPreviousPage={data.hasPreviousPage} hasNextPage={data.hasNextPage} onPageChange={(nextPage) => navigate(searchTerm, categoryId, sort, nextPage)} isDisabled={isLoading} ariaLabel="Phân trang kết quả tìm kiếm" />
    </section>}
  </div>;
}

export default function SearchPage() {
  return <Suspense fallback={<LoadingState label="Đang mở trang tìm kiếm..." />}><SearchContent /></Suspense>;
}
