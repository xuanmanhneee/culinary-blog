import { ArrowRight, BookOpen, Search, Sparkles, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import { getLatestPublicRecipes, getPublicCategories } from "@/lib/api/recipes";

export default async function Home() {
  const [categoriesResult, recipesResult] = await Promise.allSettled([
    getPublicCategories(),
    getLatestPublicRecipes(),
  ]);
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value : null;
  const recipes = recipesResult.status === "fulfilled" ? recipesResult.value.items : null;

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#e0d6ca] bg-[#f5ecdf]">
        <div className="hero-dots" aria-hidden="true" />
        <div className="site-container grid items-center gap-9 py-10 lg:h-[calc(100svh-74px)] lg:min-h-[610px] lg:max-h-[820px] lg:grid-cols-[.96fr_1.04fr] lg:gap-12 lg:py-10">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="warm"><Sparkles className="mr-1.5 size-3" />Cảm hứng từ căn bếp Việt</Badge>
            <h1 className="font-display mt-5 text-[clamp(3.25rem,5.4vw,5.6rem)] leading-[.88] font-bold tracking-[-0.055em] text-[#29231f]">
              Nấu một món,<br /><span className="relative text-[#b65338] italic">kể một chuyện.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#685f57]">Bếp Nhà là nơi lưu giữ những công thức tử tế, mẹo nhỏ hữu ích và câu chuyện ấm áp quanh mâm cơm mỗi ngày.</p>
            <div className="mt-6 max-w-xl">
              <form action="/search" className="flex min-w-0 items-center gap-2 rounded-full border border-[#d4c5b4] bg-white/85 p-2 pl-5 shadow-[0_16px_45px_rgba(75,57,41,.09)]">
                <Search className="size-5 shrink-0 text-[#988b80]" />
                <label htmlFor="hero-search" className="sr-only">Tìm công thức</label>
                <input id="hero-search" name="q" minLength={2} required placeholder="Hôm nay bạn muốn nấu món gì?" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#352f2b] outline-none placeholder:text-[#9b9188]" />
                <Button type="submit" size="lg">Tìm món</Button>
              </form>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                <span className="text-xs font-bold uppercase tracking-[.14em] text-[#8c7e72]">hoặc</span>
                <Button variant="outline" className="border-[#b65338]/35 bg-[#fffaf3] text-[#a3422b] shadow-[0_7px_20px_rgba(182,83,56,.12)] hover:border-[#b65338] hover:bg-[#b65338] hover:text-white" asChild>
                  <Link href="/dashboard/recipes/new"><UtensilsCrossed />Chia sẻ món ăn của bạn</Link>
                </Button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#655c54]">
              <span className="inline-flex items-center gap-2"><BookOpen className="size-4 text-[#1f4b3f]" />Công thức từ cộng đồng</span>
              <span>{categories ? `${categories.length} danh mục để khám phá` : "Danh mục từ cộng đồng"}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px] lg:ml-auto">
            <div className="absolute -top-5 right-8 size-24 rounded-full border border-[#cbbca8]" aria-hidden="true" />
            <div className="absolute -bottom-7 -left-6 size-40 rounded-full bg-[#dce7d9]" aria-hidden="true" />
            <div className="relative ml-auto aspect-[6/5] w-[90%] overflow-hidden rounded-[7rem_2rem_7rem_2rem] bg-[#d9cbb9] shadow-[0_28px_60px_rgba(77,56,38,.2)]">
              <Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="Bàn ăn đầy sắc màu với những món ăn tươi ngon" fill priority sizes="(max-width: 1024px) 80vw, 42vw" className="object-cover" />
            </div>
            <div className="absolute right-0 bottom-8 rounded-2xl border border-white/70 bg-[#fffaf3]/94 p-3.5 pr-5 shadow-[0_18px_42px_rgba(66,48,32,.16)] backdrop-blur-sm">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#f2d9c9] text-xl">🌿</span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a65a43]">Gợi ý hôm nay</p><p className="font-display mt-1 font-bold text-[#332d28]">Ăn lành, sống xanh</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="danh-muc" className="site-container py-20 sm:py-24">
        <div className="section-heading">
          <div><Badge>Khám phá theo vị</Badge><h2 className="font-display section-title">Bạn muốn nấu gì hôm nay?</h2></div>
          <div className="flex items-center gap-4">
            <p className="section-description">Từ bữa cơm quen thuộc đến một món mới cuối tuần — luôn có điều hay ho đang chờ trong bếp.</p>
            <Link href="/categories" className="shrink-0 text-sm font-bold text-[#1f4b3f] hover:text-[#b65338]">Tất cả danh mục</Link>
          </div>
        </div>
        {categoriesResult.status === "rejected" ? (
          <div className="mt-8"><ErrorState title="Không tải được danh mục" message={getErrorMessage(categoriesResult.reason)} /></div>
        ) : categories?.length ? (
          <div className="mt-11 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/search?categorySlug=${encodeURIComponent(category.slug)}`} className="category-card group">
                <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-full bg-[#e3eee7] transition duration-500 group-hover:-translate-y-1 group-hover:rotate-3">
                  {category.imageUrl ? (
                    <Image src={category.imageUrl} alt="" width={240} height={240} unoptimized className="size-full object-cover" />
                  ) : (
                    <span className="font-display text-4xl font-bold text-[#1f4b3f]">{category.name.charAt(0) || index + 1}</span>
                  )}
                </span>
                <span className="font-display mt-4 text-lg font-bold text-[#332d28]">{category.name}</span>
                <span className="mt-1 text-xs text-[#82786f]">Khám phá công thức</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl bg-white/70 p-6 text-center text-sm text-[#70675f]">Chưa có danh mục nào.</p>
        )}
      </section>

      <section id="cong-thuc" className="border-y border-[#e2d8cb] bg-white/45 py-20 sm:py-24">
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
            <p className="mt-8 rounded-xl bg-white/70 p-6 text-center text-sm text-[#70675f]">Chưa có công thức công khai nào.</p>
          )}
        </div>
      </section>

      <section id="cau-chuyen" className="site-container py-20 sm:py-28">
        <div className="grid overflow-hidden rounded-[2rem] bg-[#1f4b3f] text-white lg:grid-cols-2">
          <div className="relative min-h-[420px]"><Image src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=88" alt="Cùng nhau chuẩn bị bữa cơm trong căn bếp" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#173d33]/35 to-transparent" /></div>
          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d8b9a4]">Chuyện bếp tháng này</p>
            <blockquote className="font-display mt-6 text-3xl leading-tight font-bold tracking-[-.025em] sm:text-4xl">“Có những hương vị chỉ cần nếm lại là thấy mình đang ở nhà.”</blockquote>
            <p className="mt-6 leading-7 text-white/72">Cùng Bếp Nhà ghé thăm căn bếp nhỏ của cô Mai ở Hội An — nơi công thức cao lầu đã đi qua ba thế hệ.</p>
            <Link href="#" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#f3d8c5] hover:text-white">Đọc câu chuyện <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e1d5c7] bg-[#f1e5d7] py-20">
        <div className="site-container flex flex-col items-center text-center">
          <span className="text-4xl">💌</span>
          <h2 className="font-display mt-5 text-4xl font-bold tracking-[-.04em] text-[#2e2925]">Thư ngon gửi từ căn bếp</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#6d635b]">Mỗi tuần một thực đơn nhỏ, một câu chuyện ấm và vài mẹo bếp hữu ích. Không quảng cáo, chỉ có món ngon.</p>
          <form className="mt-7 flex w-full max-w-lg flex-col gap-2 sm:flex-row" action="#">
            <label htmlFor="newsletter-email" className="sr-only">Địa chỉ email</label>
            <input id="newsletter-email" type="email" required placeholder="ban@email.com" className="h-12 min-w-0 flex-1 rounded-full border border-[#cfc0ae] bg-white/85 px-5 text-sm outline-none focus:border-[#1f4b3f] focus:ring-2 focus:ring-[#1f4b3f]/15" />
            <Button type="submit" size="lg">Nhận thư bếp</Button>
          </form>
        </div>
      </section>
    </>
  );
}
