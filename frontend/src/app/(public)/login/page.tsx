"use client";

import { ArrowRight, Eye, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? ""), redirect: false });
    setIsSubmitting(false);
    if (!result || result.error) { setError("Email hoặc mật khẩu không đúng."); return; }
    router.push("/dashboard/recipes");
  }

  return (
    <section className="site-container grid min-h-[720px] items-center gap-12 py-14 lg:grid-cols-2">
      <div className="hidden h-[620px] overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#1f4b3f,#2f6958)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#e2c3ad]">Căn bếp của riêng bạn</p>
        <blockquote className="font-display max-w-lg text-5xl leading-[1.08] font-bold tracking-[-.04em]">“Mỗi công thức được lưu là một kỷ niệm có thể nếm lại.”</blockquote>
        <div className="flex items-center gap-3 text-sm text-white/70"><span className="grid size-10 place-items-center rounded-full bg-white/10">🍲</span>Tham gia cùng hơn 2.000 người yêu bếp</div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b65338]">Chào mừng trở lại</p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.045em] text-[#2f2925]">Vào bếp thôi!</h1>
        <p className="mt-3 text-sm leading-7 text-[#746a62]">Đăng nhập để lưu món yêu thích và chia sẻ công thức của riêng bạn.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block"><span className="mb-2 block text-sm font-bold text-[#48413b]">Email</span><span className="flex items-center gap-3 rounded-xl border border-[#d9cdbf] bg-white px-4"><Mail className="size-4 text-[#998e84]" /><input name="email" type="email" required className="h-12 w-full bg-transparent text-sm outline-none" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-[#48413b]">Mật khẩu</span><span className="flex items-center gap-3 rounded-xl border border-[#d9cdbf] bg-white px-4"><LockKeyhole className="size-4 text-[#998e84]" /><input name="password" type={showPassword ? "text" : "password"} required className="h-12 w-full bg-transparent text-sm outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}><Eye className="size-4 text-[#776d65]" /></button></span></label>
          <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-[#6d645c]"><input type="checkbox" className="accent-[#1f4b3f]" />Ghi nhớ tôi</label><Link href="#" className="font-bold text-[#1f4b3f]">Quên mật khẩu?</Link></div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"} <ArrowRight /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#746a62]">Chưa có tài khoản? <Link href="#" className="font-bold text-[#b65338]">Đăng ký miễn phí</Link></p>
        <p className="mt-5 rounded-xl bg-[#efe8de] px-4 py-3 text-center text-xs leading-5 text-[#746a62]">Bản Lab 6 đang dùng tài khoản demo phía frontend trong thời gian backend được refactor.</p>
      </div>
    </section>
  );
}
