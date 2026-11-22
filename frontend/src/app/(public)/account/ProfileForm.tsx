"use client";

import { BadgeCheck, Camera, CheckCircle2, LoaderCircle, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyProfile, updateMyProfile, uploadMyAvatar } from "@/lib/api/auth";
import { getErrorMessage, getFieldErrors } from "@/lib/errors";
import { RECIPE_IMAGE_ACCEPT, validateRecipeImageFile } from "@/lib/recipe-image";
import { Roles, type UserProfileDto } from "@/lib/types/auth";

const BIO_MAX = 500;
const roleLabels: Record<string, string> = { [Roles.Admin]: "Quản trị viên", [Roles.Author]: "Tác giả" };

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-1.5 block text-xs text-destructive">{message}</span> : null;
}

export function ProfileForm() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    const controller = new AbortController();

    void getMyProfile(session.accessToken, controller.signal)
      .then((result) => {
        setProfile(result);
        setBio(result.bio ?? "");
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [session?.accessToken]);

  /** Đồng bộ session Auth.js để Header hiển thị ngay tên/ảnh mới. */
  async function syncSession(updated: UserProfileDto) {
    await update({ user: { name: updated.fullName, image: updated.avatarUrl, roles: updated.roles, bio: updated.bio } });
    router.refresh();
  }

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
        bio: bio.trim(),
      });
      setProfile(updated);
      await syncSession(updated);
      setSaved(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setFieldErrors(getFieldErrors(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !session?.accessToken) return;

    const invalid = validateRecipeImageFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setAvatarBusy(true);
    try {
      const updated = await uploadMyAvatar(session.accessToken, file);
      setProfile((current) => (current ? { ...current, avatarUrl: updated.avatarUrl } : updated));
      await syncSession(updated);
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (requestError) {
      toast.error(getFieldErrors(requestError).file ?? getErrorMessage(requestError));
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarRemove() {
    if (!session?.accessToken) return;
    setAvatarBusy(true);
    try {
      const updated = await updateMyProfile(session.accessToken, { avatarUrl: "" });
      setProfile((current) => (current ? { ...current, avatarUrl: null } : updated));
      await syncSession(updated);
      toast.success("Đã xóa ảnh đại diện.");
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setAvatarBusy(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-96 animate-pulse rounded-2xl border border-border bg-card" aria-label="Đang tải hồ sơ" />;
  }

  if (!profile) {
    return <div className="rounded-2xl border border-border bg-accent-soft p-8 text-sm text-accent-hover">{error || "Không thể tải hồ sơ."}</div>;
  }

  const initial = profile.fullName.trim().charAt(0).toLocaleUpperCase("vi") || "B";
  const hasAvatar = /^https?:\/\//i.test(profile.avatarUrl ?? "");
  const joined = new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex flex-col items-center gap-5 rounded-xl bg-muted/60 p-5 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          <span className="relative grid size-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-primary text-3xl font-bold text-white shadow-sm">
            {hasAvatar ? <Image src={profile.avatarUrl!} alt={`Ảnh đại diện của ${profile.fullName}`} fill sizes="96px" unoptimized className="object-cover" /> : initial}
            {avatarBusy && <span className="absolute inset-0 grid place-items-center bg-black/45"><LoaderCircle className="size-6 animate-spin" /></span>}
          </span>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={avatarBusy}
            aria-label="Đổi ảnh đại diện"
            className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-card bg-accent text-white shadow transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Camera className="size-4" />
          </button>
          <input ref={fileInput} type="file" accept={RECIPE_IMAGE_ACCEPT} className="sr-only" tabIndex={-1} onChange={handleAvatarChange} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-foreground">{profile.fullName}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">@{profile.userName}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {profile.roles.map((role) => <Badge key={role} variant="warm">{roleLabels[role] ?? role}</Badge>)}
            <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Tham gia {joined}</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={avatarBusy}><Camera />Chọn ảnh</Button>
          {hasAvatar && <Button type="button" variant="ghost" size="sm" onClick={handleAvatarRemove} disabled={avatarBusy}><Trash2 />Xóa ảnh</Button>}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, WebP hoặc AVIF, tối đa 5 MB.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Tên hiển thị</span>
            <input className="form-input" name="fullName" defaultValue={profile.fullName} minLength={2} maxLength={100} required aria-invalid={!!fieldErrors.fullName} />
            <FieldError message={fieldErrors.fullName} />
          </label>
          <label className="block">
            <span className="form-label">Tên đăng nhập</span>
            <input className="form-input cursor-not-allowed bg-muted text-muted-foreground" value={`@${profile.userName}`} readOnly />
          </label>
        </div>

        <label className="block">
          <span className="form-label">Email</span>
          <span className="relative block">
            <input className="form-input cursor-not-allowed bg-muted pr-36 text-muted-foreground" value={profile.email} readOnly />
            <span className={`absolute inset-y-0 right-3 flex items-center gap-1 text-xs font-semibold ${profile.emailConfirmed ? "text-primary" : "text-accent"}`}>
              {profile.emailConfirmed ? <><BadgeCheck className="size-4" />Đã xác nhận</> : "Chưa xác nhận"}
            </span>
          </span>
        </label>

        <label className="block">
          <span className="form-label">Giới thiệu</span>
          <textarea
            className="form-input min-h-28 resize-y py-3"
            name="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={BIO_MAX}
            placeholder="Chia sẻ một chút về bạn và căn bếp của mình."
            aria-invalid={!!fieldErrors.bio}
          />
          <span className="mt-1.5 flex justify-between text-xs text-muted-foreground">
            <span className="text-destructive">{fieldErrors.bio}</span>
            <span>{bio.length}/{BIO_MAX}</span>
          </span>
        </label>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-end gap-4 border-t border-border pt-5">
          {saved && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="size-4" />Đã cập nhật hồ sơ</p>}
          <Button type="submit" disabled={isSaving}>{isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</Button>
        </div>
      </form>
    </div>
  );
}
