"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Pagination } from "@/components/common/Pagination";
import { useRecipeSearch } from "@/lib/hooks/useRecipeSearch";
import { useCategories } from "@/lib/hooks/useRecipeManagement";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.trim() ?? "";
  const categorySlug = searchParams.get("categorySlug")?.trim() ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const { data, isLoading, error } = useRecipeSearch(searchTerm, categorySlug, page);
  const categories = useCategories();

  function navigate(query: string, selectedCategory: string, nextPage = 1) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("categorySlug", selectedCategory);
    if (nextPage > 1) params.set("page", String(nextPage));
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : "/search");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(String(form.get("q") ?? "").trim(), categorySlug);
  }

  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
    <h1 className="font-display text-3xl font-bold text-[#302a26]">Tìm kiếm công thức</h1>
    <form key={searchTerm} onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)_auto]">
      <label htmlFor="recipe-search" className="sr-only">Từ khóa tìm kiếm</label>
      <input id="recipe-search" name="q" defaultValue={searchTerm} minLength={2} required placeholder="Nhập ít nhất 2 ký tự..." className="min-w-0 rounded-md border border-zinc-300 px-4 py-2" />
      <label htmlFor="category-filter" className="sr-only">Lọc theo danh mục</label>
      <select
        id="category-filter"
        value={categorySlug}
        disabled={categories.isLoading}
        onChange={(event) => navigate(searchTerm, event.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 disabled:opacity-60"
      >
        <option value="">Tất cả danh mục</option>
        {categories.data?.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
      </select>
      <button type="submit" className="rounded-md bg-emerald-700 px-5 py-2 font-medium text-white hover:bg-emerald-800">Tìm</button>
    </form>
    {categories.error && <p role="alert" className="mt-3 text-sm text-red-700">Không tải được danh mục: {categories.error.message}</p>}
    {searchTerm.length === 1 && <p className="mt-4 text-sm text-zinc-600">Từ khóa cần có ít nhất 2 ký tự.</p>}
    {searchTerm.length === 0 && <p className="mt-4 text-sm text-zinc-600">Nhập từ khóa để tìm công thức; có thể kết hợp bộ lọc danh mục.</p>}
    {isLoading && <LoadingState label="Đang tìm công thức..." />}{error && <ErrorState message={error} />}
    {data && <section aria-live="polite" className="mt-8"><p className="mb-4 text-sm text-zinc-600">Tìm thấy {data.totalCount} công thức.</p>{data.items.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((recipe) => <li key={recipe.id} className="overflow-hidden rounded-lg border border-zinc-200">{recipe.thumbnailUrl && <Image src={recipe.thumbnailUrl} alt="" width={640} height={480} unoptimized className="h-48 w-full object-cover" />}<div className="p-4"><h2 className="text-lg font-semibold"><Link href={`/recipes/${encodeURIComponent(recipe.slug)}`} className="hover:text-emerald-800">{recipe.title}</Link></h2>{recipe.description && <p className="mt-2 line-clamp-3 text-sm text-zinc-600">{recipe.description}</p>}</div></li>)}</ul> : <p className="text-zinc-600">Không tìm thấy công thức phù hợp.</p>}
      <Pagination page={data.page} totalPages={data.totalPages} hasPreviousPage={data.hasPreviousPage} hasNextPage={data.hasNextPage} onPageChange={(nextPage) => navigate(searchTerm, categorySlug, nextPage)} isDisabled={isLoading} ariaLabel="Phân trang kết quả tìm kiếm" />
    </section>}
  </main>;
}

export default function SearchPage() {
  return <Suspense fallback={<LoadingState label="Đang mở trang tìm kiếm..." />}><SearchContent /></Suspense>;
}
