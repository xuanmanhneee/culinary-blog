"use client";

import { Camera, Mail, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";

const footerLinks = ["Công thức mới", "Món được yêu thích", "Mẹo vào bếp", "Gửi công thức"];

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="mt-auto border-t border-border bg-border">
      <div className="site-container grid gap-10 py-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">Nơi những công thức giản dị được kể bằng tình yêu, để mỗi bữa cơm nhà đều có một câu chuyện đáng nhớ.</p>
          <div className="mt-5 flex gap-2">
            <a className="social-button" href="#" aria-label="Kênh hình ảnh"><Camera /></a>
            <a className="social-button" href="#" aria-label="Cộng đồng Bếp Nhà"><MessageCircle /></a>
            <a className="social-button" href="mailto:hello@bepnha.vn" aria-label="Email"><Mail /></a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">Khám phá</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {footerLinks.map((item) => <li key={item}><Link className="hover:text-primary" href="/#cong-thuc">{item}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">Ghé thăm căn bếp</h2>
          <p className="mt-5 flex gap-3 text-sm leading-6 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" />227 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh</p>
          <p className="mt-4 text-sm text-muted-foreground">hello@bepnha.vn</p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">© 2026 Bếp Nhà. Nấu bằng cả trái tim.</div>
    </footer>
  );
}
