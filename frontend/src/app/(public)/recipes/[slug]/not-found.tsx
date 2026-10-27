import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Slug không tồn tại hoặc công thức đã bị xoá (backend trả 404). */
export default function RecipeNotFound() {
  return (
    <section className="site-container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-8xl font-bold text-[#d9c7b5]">404</p>
      <h1 className="font-display mt-3 text-4xl font-bold text-[#2e2925]">Không tìm thấy công thức</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-[#70675f]">Công thức có thể đã bị xoá hoặc đường dẫn không đúng. Bạn thử tìm món khác trong danh sách công thức nhé.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button asChild><Link href="/recipes">Xem các công thức</Link></Button>
        <Button asChild variant="outline"><Link href="/">Về trang chủ</Link></Button>
      </div>
    </section>
  );
}
