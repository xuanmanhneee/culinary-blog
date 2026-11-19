import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChefHat } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { getPublicCategories } from "@/lib/api/recipes";
import { getErrorMessage } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Danh mục công thức",
  description: "Khám phá các danh mục công thức nấu ăn từ cộng đồng Bếp Nhà.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const [categoriesResult] = await Promise.allSettled([getPublicCategories()]);

  if (categoriesResult.status === "rejected") {
    return (
      <section className="site-container py-20">
        <ErrorState title="Không tải được danh mục" message={getErrorMessage(categoriesResult.reason)} />
      </section>
    );
  }

  const categories = categoriesResult.value;

  return (
    <section className="site-container py-14 sm:py-20">
      <PageHeader eyebrow="Kho công thức" align="center" title="Khám phá theo danh mục" description="Chọn một chủ đề để tìm cảm hứng cho bữa ăn tiếp theo." />

      {categories.length ? (
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <li key={category.id}>
              <Link
                href={`/categories/${encodeURIComponent(category.slug)}`}
                className="group relative block min-h-64 overflow-hidden rounded-2xl border border-border bg-primary-soft shadow-sm"
              >
                {category.imageUrl ? (
                  <Image src={category.imageUrl} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-primary">
                    <ChefHat className="size-16 opacity-50" aria-hidden />
                  </span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-primary-hover/85 via-primary-hover/15 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white"><span><span className="block text-xs font-semibold uppercase tracking-[.15em] text-white/75">Danh mục {String(index + 1).padStart(2, "0")}</span><span className="font-display mt-2 block text-2xl font-bold">{category.name}</span>{category.description && <span className="mt-2 block line-clamp-2 text-sm leading-6 text-white/80">{category.description}</span>}</span><ArrowUpRight className="mb-1 size-5 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mx-auto mt-12 max-w-xl rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">Chưa có danh mục nào.</p>
      )}
    </section>
  );
}
