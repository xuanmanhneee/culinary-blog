import type { Metadata } from "next";
import { ChefHat, Clock3, Flame, ImageOff, Lock, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecipeImageManager from "@/components/recipes/RecipeImageManager";
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

  return (
    <article>
      {/* Structured data chỉ cho bản công khai; bản xem trước (noindex) không cần. */}
      {!isPreview && <RecipeJsonLd data={recipe} />}
      <div className="site-container py-6 sm:py-14">
        <div className="text-xs font-semibold text-[#81766d]"><Link href="/" className="hover:text-[#1f4b3f]">Trang chủ</Link><span className="mx-2">/</span><Link href="/recipes" className="hover:text-[#1f4b3f]">Công thức</Link><span className="mx-2">/</span><span>{categoryName}</span></div>

        {isPreview && (
          <p role="status" className="mx-auto mt-6 max-w-4xl rounded-xl border border-[#e0cbb9] bg-[#fff6eb] px-4 py-3 text-center text-sm text-[#8e402c]">
            Bạn đang xem trước công thức ở trạng thái <strong>{RECIPE_STATUS_LABELS[recipe.status]}</strong> – chỉ bạn và quản trị viên nhìn thấy trang này.
          </p>
        )}

        <header className="mx-auto mt-7 max-w-5xl text-center sm:mt-10">
          <Badge variant="warm">{categoryName}</Badge>
          <h1 className="font-display mx-auto mt-5 max-w-5xl break-words text-4xl leading-[1.06] font-bold tracking-[-.05em] text-[#2b2622] sm:text-6xl lg:text-7xl">{recipe.title}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#70665e] sm:mt-6 sm:text-base sm:leading-8">{recipe.description}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm text-[#665d55] sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
            {recipe.author && (
              <span className="inline-flex items-center gap-2 font-bold text-[#1f4b3f]">
                <span className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-[#1f4b3f] text-xs text-white">
                  {recipe.author.avatarUrl
                    ? <Image src={recipe.author.avatarUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
                    : recipe.author.displayName.trim().charAt(0).toLocaleUpperCase("vi")}
                </span>
                Bởi {recipe.author.displayName}
              </span>
            )}
            {recipe.publishedAt && <span>Đăng ngày {formatDate(recipe.publishedAt)}</span>}
          </div>
          <RecipeOwnerActions recipeId={recipe.id} authorId={recipe.author?.id} />
        </header>

        <div className="relative">
          <RecipeGallery images={recipe.images} title={recipe.title} />
          <RecipeActions title={recipe.title} />
        </div>

        <dl className="mx-auto -mt-1 grid max-w-4xl grid-cols-2 divide-x divide-y divide-[#ded3c6] rounded-b-[1.5rem] border border-[#ded3c6] bg-white px-2 py-3 shadow-[0_18px_40px_rgba(80,59,39,.07)] sm:grid-cols-4 sm:divide-y-0 sm:px-4 sm:py-5">
          <Info icon={<Clock3 />} label="Chuẩn bị" value={formatMinutes(recipe.prepTimeMinutes)} />
          <Info icon={<Flame />} label="Nấu" value={formatMinutes(recipe.cookTimeMinutes)} />
          <Info icon={<UsersRound />} label="Khẩu phần" value={`${recipe.servings} người`} />
          <Info icon={<ChefHat />} label="Độ khó" value={RECIPE_DIFFICULTY_LABELS[recipe.difficulty]} />
        </dl>

        <div className="mx-auto max-w-6xl py-14 sm:py-20">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <section className="rounded-[1.5rem] bg-[#efe5d8] p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a64e37]">Chuẩn bị</p>
              <h2 className="font-display mt-2 text-3xl font-bold text-[#302a26]">Nguyên liệu</h2>
              <RecipeIngredients ingredients={ingredients} servings={recipe.servings} />
            </section>
            <RecipeNutrition nutrition={recipe.nutrition} />
          </div>

          <section className="mt-20 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1f4b3f]">Cùng vào bếp</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-[#302a26]">Cách thực hiện</h2>
            <ol className="mt-9 space-y-9">
              {steps.map((step) => (
                <li key={step.id} className="border-b border-[#e0d6ca] pb-9">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-bold text-[#332d28]">{step.title}</h3>
                    {step.timerMinutes && <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#a64e37]"><Clock3 className="size-3.5" aria-hidden />{formatMinutes(step.timerMinutes)}</p>}
                    <p className="mt-2 text-sm leading-7 whitespace-pre-line text-[#71675f]">{step.description}</p>
                    <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-xl bg-[#e8ded1]">
                      {step.imageUrl ? (
                        <Image src={step.imageUrl} alt={`${step.title} – minh hoạ`} fill unoptimized sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-[#a99a8b]">
                          <span className="flex items-center gap-2 text-xs font-semibold"><ImageOff className="size-4" aria-hidden />Chưa có ảnh minh họa</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {recipe.instructions.trim() && <div className="mt-10 rounded-[1.4rem] border border-[#e0cbb9] bg-[#fff6eb] p-6"><p className="font-display text-xl font-bold text-[#8e402c]">Ghi chú của tác giả</p><p className="mt-2 text-sm leading-7 whitespace-pre-line text-[#6e5e53]">{recipe.instructions}</p></div>}
          </section>
        </div>
        <RecipeImageManager
          recipeId={recipe.id}
          images={recipe.images}
          authorId={recipe.author?.id}
          uploadOnly
        />
      </div>
    </article>
  );
}

/** Draft/Archived mà người xem không phải chủ công thức hoặc Admin (backend trả 403). */
function ForbiddenRecipe() {
  return (
    <div className="site-container py-24">
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-[1.5rem] border border-[#e1d5c7] bg-white/65 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-[#f3dfcf] text-[#a94731]"><Lock /></span>
        <h1 className="font-display mt-5 text-2xl font-bold text-[#2e2925]">Công thức chưa được công khai</h1>
        <p className="mt-2 text-sm leading-6 text-[#70675f]">Công thức này đang là bản nháp hoặc đã được lưu trữ. Chỉ tác giả và quản trị viên mới xem được.</p>
        <Button asChild className="mt-6"><Link href="/recipes">Xem các công thức khác</Link></Button>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-center gap-3 px-4 py-3"><span className="text-[#b65338] [&>svg]:size-5">{icon}</span><div><dt className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8a8077]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#3a342f]">{value}</dd></div></div>;
}
