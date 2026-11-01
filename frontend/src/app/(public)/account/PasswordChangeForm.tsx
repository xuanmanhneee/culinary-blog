"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { changeMyPassword } from "@/lib/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";

export function PasswordChangeForm() {
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;

    setError("");
    setFieldErrors({});
    setIsSaving(true);
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Mật khẩu xác nhận không khớp." });
      setIsSaving(false);
      return;
    }

    try {
      await changeMyPassword(session.accessToken, { currentPassword, newPassword });
      await signOut({ callbackUrl: "/login" });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setFieldErrors(getFieldErrors(requestError));
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-[1.75rem] border border-[#ddd1c3] bg-[#fffdf9] p-6 shadow-[0_16px_45px_rgba(75,57,41,.06)] sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-[#f3e5d8] text-[#a64e37]"><KeyRound className="size-5" /></span>
        <div>
          <h2 className="font-display text-2xl font-bold text-[#302a26]">Đổi mật khẩu</h2>
          <p className="text-xs text-[#80756d]">Sau khi đổi, bạn sẽ cần đăng nhập lại.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="block">
          <span className="form-label">Mật khẩu hiện tại</span>
          <input className="form-input" name="currentPassword" type="password" autoComplete="current-password" required />
          {fieldErrors.currentPassword && <span className="mt-1 block text-xs text-red-700">{fieldErrors.currentPassword}</span>}
        </label>
        <label className="block">
          <span className="form-label">Mật khẩu mới</span>
          <input className="form-input" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
          <span className="mt-1 block text-xs text-[#80756d]">Ít nhất 8 ký tự, gồm chữ hoa, chữ số và ký tự đặc biệt.</span>
          {fieldErrors.newPassword && <span className="mt-1 block text-xs text-red-700">{fieldErrors.newPassword}</span>}
        </label>
        <label className="block">
          <span className="form-label">Xác nhận mật khẩu mới</span>
          <input className="form-input" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
          {fieldErrors.confirmPassword && <span className="mt-1 block text-xs text-red-700">{fieldErrors.confirmPassword}</span>}
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
          {isSaving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </Button>
      </form>
    </article>
  );
}
