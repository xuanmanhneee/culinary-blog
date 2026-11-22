"use client";

import { signOut, useSession } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/lib/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";

export function ChangePasswordForm() {
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    setError("");
    setFieldErrors({});
    if (newPassword !== String(form.get("confirm") ?? "")) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(session.accessToken, { currentPassword: String(form.get("currentPassword") ?? ""), newPassword });
      // Backend thu hồi mọi refresh token nên phải đăng nhập lại.
      await signOut({ redirectTo: "/login" });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setFieldErrors(getFieldErrors(requestError));
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="form-label">Mật khẩu hiện tại</span>
          <input className="form-input" name="currentPassword" type="password" required autoComplete="current-password" />
          {fieldErrors.currentPassword && <span className="mt-1.5 block text-xs text-destructive">{fieldErrors.currentPassword}</span>}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Mật khẩu mới</span>
            <input className="form-input" name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
            {fieldErrors.password && <span className="mt-1.5 block text-xs text-destructive">{fieldErrors.password}</span>}
          </label>
          <label className="block">
            <span className="form-label">Nhập lại mật khẩu mới</span>
            <input className="form-input" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit" disabled={isSaving}>{isSaving ? "Đang lưu..." : "Đổi mật khẩu"}</Button>
        </div>
      </form>
  );
}
