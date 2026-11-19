import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="site-container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="text-8xl font-bold text-subtle">404</p>
      <h1 className="mt-3 text-4xl font-bold text-foreground">Món này chưa có trong bếp</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">Có thể công thức đã được chuyển đi nơi khác. Mời bạn quay lại gian bếp chính để khám phá món mới.</p>
      <Button className="mt-7" asChild><Link href="/">Về trang chủ</Link></Button>
    </section>
  );
}
