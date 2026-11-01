"use client";

import { ArrowRight, AtSign, Eye, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackFallback = "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setIsSubmitting(true);
    const result = await signIn("credentials", {
      action: "register",
      fullName: String(form.get("fullName") ?? ""),
      userName: String(form.get("userName") ?? ""),
      email: String(form.get("email") ?? ""),
      password,
      redirect: false,
    });
    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Không thể tạo tài khoản. Email hoặc tên đăng nhập có thể đã được sử dụng.");
      return;
    }

    router.push(getCallbackUrl(callbackFallback));
    router.refresh();
  }

  return (
    <section className="site-container grid min-h-[calc(100vh-74px)] items-center gap-8 py-6 sm:py-10 lg:grid-cols-2 lg:gap-12">
      <div className="hidden h-[560px] overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#b65338,#7d3828)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f3d7c6]">Gia nhập Bếp Nhà</p>
        <blockquote className="font-display max-w-lg text-4xl leading-[1.08] font-bold tracking-[-.04em]">“Món ngon nhất luôn bắt đầu từ một căn bếp có người sẻ chia.”</blockquote>
        <p className="text-sm text-white/70">Lưu món yêu thích · Viết công thức · Kể câu chuyện của bạn</p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-[#b65338]">Tạo tài khoản</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-[-.045em] text-[#2f2925] sm:text-5xl">Mở căn bếp riêng</h1>
        <p className="mt-1 text-xs leading-5 text-[#746a62] sm:text-sm sm:leading-6">Chỉ mất một phút để bắt đầu lưu và chia sẻ những món ngon.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
          <Field icon={UserRound} label="Họ và tên"><input name="fullName" required minLength={2} maxLength={100} className="h-10 w-full bg-transparent text-sm outline-none sm:h-11" /></Field>
          <Field icon={AtSign} label="Tên đăng nhập"><input name="userName" required pattern="[A-Za-z0-9_.-]+" title="Chỉ dùng chữ, số và các ký tự _ . -" className="h-10 w-full bg-transparent text-sm outline-none sm:h-11" /></Field>
          <Field icon={Mail} label="Email"><input name="email" type="email" required className="h-10 w-full bg-transparent text-sm outline-none sm:h-11" /></Field>
          <Field icon={LockKeyhole} label="Mật khẩu">
            <input name="password" type={showPassword ? "text" : "password"} required minLength={8} className="h-10 w-full bg-transparent text-sm outline-none sm:h-11" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}><Eye className="size-4 text-[#776d65]" /></button>
          </Field>
          <Field icon={LockKeyhole} label="Xác nhận mật khẩu"><input name="confirmPassword" type={showPassword ? "text" : "password"} required minLength={8} className="h-10 w-full bg-transparent text-sm outline-none sm:h-11" /></Field>
          <p className="text-xs leading-4 text-[#847971]">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>{isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}<ArrowRight /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#746a62]">Đã có tài khoản? <Link href="/login" onClick={(event) => { event.preventDefault(); router.push(`/login?callbackUrl=${encodeURIComponent(getCallbackUrl(callbackFallback))}`); }} className="font-bold text-[#1f4b3f]">Đăng nhập</Link></p>
      </div>
    </section>
  );
}

function getCallbackUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("callbackUrl");
  return requested?.startsWith("/") && !requested.startsWith("//") ? requested : fallback;
}

function Field({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold text-[#48413b] sm:mb-2 sm:text-sm">{label}</span><span className="flex items-center gap-3 rounded-xl border border-[#d9cdbf] bg-white px-4"><Icon className="size-4 shrink-0 text-[#998e84]" />{children}</span></label>;
}
