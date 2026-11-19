import type { Metadata } from "next";
import { ChefHat, Clock3, Flame, Lock, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeActions } from "@/components/recipes/RecipeActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecipeGallery } from "@/components/recipes/detail/RecipeGallery";
import { RecipeIngredients } from "@/components/recipes/detail/RecipeIngredients";
import { RecipeNutrition } from "@/components/recipes/detail/RecipeNutrition";
import { RecipeOwnerActions } from "@/components/recipes/detail/RecipeOwnerActions";
import RecipeJsonLd from "@/components/seo/RecipeJsonLd";
import { getRecipeForViewer } from "@/lib/api/recipe-detail";
import { formatDate } from "@/lib/recipe-format";
import { RECIPE_DIFFICULTY_LABELS, RECIPE_STATUS_LABELS, type RecipeDetailDto } from "@/lib/types/recipe";
import { formatMinutes } from "@/lib/utils";

interface RecipePageProps { params: Promise<{ slug: string }> }

/** ISR: trang công khai được làm mới tối đa mỗi 300 giây (SRS 5.1). */
export const revalidate = 300;

function primaryImage(recipe: RecipeDetailDto) {
  return recipe.images.find((image) => image.isPrimary) ?? recipe.images[0];
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getRecipeForViewer(slug);
  if (result.kind !== "found") return { title: "Không tìm thấy công thức", robots: { index: false } };

  const { recipe, isPreview } = result;
  const image = primaryImage(recipe);
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: isPreview ? undefined : { canonical: `/recipes/${encodeURIComponent(recipe.slug)}` },
    openGraph: { title: recipe.title, description: recipe.description, type: "article", ...(image ? { images: [image.url] } : {}) },
    // Bản nháp/lưu trữ chỉ chủ công thức xem trước, không cho công cụ tìm kiếm index.
    robots: isPreview ? { index: false, follow: false } : undefined,
  };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const result = await getRecipeForViewer(slug);
  if (result.kind === "not-found") notFound();
  if (result.kind === "forbidden") return <ForbiddenRecipe />;

  const { recipe, isPreview } = result;
  const ingredients = [...recipe.ingredients].sort((a, b) => a.orderIndex - b.orderIndex);
  const steps = [...recipe.steps].sort((a, b) => a.stepNumber - b.stepNumber);
  const categoryName = recipe.category?.name ?? "Công thức";
  const hasImages = recipe.images.length > 0;

  return (
    <article>
      {/* Structured data chỉ cho bản công khai; bản xem trước (noindex) không cần. */}
      {!isPreview && <RecipeJsonLd data={recipe} />}
      <div className="site-container py-6 sm:py-8">
        <div className="text-xs font-semibold text-muted-foreground"><Link href="/" className="hover:text-primary">Trang chủ</Link><span className="mx-2">/</span><Link href="/recipes" className="hover:text-primary">Công thức</Link><span className="mx-2">/</span><span>{categoryName}</span></div>

        {isPreview && (
          <p role="status" className="mx-auto mt-6 max-w-4xl rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-center text-sm text-accent-hover">
            Bạn đang xem trước công thức ở trạng thái <strong>{RECIPE_STATUS_LABELS[recipe.status]}</strong> – chỉ bạn và quản trị viên nhìn thấy trang này.
          </p>
        )}

        <header className="mx-auto mt-5 max-w-5xl text-center sm:mt-6">
          <Badge variant="warm">{categoryName}</Badge>
          <h1 className="font-display mx-auto mt-3 max-w-5xl break-words text-4xl leading-[1.06] font-bold tracking-[-.05em] text-foreground sm:text-5xl lg:text-6xl">{recipe.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{recipe.description}</p>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-sm text-foreground sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
            {recipe.author && (
              <span className="inline-flex items-center gap-2 font-bold text-primary">
                <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-primary text-xs text-white">
                  {recipe.author.avatarUrl
                    ? <Image src={recipe.author.avatarUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
                    : recipe.author.displayName.trim().charAt(0).toLocaleUpperCase("vi")}
                </span>
                Bởi {recipe.author.displayName}
              </span>
            )}
            {recipe.publishedAt && <span>Đăng ngày {formatDate(recipe.publishedAt)}</span>}
          </div>
          {!isPreview && <RecipeActions recipeId={recipe.id} slug={recipe.slug} title={recipe.title} />}
          <RecipeOwnerActions recipeId={recipe.id} authorId={recipe.author?.id} />
        </header>

        {hasImages && <div className="relative mt-6"><RecipeGallery images={recipe.images} title={recipe.title} /></div>}

        <dl className={`mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-border border border-border bg-card px-2 py-3 shadow-sm sm:grid-cols-4 sm:divide-y-0 sm:px-4 sm:py-5 ${hasImages ? "-mt-1 rounded-b-2xl" : "mt-6 rounded-2xl"}`}>
          <Info icon={<Clock3 />} label="Chuẩn bị" value={formatMinutes(recipe.prepTimeMinutes)} />
          <Info icon={<Flame />} label="Nấu" value={formatMinutes(recipe.cookTimeMinutes)} />
          <Info icon={<UsersRound />} label="Khẩu phần" value={`${recipe.servings} người`} />
          <Info icon={<ChefHat />} label="Độ khó" value={RECIPE_DIFFICULTY_LABELS[recipe.difficulty]} />
        </dl>

        <div className="mx-auto max-w-6xl py-10 sm:py-14">
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <section className="rounded-2xl bg-border p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Chuẩn bị</p>
              <h2 className="font-display mt-2 text-3xl font-bold text-foreground">Nguyên liệu</h2>
              <RecipeIngredients ingredients={ingredients} servings={recipe.servings} />
            </section>
            <RecipeNutrition nutrition={recipe.nutrition} />
          </div>

          <section className="mt-20 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Cùng vào bếp</p>
            <h2 className="mt-2 text-4xl font-bold text-foreground">Cách thực hiện</h2>
            <ol className="mt-9 space-y-9">
              {steps.map((step) => (
                <li key={step.id} className="border-b border-border pb-9">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                    {step.timerMinutes && <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent"><Clock3 className="size-3.5" aria-hidden />{formatMinutes(step.timerMinutes)}</p>}
                    <p className="mt-2 text-sm leading-7 whitespace-pre-line text-muted-foreground">{step.description}</p>
                    {step.imageUrl && (
                      <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                        <Image src={step.imageUrl} alt={`${step.title} – minh hoạ`} fill unoptimized sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {recipe.instructions.trim() && <div className="mt-10 rounded-2xl border border-border bg-card p-6"><p className="text-lg font-bold text-accent-hover">Ghi chú của tác giả</p><p className="mt-2 text-sm leading-7 whitespace-pre-line text-foreground">{recipe.instructions}</p></div>}
          </section>
        </div>
      </div>
    </article>
  );
}

/** Draft/Archived mà người xem không phải chủ công thức hoặc Admin (backend trả 403). */
function ForbiddenRecipe() {
  return (
    <div className="site-container py-24">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent"><Lock /></span>
        <h1 className="mt-5 text-2xl font-bold text-foreground">Công thức chưa được công khai</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Công thức này đang là bản nháp hoặc đã được lưu trữ. Chỉ tác giả và quản trị viên mới xem được.</p>
        <Button asChild className="mt-6"><Link href="/recipes">Xem các công thức khác</Link></Button>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-center gap-3 px-4 py-3"><span className="text-accent [&>svg]:size-5">{icon}</span><div><dt className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-bold text-foreground">{value}</dd></div></div>;
}
