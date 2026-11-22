"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!email || !token) {
    return (
      <p role="alert" className="mt-8 rounded-xl border border-border bg-accent-soft p-5 text-sm text-accent-hover">
        Liên kết không hợp lệ. <Link href="/forgot-password" className="font-bold underline">Yêu cầu liên kết mới</Link>.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword !== String(form.get("confirm") ?? "")) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await resetPassword({ email, token, newPassword });
      router.push("/login");
    } catch (requestError) {
      const fields = getFieldErrors(requestError);
      setError(fields.token ?? fields.password ?? getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {[["password", "Mật khẩu mới"], ["confirm", "Nhập lại mật khẩu"]].map(([name, label]) => (
        <label key={name} className="block">
          <span className="mb-2 block text-sm font-bold text-foreground">{label}</span>
          <span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4">
            <LockKeyhole className="size-4 text-muted-foreground" />
            <input name={name} type="password" required minLength={8} autoComplete="new-password" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </span>
        </label>
      ))}
      <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="site-container grid min-h-[560px] place-items-center py-14">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[.17em] text-accent">Khôi phục tài khoản</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[-.04em] text-foreground">Đặt mật khẩu mới</h1>
        <Suspense fallback={null}><ResetPasswordForm /></Suspense>
      </div>
    </section>
  );
}
