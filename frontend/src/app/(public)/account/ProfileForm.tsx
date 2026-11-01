"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile } from "@/lib/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import type { UserProfileDto } from "@/lib/types/auth";

export function ProfileForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    const controller = new AbortController();

    void getMyProfile(session.accessToken, controller.signal)
      .then(setProfile)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [session?.accessToken]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;

    setError("");
    setFieldErrors({});
    setSaved(false);
    setIsSaving(true);
    const form = new FormData(event.currentTarget);

    try {
      const updated = await updateMyProfile(session.accessToken, {
        fullName: String(form.get("fullName") ?? "").trim(),
        avatarUrl: String(form.get("avatarUrl") ?? "").trim(),
        bio: String(form.get("bio") ?? "").trim(),
      });
      setProfile(updated);
      await update({
        user: {
          name: updated.fullName,
          image: updated.avatarUrl,
          roles: updated.roles,
          bio: updated.bio,
        },
      });
      router.refresh();
      setSaved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setFieldErrors(getFieldErrors(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <article id="profile" className="min-h-96 animate-pulse rounded-[1.75rem] border border-[#ddd1c3] bg-[#fffdf9] p-8" aria-label="Đang tải hồ sơ" />;
  }

  if (!profile) {
    return <article id="profile" className="rounded-[1.75rem] border border-[#e1c8c1] bg-[#fff8f6] p-8 text-sm text-[#9b3f2f]">{error || "Không thể tải hồ sơ."}</article>;
  }

  const initial = profile.fullName.trim().charAt(0).toLocaleUpperCase("vi") || "B";
  const hasAvatar = /^https?:\/\//i.test(profile.avatarUrl ?? "");

  return (
    <article id="profile" className="scroll-mt-28 rounded-[1.75rem] border border-[#ddd1c3] bg-[#fffdf9] p-6 shadow-[0_16px_45px_rgba(75,57,41,.06)] sm:p-8">
      <div className="flex items-center gap-4">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#1f4b3f] font-display text-2xl font-bold text-white">
          {hasAvatar ? <Image src={profile.avatarUrl!} alt="" fill sizes="64px" unoptimized className="object-cover" /> : initial}
        </span>
        <div className="min-w-0"><h2 className="truncate text-xl font-bold text-[#302a26]">{profile.fullName}</h2><p className="mt-1 truncate text-sm text-[#7b7169]">@{profile.userName}</p></div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="block"><span className="form-label">Tên hiển thị</span><input className="form-input" name="fullName" defaultValue={profile.fullName} minLength={2} maxLength={100} required />{fieldErrors.fullName && <span className="mt-1 block text-xs text-red-700">{fieldErrors.fullName}</span>}</label>
        <label className="block"><span className="form-label">Giới thiệu</span><textarea className="form-input min-h-24 resize-y py-3" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} placeholder="Chia sẻ một chút về bạn và căn bếp của mình." />{fieldErrors.bio && <span className="mt-1 block text-xs text-red-700">{fieldErrors.bio}</span>}</label>
        <label className="block"><span className="form-label">Ảnh đại diện</span><input className="form-input" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://..." />{fieldErrors.avatarUrl && <span className="mt-1 block text-xs text-red-700">{fieldErrors.avatarUrl}</span>}</label>
        <label className="block"><span className="form-label">Email</span><input className="form-input cursor-not-allowed bg-[#f2ece4] text-[#81766e]" value={profile.email} readOnly /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-[#1f6a54]"><CheckCircle2 className="size-4" />Đã cập nhật hồ sơ.</p>}
        <Button type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
      </form>
    </article>
  );
}
