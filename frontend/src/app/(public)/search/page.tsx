"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Pagination } from "@/components/common/Pagination";
import { useRecipeSearch } from "@/lib/hooks/useRecipeSearch";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q")?.trim() ?? "";
  const [input, setInput] = useState(initialQuery);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useRecipeSearch(searchTerm, page);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearchTerm(input.trim()); }

  return <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
    <h1 className="text-3xl font-bold">Tìm kiếm công thức</h1>
    <form onSubmit={submit} className="mt-6 flex gap-3"><label htmlFor="recipe-search" className="sr-only">Từ khóa tìm kiếm</label><input id="recipe-search" value={input} onChange={(event) => setInput(event.target.value)} minLength={2} required placeholder="Nhập ít nhất 2 ký tự..." className="min-w-0 flex-1 rounded-md border border-zinc-300 px-4 py-2" /><button type="submit" className="rounded-md bg-emerald-700 px-5 py-2 font-medium text-white hover:bg-emerald-800">Tìm</button></form>
    {searchTerm.length === 1 && <p className="mt-4 text-sm text-zinc-600">Từ khóa cần có ít nhất 2 ký tự.</p>}
    {isLoading && <LoadingState label="Đang tìm công thức..." />}{error && <ErrorState message={error} />}
    {data && <section aria-live="polite" className="mt-8"><p className="mb-4 text-sm text-zinc-600">Tìm thấy {data.totalCount} công thức.</p>{data.items.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((recipe) => <li key={recipe.id} className="overflow-hidden rounded-lg border border-zinc-200">{recipe.thumbnailUrl && <Image src={recipe.thumbnailUrl} alt="" width={640} height={480} unoptimized className="h-48 w-full object-cover" />}<div className="p-4"><h2 className="text-lg font-semibold"><Link href={`/recipes/${encodeURIComponent(recipe.slug)}`} className="hover:text-emerald-800">{recipe.title}</Link></h2>{recipe.description && <p className="mt-2 line-clamp-3 text-sm text-zinc-600">{recipe.description}</p>}</div></li>)}</ul> : <p className="text-zinc-600">Không tìm thấy công thức phù hợp.</p>}
      <Pagination page={data.page} totalPages={data.totalPages} hasPreviousPage={data.hasPreviousPage} hasNextPage={data.hasNextPage} onPageChange={setPage} isDisabled={isLoading} ariaLabel="Phân trang kết quả tìm kiếm" />
    </section>}
  </main>;
}

export default function SearchPage() {
  return <Suspense fallback={<LoadingState label="Đang mở trang tìm kiếm..." />}><SearchContent /></Suspense>;
}
