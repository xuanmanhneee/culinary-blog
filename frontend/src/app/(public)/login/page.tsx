"use client";

import { ArrowRight, Eye, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Roles } from "@/lib/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackFallback = "/";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const form = new FormData(event.currentTarget);
      const result = await signIn("credentials", {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          result?.code === "account_locked"
            ? "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên hoặc thử lại sau."
            : "Email hoặc mật khẩu không đúng.",
        );
        return;
      }

      const session = await getSession();
      router.push(session?.user.roles?.includes(Roles.Admin) ? "/dashboard" : getCallbackUrl(callbackFallback));
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="site-container grid min-h-[720px] items-center gap-12 py-14 lg:grid-cols-2">
      <div className="hidden h-[620px] overflow-hidden rounded-2xl bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-accent-soft">Căn bếp của riêng bạn</p>
        <blockquote className="font-display max-w-lg text-5xl leading-[1.08] font-bold tracking-[-.04em]">“Mỗi công thức được lưu là một kỷ niệm có thể nếm lại.”</blockquote>
        <div className="flex items-center gap-3 text-sm text-white/70"><span className="grid size-10 place-items-center rounded-full bg-card">🍲</span>Tham gia cùng hơn 2.000 người yêu bếp</div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-accent">Chào mừng trở lại</p>
        <h1 className="font-display mt-3 text-5xl font-bold tracking-[-.045em] text-foreground">Vào bếp thôi!</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Đăng nhập để lưu món yêu thích và chia sẻ công thức của riêng bạn.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block"><span className="mb-2 block text-sm font-bold text-foreground">Email</span><span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4"><Mail className="size-4 text-muted-foreground" /><input name="email" type="email" required className="h-12 w-full bg-transparent text-sm outline-none" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-foreground">Mật khẩu</span><span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4"><LockKeyhole className="size-4 text-muted-foreground" /><input name="password" type={showPassword ? "text" : "password"} required className="h-12 w-full bg-transparent text-sm outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}><Eye className="size-4 text-muted-foreground" /></button></span></label>
          <div className="flex items-center justify-between text-xs"><label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" />Ghi nhớ tôi</label><span className="font-bold text-muted-foreground">Quên mật khẩu?</span></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"} <ArrowRight /></Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-muted" /><span>HOẶC</span><span className="h-px flex-1 bg-muted" /></div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full bg-card"
          disabled={!googleEnabled}
          title={googleEnabled ? undefined : "Google OAuth chưa được cấu hình"}
          onClick={() => void signIn("google", { redirectTo: getCallbackUrl(callbackFallback) })}
        >
          <span className="grid size-6 place-items-center rounded-full border border-border text-sm font-bold text-[#4285f4]">G</span>
          Đăng nhập bằng Google
        </Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">Chưa có tài khoản? <Link href="/register" onClick={(event) => { event.preventDefault(); router.push(`/register?callbackUrl=${encodeURIComponent(getCallbackUrl(callbackFallback))}`); }} className="font-bold text-accent">Đăng ký miễn phí</Link></p>
      </div>
    </section>
  );
}

function getCallbackUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const requested = new URLSearchParams(window.location.search).get("callbackUrl");
  return requested?.startsWith("/") && !requested.startsWith("//") ? requested : fallback;
}
