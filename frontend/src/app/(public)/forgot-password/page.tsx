"use client";

import { CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await forgotPassword(String(new FormData(event.currentTarget).get("email") ?? "").trim());
      setSent(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="site-container grid min-h-[560px] place-items-center py-14">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-accent">Khôi phục tài khoản</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[-.04em] text-foreground">Quên mật khẩu?</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.</p>
        {sent ? (
          <p role="status" className="mt-8 flex gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-6 text-foreground">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư (kể cả mục spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-foreground">Email</span>
              <span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4">
                <Mail className="size-4 text-muted-foreground" />
                <input name="email" type="email" required autoComplete="email" placeholder="ban@email.com" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </span>
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}</Button>
          </form>
        )}
        <p className="mt-8 text-center text-sm text-muted-foreground"><Link href="/login" className="font-bold text-primary">Quay lại đăng nhập</Link></p>
      </div>
    </section>
  );
}
