import { Camera, Mail, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

const footerLinks = ["Công thức mới", "Món được yêu thích", "Mẹo vào bếp", "Gửi công thức"];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#d9cdbd] bg-[#efe7db]">
      <div className="site-container grid gap-10 py-14 md:grid-cols-[1.3fr_.8fr_.8fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#6b625a]">Nơi những công thức giản dị được kể bằng tình yêu, để mỗi bữa cơm nhà đều có một câu chuyện đáng nhớ.</p>
          <div className="mt-5 flex gap-2">
            <a className="social-button" href="#" aria-label="Kênh hình ảnh"><Camera /></a>
            <a className="social-button" href="#" aria-label="Cộng đồng Bếp Nhà"><MessageCircle /></a>
            <a className="social-button" href="mailto:hello@bepnha.vn" aria-label="Email"><Mail /></a>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#302a26]">Khám phá</h2>
          <ul className="mt-5 space-y-3 text-sm text-[#6b625a]">
            {footerLinks.map((item) => <li key={item}><Link className="hover:text-[#1f4b3f]" href="/#cong-thuc">{item}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#302a26]">Ghé thăm căn bếp</h2>
          <p className="mt-5 flex gap-3 text-sm leading-6 text-[#6b625a]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#b65338]" />227 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh</p>
          <p className="mt-4 text-sm text-[#6b625a]">hello@bepnha.vn</p>
        </div>
      </div>
      <div className="border-t border-[#d9cdbd] py-5 text-center text-xs text-[#786e66]">© 2026 Bếp Nhà. Nấu bằng cả trái tim.</div>
    </footer>
  );
}
