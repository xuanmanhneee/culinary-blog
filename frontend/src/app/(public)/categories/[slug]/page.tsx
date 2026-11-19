import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { PageHeader } from "@/components/common/PageHeader";
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
        <Button asChild variant="ghost" size="sm">
          <Link href="/categories"><ArrowLeft aria-hidden="true" />Tất cả danh mục</Link>
        </Button>
        <PageHeader className="mt-5" align="center" title={category.name} description={category.description} actions={<span className="text-sm font-semibold text-primary">{recipes.totalCount} công thức</span>} />

        {recipes.items.length ? (
          <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {recipes.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Danh mục này chưa có công thức đã xuất bản.</p>
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
