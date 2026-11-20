import { ArrowRight, BookOpen, Dices, Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ShareRecipeButton } from "@/components/recipes/ShareRecipeButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import { getLatestPublicRecipes, getPublicCategories } from "@/lib/api/recipes";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [categoriesResult, recipesResult] = await Promise.allSettled([
    getPublicCategories(),
    getLatestPublicRecipes(),
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : null;
  const recipes = recipesResult.status === "fulfilled" ? recipesResult.value.items : null;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-muted">
        <div className="hero-dots" aria-hidden="true" />
        <div className="site-container grid items-center gap-9 py-10 lg:h-[calc(100svh-74px)] lg:min-h-[610px] lg:max-h-[820px] lg:grid-cols-[.96fr_1.04fr] lg:gap-12 lg:py-10">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="warm"><Sparkles className="mr-1.5 size-3" />Cảm hứng từ căn bếp Việt</Badge>
            <h1 className="font-display mt-5 text-[clamp(3.25rem,5.4vw,5.6rem)] leading-[.88] font-bold tracking-[-0.055em] text-foreground">
              Nấu một món,<br /><span className="relative text-accent italic">kể một chuyện.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-foreground">Bếp Nhà là nơi lưu giữ những công thức tử tế, mẹo nhỏ hữu ích và câu chuyện ấm áp quanh mâm cơm mỗi ngày.</p>
            <div className="mt-6 max-w-xl">
              <form action="/search" className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-card p-2 pl-5 shadow-md">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <label htmlFor="hero-search" className="sr-only">Tìm công thức</label>
                <input id="hero-search" name="q" minLength={2} required placeholder="Hôm nay bạn muốn nấu món gì?" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                <Button type="submit" size="lg">Tìm món</Button>
              </form>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                <span className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">hoặc</span>
                <ShareRecipeButton />
                <Button variant="ghost" className="text-primary hover:bg-primary-soft" asChild>
                  <Link href="/random"><Dices />Không biết ăn gì?</Link>
                </Button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-2"><BookOpen className="size-4 text-primary" />Công thức từ cộng đồng</span>
              <span>{categories ? `${categories.length} danh mục để khám phá` : "Danh mục từ cộng đồng"}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px] lg:ml-auto">
            <div className="absolute -top-5 right-8 size-24 rounded-full border border-border" aria-hidden="true" />
            <div className="absolute -bottom-7 -left-6 size-40 rounded-full bg-primary-soft" aria-hidden="true" />
            <div className="relative ml-auto aspect-[6/5] w-[90%] overflow-hidden rounded-[7rem_2rem_7rem_2rem] bg-subtle shadow-md">
              <Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="Bàn ăn đầy sắc màu với những món ăn tươi ngon" fill priority sizes="(max-width: 1024px) 80vw, 42vw" className="object-cover" />
            </div>
            <div className="absolute right-0 bottom-8 rounded-2xl border border-card/70 bg-muted/95 p-3.5 pr-5 shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-accent-soft text-xl">🌿</span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent">Gợi ý hôm nay</p><p className="font-display mt-1 font-bold text-foreground">Ăn lành, sống xanh</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="danh-muc" className="site-container py-20 sm:py-24">
        <div className="section-heading">
          <div><Badge>Khám phá theo vị</Badge><h2 className="font-display section-title">Bạn muốn nấu gì hôm nay?</h2></div>
          <div className="flex items-center gap-4">
            <p className="section-description">Từ bữa cơm quen thuộc đến một món mới cuối tuần — luôn có điều hay ho đang chờ trong bếp.</p>
            <Link href="/categories" className="shrink-0 text-sm font-bold text-primary hover:text-accent">Tất cả danh mục</Link>
          </div>
        </div>
        {categoriesResult.status === "rejected" ? (
          <div className="mt-8"><ErrorState title="Không tải được danh mục" message={getErrorMessage(categoriesResult.reason)} /></div>
        ) : categories?.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex min-h-44 flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
              <div><span className="font-display text-5xl font-bold">{categories.length}</span><p className="mt-1 text-sm text-primary-foreground/70">danh mục đang chờ bạn khám phá</p></div>
              <Link href="/categories" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent-soft hover:text-white">Khám phá tất cả <ArrowRight className="size-4" /></Link>
            </div>
            {categories.slice(0, 3).map((category, index) => (
              <Link key={category.id} href={`/categories/${encodeURIComponent(category.slug)}`} className="group flex min-h-44 items-end overflow-hidden rounded-2xl border border-border bg-primary-soft p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <span className="flex w-full items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-card/70 text-primary">
                    {category.imageUrl ? <Image src={category.imageUrl} alt="" width={96} height={96} unoptimized className="size-full object-cover" /> : <span className="font-display text-3xl font-bold">{category.name.charAt(0) || index + 1}</span>}
                  </span>
                  <span><span className="block text-xs font-bold uppercase tracking-[.14em] text-primary/70">Gợi ý {String(index + 1).padStart(2, "0")}</span><span className="font-display mt-1 block text-xl font-bold text-foreground">{category.name}</span><span className="mt-1 block text-xs text-muted-foreground">Khám phá công thức</span></span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">Chưa có danh mục nào.</p>
        )}
      </section>

      <section id="cong-thuc" className="border-y border-border bg-card/60 py-20 sm:py-24">
        <div className="site-container">
          <div className="section-heading">
            <div><Badge variant="warm">Mới nhất</Badge><h2 className="font-display section-title">Công thức mới từ cộng đồng</h2></div>
            <Button variant="outline" asChild><Link href="/recipes">Xem tất cả <ArrowRight /></Link></Button>
          </div>
          {recipesResult.status === "rejected" ? (
            <div className="mt-8"><ErrorState title="Không tải được công thức" message={getErrorMessage(recipesResult.reason)} /></div>
          ) : recipes?.length ? (
            <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => <RecipeCard key={recipe.id} recipe={recipe} priority={index < 3} />)}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-card p-6 text-center text-sm text-muted-foreground">Chưa có công thức công khai nào.</p>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-muted py-20">
        <div className="site-container flex flex-col items-center text-center">
          <span className="text-4xl">💌</span>
          <h2 className="font-display mt-5 text-4xl font-bold tracking-[-.04em] text-foreground">Thư ngon gửi từ căn bếp</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Mỗi tuần một thực đơn nhỏ, một câu chuyện ấm và vài mẹo bếp hữu ích. <br /> Không quảng cáo, chỉ có món ngon.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
