import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ApiError } from "@/lib/api/client";
import { getPublicCategory } from "@/lib/api/recipes";
import { getErrorMessage } from "@/lib/errors";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

function pageNumber(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { category } = await getPublicCategory(slug, 1);
    return {
      title: category.name,
      description: category.description ?? `Khám phá công thức thuộc danh mục ${category.name}.`,
      alternates: { canonical: `/categories/${encodeURIComponent(category.slug)}` },
    };
  } catch {
    return { title: "Không tìm thấy danh mục", robots: { index: false } };
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const page = pageNumber(query.page);
  let result;

  try {
    result = await getPublicCategory(slug, page);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <section className="site-container py-20"><ErrorState title="Không tải được danh mục" message={getErrorMessage(error)} /></section>;
  }

  const { category, recipes } = result;
  return (
      <section className="site-container py-14 sm:py-20">
        <header className="mx-auto max-w-3xl text-center">
          <Badge variant="warm">Danh mục</Badge>
          <h1 className="font-display mt-5 text-5xl font-bold tracking-[-.05em] text-[#2e2925] sm:text-6xl">{category.name}</h1>
          {category.description && <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#746a62]">{category.description}</p>}
          <p className="mt-3 text-sm font-semibold text-[#1f4b3f]">{recipes.totalCount} công thức</p>
        </header>

        {recipes.items.length ? (
          <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {recipes.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <p className="mt-12 rounded-2xl border border-dashed border-[#d9cdbd] bg-white/70 p-10 text-center text-sm text-[#70675f]">Danh mục này chưa có công thức đã xuất bản.</p>
        )}

        <div className="mt-16">
          <Pagination
            currentPage={recipes.page}
            totalPages={recipes.totalPages}
            hrefForPage={(next) => `/categories/${encodeURIComponent(category.slug)}${next > 1 ? `?page=${next}` : ""}`}
          />
        </div>
      </section>
  );
}
