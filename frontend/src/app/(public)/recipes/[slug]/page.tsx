import type { Metadata } from "next";
import { ChefHat, Clock3, Flame, Star, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecipeImageManager from "@/components/recipes/RecipeImageManager";
import { RecipeActions } from "@/components/recipes/RecipeActions";
import RecipeJsonLd from "@/components/seo/RecipeJsonLd";
import { getRecipeBySlug } from "@/lib/api/recipes";
import { SITE_URL } from "@/lib/config/env";
import {
  RECIPE_DIFFICULTY_LABELS,
  RecipeStatus,
  type RecipeDetailDto,
} from "@/lib/types/recipe";
import { formatMinutes } from "@/lib/utils";

interface RecipePageProps {
  params: Promise<{ slug: string }>;
}

function limitText(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
}

function getPrimaryImage(recipe: RecipeDetailDto): string | undefined {
  return recipe.images.find((image) => image.isPrimary)?.url ?? recipe.images[0]?.url;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return {
      title: "Không tìm thấy công thức",
      robots: { index: false, follow: false },
    };
  }

  const title = limitText(recipe.title, 60);
  const description = limitText(recipe.description, 160);
  const canonicalUrl = new URL(`/recipes/${recipe.slug}`, SITE_URL).toString();
  const primaryImageUrl = getPrimaryImage(recipe);
  const isPublished = recipe.status === RecipeStatus.Published;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      ...(primaryImageUrl
        ? { images: [{ url: primaryImageUrl, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(primaryImageUrl ? { images: [primaryImageUrl] } : {}),
    },
    robots: isPublished ? "index, follow" : { index: false, follow: true },
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const primaryImage = getPrimaryImage(recipe);
  const categoryName = recipe.category?.name ?? "Công thức";
  const authorName = recipe.author?.displayName;
  const publishedDate = recipe.publishedAt
    ? new Date(recipe.publishedAt).toLocaleDateString("vi-VN")
    : undefined;

  return (
    <article>
      <RecipeJsonLd data={recipe} />
      <div className="site-container py-10 sm:py-14">
        <div className="text-xs font-semibold text-[#81766d]">
          <Link href="/" className="hover:text-[#1f4b3f]">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/recipes" className="hover:text-[#1f4b3f]">Công thức</Link>
          <span className="mx-2">/</span>
          <span>{categoryName}</span>
        </div>

        <header className="mx-auto mt-10 max-w-4xl text-center">
          <span className="inline-flex rounded-full bg-[#efe5d8] px-4 py-2 text-xs font-bold text-[#8e402c]">
            {categoryName}
          </span>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] font-bold tracking-[-.05em] text-[#2b2622] sm:text-7xl">
            {recipe.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#70665e]">
            {recipe.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#665d55]">
            {authorName && <span className="font-bold text-[#1f4b3f]">Bởi {authorName}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Star className="size-4 fill-[#d99a42] text-[#d99a42]" />
              Công thức từ cộng đồng Bếp Nhà
            </span>
            {publishedDate && <span>Cập nhật {publishedDate}</span>}
          </div>
        </header>

        <div className="relative mt-12 aspect-[16/8.2] min-h-[300px] overflow-hidden rounded-[2rem] bg-[#e4d8ca] sm:min-h-[360px]">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={recipe.title}
              fill
              priority
              unoptimized
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full min-h-[300px] place-items-center text-[#8a7461]">
              <ChefHat className="size-16" aria-hidden="true" />
            </div>
          )}
          <RecipeActions title={recipe.title} />
        </div>

        <dl className="mx-auto -mt-1 grid max-w-4xl grid-cols-2 divide-x divide-y divide-[#ded3c6] rounded-b-[1.5rem] border border-[#ded3c6] bg-white px-4 py-5 shadow-[0_18px_40px_rgba(80,59,39,.07)] sm:grid-cols-4 sm:divide-y-0">
          <Info icon={<Clock3 />} label="Chuẩn bị" value={formatMinutes(recipe.prepTimeMinutes)} />
          <Info icon={<Flame />} label="Nấu" value={formatMinutes(recipe.cookTimeMinutes)} />
          <Info icon={<UsersRound />} label="Khẩu phần" value={`${recipe.servings} người`} />
          <Info icon={<ChefHat />} label="Độ khó" value={RECIPE_DIFFICULTY_LABELS[recipe.difficulty]} />
        </dl>

        <div className="mx-auto grid max-w-5xl gap-14 py-20 lg:grid-cols-[.72fr_1.28fr]">
          <aside>
            <div className="sticky top-28 rounded-[1.5rem] bg-[#efe5d8] p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a64e37]">Chuẩn bị</p>
              <h2 className="font-display mt-2 text-3xl font-bold text-[#302a26]">Nguyên liệu</h2>
              <p className="mt-2 text-sm text-[#766b62]">Cho {recipe.servings} người ăn</p>
              <ul className="mt-7 space-y-4">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex gap-3 text-sm leading-6 text-[#4e4741]">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#b65338]" />
                    <span>
                      {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
                      {ingredient.notes && <span className="text-[#766b62]"> ({ingredient.notes})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <section>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1f4b3f]">Cùng vào bếp</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-[#302a26]">Cách thực hiện</h2>
            <ol className="mt-9 space-y-9">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[#e0d6ca] pb-9">
                  <span className="font-display grid size-11 place-items-center rounded-full bg-[#1f4b3f] text-lg font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-[#332d28]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#71675f]">{step.description}</p>
                    {step.timerMinutes !== null && (
                      <p className="mt-2 text-xs font-semibold text-[#8e402c]">
                        Thời gian: {formatMinutes(step.timerMinutes)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {recipe.instructions && (
              <p className="mt-8 rounded-[1.4rem] border border-[#e0cbb9] bg-[#fff6eb] p-6 text-sm leading-7 text-[#6e5e53]">
                {recipe.instructions}
              </p>
            )}
          </section>
        </div>

        <RecipeImageManager
          recipeId={recipe.id}
          images={recipe.images}
          authorId={recipe.author?.id}
        />
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3">
      <span className="text-[#b65338] [&>svg]:size-5">{icon}</span>
      <div>
        <dt className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8a8077]">{label}</dt>
        <dd className="mt-1 text-sm font-bold text-[#3a342f]">{value}</dd>
      </div>
    </div>
  );
}
