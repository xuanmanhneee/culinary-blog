import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="site-container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-8xl font-bold text-[#d9c7b5]">404</p>
      <h1 className="font-display mt-3 text-4xl font-bold text-[#2e2925]">Món này chưa có trong bếp</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-[#70675f]">Có thể công thức đã được chuyển đi nơi khác. Mời bạn quay lại gian bếp chính để khám phá món mới.</p>
      <Button className="mt-7" asChild><Link href="/">Về trang chủ</Link></Button>
    </section>
  );
}
