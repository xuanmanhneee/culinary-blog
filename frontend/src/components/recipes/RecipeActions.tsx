"use client";

import { Heart, Printer, Share2, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getEngagementSummary, rateRecipe, saveRecipe, unsaveRecipe } from "@/lib/api/engagement";
import type { EngagementSummary } from "@/lib/types/engagement";
import { Roles } from "@/lib/types/auth";

export function RecipeActions({ recipeId, slug, title }: { recipeId: string; slug: string; title: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = session?.accessToken;
  const isAdmin = session?.user.roles?.includes(Roles.Admin) ?? false;
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    const controller = new AbortController();
    void getEngagementSummary(recipeId, token, controller.signal)
      .then(setSummary)
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setSummary(null); });
    return () => controller.abort();
  }, [isAdmin, recipeId, token]);

  function requireToken(): string | null {
    if (token) return token;
    if (status !== "loading") router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  async function refreshSummary(accessToken: string) {
    try {
      setSummary(await getEngagementSummary(recipeId, accessToken));
    } catch {
      // Giữ trạng thái hiện tại: lưu/chấm điểm đã thành công, chỉ chưa làm mới được số liệu.
    }
  }

  async function toggleSaved() {
    const accessToken = requireToken();
    if (!accessToken || busy) return;
    const previous = summary;
    const wasSaved = previous?.isSaved ?? false;
    setBusy(true);
    if (previous) setSummary({ ...previous, isSaved: !wasSaved });
    try {
      if (wasSaved) await unsaveRecipe(recipeId, accessToken);
      else await saveRecipe(recipeId, slug, accessToken);
    } catch {
      setSummary(previous);
      toast.error("Không thể cập nhật món đã lưu. Vui lòng thử lại.");
      setBusy(false);
      return;
    }
    toast.success(wasSaved ? "Đã bỏ lưu công thức." : "Đã lưu vào Món đã lưu.");
    await refreshSummary(accessToken);
    setBusy(false);
  }

  async function setRating(score: number) {
    const accessToken = requireToken();
    if (!accessToken || busy) return;
    const previous = summary;
    setBusy(true);
    if (previous) setSummary({ ...previous, myRating: score });
    try {
      await rateRecipe(recipeId, slug, score, accessToken);
    } catch {
      setSummary(previous);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
      setBusy(false);
      return;
    }
    toast.success("Cảm ơn bạn đã đánh giá!");
    await refreshSummary(accessToken);
    setBusy(false);
  }

  async function shareRecipe() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Người dùng đóng hộp chia sẻ thì không cần làm gì thêm.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết.");
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  }

  if (isAdmin) return null;

  return (
    <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-2">
      {summary && <><div className="flex items-center rounded-full bg-card px-2 shadow" aria-label={`Đánh giá trung bình ${summary.averageRating} trên 5`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" disabled={busy} onClick={() => void setRating(score)} aria-label={`Đánh giá ${score} sao`} className="grid size-8 place-items-center text-accent disabled:opacity-50">
            <Star className={`size-4 ${score <= (summary?.myRating ?? 0) ? "fill-current" : ""}`} />
          </button>
        ))}
        <span className="pr-2 text-xs font-bold text-foreground">{summary.ratingCount ? `${summary.averageRating}/5 · ${summary.ratingCount} lượt đánh giá` : "Chưa có đánh giá"}</span>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggleSaved()}
        aria-label={summary?.isSaved ? "Bỏ lưu công thức" : "Lưu công thức"}
        className="grid size-11 place-items-center rounded-full bg-card text-accent shadow disabled:opacity-50"
      >
        <Heart className={`size-4 ${summary?.isSaved ? "fill-current" : ""}`} />
      </button>
      </>}
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="In công thức"
        className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow"
      >
        <Printer className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void shareRecipe()}
        aria-label="Chia sẻ công thức"
        className="grid size-11 place-items-center rounded-full bg-card text-foreground shadow"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
