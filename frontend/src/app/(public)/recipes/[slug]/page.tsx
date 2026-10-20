import type { Metadata } from "next";
import { ChefHat, Clock3, Flame, Printer, Share2, Star, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { featuredRecipes } from "@/lib/mock-data";
import { formatMinutes } from "@/lib/utils";

interface RecipePageProps { params: Promise<{ slug: string }> }

const ingredients = ["300g nguyên liệu chính", "2 muỗng canh dầu ô-liu", "1 củ hành tím, thái mỏng", "2 tép tỏi băm", "Rau thơm theo mùa", "Muối, tiêu và gia vị vừa đủ"];
const steps = [
  { title: "Sơ chế thật gọn", content: "Rửa sạch rau củ, để ráo và chuẩn bị sẵn các nguyên liệu theo đúng định lượng. Việc chuẩn bị trước giúp quá trình nấu nhẹ nhàng hơn." },
  { title: "Đánh thức hương thơm", content: "Làm nóng chảo ở lửa vừa, cho dầu và phi thơm hành tỏi đến khi chuyển màu vàng nhạt. Giữ lửa đều để không làm cháy gia vị." },
  { title: "Nấu vừa tới", content: "Thêm nguyên liệu chính, đảo đều và nêm nếm. Nấu đến khi nguyên liệu vừa chín tới để giữ được độ mọng và màu sắc tự nhiên." },
  { title: "Hoàn thiện món ăn", content: "Tắt bếp, thêm rau thơm và một chút tiêu mới xay. Trình bày ra đĩa, thưởng thức khi món ăn còn ấm." },
];

export function generateStaticParams() { return featuredRecipes.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = featuredRecipes.find((item) => item.slug === slug);
  return recipe ? { title: recipe.title, description: recipe.excerpt } : { title: "Không tìm thấy công thức", robots: { index: false } };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params;
  const recipe = featuredRecipes.find((item) => item.slug === slug);
  if (!recipe) notFound();

  return (
    <article>
      <div className="site-container py-10 sm:py-14">
        <div className="text-xs font-semibold text-[#81766d]"><Link href="/" className="hover:text-[#1f4b3f]">Trang chủ</Link><span className="mx-2">/</span><Link href="/recipes" className="hover:text-[#1f4b3f]">Công thức</Link><span className="mx-2">/</span><span>{recipe.category}</span></div>
        <header className="mx-auto mt-10 max-w-4xl text-center">
          <Badge variant="warm">{recipe.category}</Badge>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] font-bold tracking-[-.05em] text-[#2b2622] sm:text-7xl">{recipe.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#70665e]">{recipe.excerpt} Một công thức đủ gần gũi cho bữa cơm thường ngày và đủ đặc biệt cho dịp sum họp.</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-[#665d55]">
            <span className="font-bold text-[#1f4b3f]">Bởi {recipe.author}</span><span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-[#d99a42] text-[#d99a42]" />{recipe.rating} (128 đánh giá)</span><span>Cập nhật 18.10.2026</span>
          </div>
        </header>

        <div className="relative mt-12 aspect-[16/8.2] min-h-[360px] overflow-hidden rounded-[2rem] bg-[#e4d8ca]">
          <Image src={recipe.image} alt={recipe.title} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />
          <div className="absolute right-5 bottom-5 flex gap-2"><Button variant="secondary" size="icon" aria-label="In công thức"><Printer /></Button><Button variant="secondary" size="icon" aria-label="Chia sẻ công thức"><Share2 /></Button></div>
        </div>

        <dl className="mx-auto -mt-1 grid max-w-4xl grid-cols-2 divide-x divide-y divide-[#ded3c6] rounded-b-[1.5rem] border border-[#ded3c6] bg-white px-4 py-5 shadow-[0_18px_40px_rgba(80,59,39,.07)] sm:grid-cols-4 sm:divide-y-0">
          <Info icon={<Clock3 />} label="Chuẩn bị" value="15 phút" />
          <Info icon={<Flame />} label="Nấu" value={formatMinutes(recipe.time)} />
          <Info icon={<UsersRound />} label="Khẩu phần" value="4 người" />
          <Info icon={<ChefHat />} label="Độ khó" value={recipe.difficulty} />
        </dl>

        <div className="mx-auto grid max-w-5xl gap-14 py-20 lg:grid-cols-[.72fr_1.28fr]">
          <aside>
            <div className="sticky top-28 rounded-[1.5rem] bg-[#efe5d8] p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a64e37]">Chuẩn bị</p>
              <h2 className="font-display mt-2 text-3xl font-bold text-[#302a26]">Nguyên liệu</h2>
              <p className="mt-2 text-sm text-[#766b62]">Cho 4 người ăn</p>
              <ul className="mt-7 space-y-4">{ingredients.map((ingredient) => <li key={ingredient} className="flex gap-3 text-sm leading-6 text-[#4e4741]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#b65338]" />{ingredient}</li>)}</ul>
            </div>
          </aside>
          <section>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#1f4b3f]">Cùng vào bếp</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-[#302a26]">Cách thực hiện</h2>
            <ol className="mt-9 space-y-9">{steps.map((step, index) => <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[#e0d6ca] pb-9"><span className="font-display grid size-11 place-items-center rounded-full bg-[#1f4b3f] text-lg font-bold text-white">{index + 1}</span><div><h3 className="font-display text-2xl font-bold text-[#332d28]">{step.title}</h3><p className="mt-2 text-sm leading-7 text-[#71675f]">{step.content}</p></div></li>)}</ol>
            <div className="mt-10 rounded-[1.4rem] border border-[#e0cbb9] bg-[#fff6eb] p-6"><p className="font-display text-xl font-bold text-[#8e402c]">Mẹo nhỏ từ Bếp Nhà</p><p className="mt-2 text-sm leading-7 text-[#6e5e53]">Nếm lại món ăn trước khi tắt bếp. Một chút chua hoặc vài giọt dầu thơm ở cuối thường khiến hương vị sáng và cân bằng hơn.</p></div>
          </section>
        </div>
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-center gap-3 px-4 py-3"><span className="text-[#b65338] [&>svg]:size-5">{icon}</span><div><dt className="text-[10px] font-bold uppercase tracking-[.13em] text-[#8a8077]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#3a342f]">{value}</dd></div></div>;
}
