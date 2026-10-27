import { ArrowRight, BookOpen, Heart, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categories, featuredRecipes } from "@/lib/mock-data";

export default function Home() {
  return (
    <>
      <main>
      <section className="relative overflow-hidden border-b border-[#e0d6ca] bg-[#f5ecdf]">
        <div className="hero-dots" aria-hidden="true" />
        <div className="site-container grid min-h-[680px] items-center gap-12 py-16 lg:grid-cols-[.92fr_1.08fr] lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="warm"><Sparkles className="mr-1.5 size-3" />Cảm hứng từ căn bếp Việt</Badge>
            <h1 className="font-display mt-7 text-[clamp(3.5rem,7vw,6.8rem)] leading-[.9] font-bold tracking-[-0.06em] text-[#29231f]">
              Nấu một món,<br /><span className="relative text-[#b65338] italic">kể một chuyện.</span>
            </h1>
            <p className="mt-7 max-w-xl text-[1.08rem] leading-8 text-[#685f57]">Bếp Nhà là nơi lưu giữ những công thức tử tế, mẹo nhỏ hữu ích và câu chuyện ấm áp quanh mâm cơm mỗi ngày.</p>
            <form action="#cong-thuc" className="mt-9 flex max-w-xl items-center gap-2 rounded-full border border-[#d4c5b4] bg-white/85 p-2 pl-5 shadow-[0_16px_45px_rgba(75,57,41,.09)]">
              <Search className="size-5 shrink-0 text-[#988b80]" />
              <label htmlFor="hero-search" className="sr-only">Tìm công thức</label>
              <input id="hero-search" name="q" placeholder="Hôm nay bạn muốn nấu món gì?" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#352f2b] outline-none placeholder:text-[#9b9188]" />
              <Button type="submit" size="lg">Tìm món</Button>
            </form>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#655c54]">
              <span className="inline-flex items-center gap-2"><BookOpen className="size-4 text-[#1f4b3f]" />180+ công thức</span>
              <span className="inline-flex items-center gap-2"><Heart className="size-4 fill-[#b65338] text-[#b65338]" />Từ những người yêu bếp</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] lg:ml-auto">
            <div className="absolute -top-6 right-8 size-32 rounded-full border border-[#cbbca8]" aria-hidden="true" />
            <div className="absolute -bottom-8 -left-8 size-52 rounded-full bg-[#dce7d9]" aria-hidden="true" />
            <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[9rem_2rem_9rem_2rem] bg-[#d9cbb9] shadow-[0_35px_70px_rgba(77,56,38,.22)]">
              <Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="Bàn ăn đầy sắc màu với những món ăn tươi ngon" fill priority sizes="(max-width: 1024px) 80vw, 42vw" className="object-cover" />
            </div>
            <div className="absolute right-0 bottom-12 rounded-2xl border border-white/70 bg-[#fffaf3]/94 p-4 pr-6 shadow-[0_20px_50px_rgba(66,48,32,.17)] backdrop-blur-sm">
              <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#f2d9c9] text-xl">🌿</span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a65a43]">Gợi ý hôm nay</p><p className="font-display mt-1 font-bold text-[#332d28]">Ăn lành, sống xanh</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="danh-muc" className="site-container py-20 sm:py-24">
        <div className="section-heading">
          <div><Badge>Khám phá theo vị</Badge><h2 className="font-display section-title">Bạn muốn nấu gì hôm nay?</h2></div>
          <p className="section-description">Từ bữa cơm quen thuộc đến một món mới cuối tuần — luôn có điều hay ho đang chờ trong bếp.</p>
        </div>
        <div className="mt-11 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link key={category.name} href="#cong-thuc" className="category-card group">
              <span className="grid aspect-square w-full place-items-center rounded-full text-[2.8rem] transition duration-500 group-hover:-translate-y-1 group-hover:rotate-3" style={{ backgroundColor: category.color }}>{category.icon}</span>
              <span className="font-display mt-4 text-lg font-bold text-[#332d28]">{category.name}</span>
              <span className="mt-1 text-xs text-[#82786f]">{category.count} công thức</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="cong-thuc" className="border-y border-[#e2d8cb] bg-white/45 py-20 sm:py-24">
        <div className="site-container">
          <div className="section-heading">
            <div><Badge variant="warm">Được yêu thích</Badge><h2 className="font-display section-title">Món ngon từ cộng đồng</h2></div>
            <Button variant="outline" asChild><Link href="/recipes">Xem tất cả <ArrowRight /></Link></Button>
          </div>
          <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {featuredRecipes.map((recipe, index) => <RecipeCard key={recipe.slug} recipe={recipe} priority={index < 3} />)}
          </div>
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
      </main>
      <Footer />
    </>
  );
}
