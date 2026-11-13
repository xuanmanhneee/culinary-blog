"use client";

import { Heart, Printer, Share2, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEngagementSummary, rateRecipe, saveRecipe, unsaveRecipe } from "@/lib/api/engagement";
import type { EngagementSummary } from "@/lib/types/engagement";

export function RecipeActions({ recipeId, slug, title }: { recipeId: string; slug: string; title: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const token = session?.accessToken;
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [engagementAvailable, setEngagementAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void getEngagementSummary(recipeId, token, controller.signal)
      .then((value) => { setSummary(value); setEngagementAvailable(true); })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setEngagementAvailable(false); });
    return () => controller.abort();
  }, [recipeId, token]);

  function requireToken(): string | null {
    if (token) return token;
    if (status !== "loading") router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  async function toggleSaved() {
    const accessToken = requireToken();
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      if (summary?.isSaved) await unsaveRecipe(recipeId, accessToken);
      else await saveRecipe(recipeId, slug, accessToken);
      setSummary(await getEngagementSummary(recipeId, accessToken));
    } catch {
      setEngagementAvailable(false);
    } finally {
      setBusy(false);
    }
  }

  async function setRating(score: number) {
    const accessToken = requireToken();
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      await rateRecipe(recipeId, slug, score, accessToken);
      setSummary(await getEngagementSummary(recipeId, accessToken));
    } catch {
      setEngagementAvailable(false);
    } finally {
      setBusy(false);
    }
  }
  async function shareRecipe() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="absolute right-5 bottom-5 flex flex-wrap justify-end gap-2">
      {engagementAvailable && <><div className="flex items-center rounded-full bg-white/90 px-2 shadow" aria-label={`Đánh giá trung bình ${summary?.averageRating ?? 0} trên 5`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" disabled={busy} onClick={() => void setRating(score)} aria-label={`Đánh giá ${score} sao`} className="grid size-8 place-items-center text-amber-500 disabled:opacity-50">
            <Star className={`size-4 ${score <= (summary?.myRating ?? 0) ? "fill-current" : ""}`} />
          </button>
        ))}
        <span className="pr-2 text-xs font-bold text-[#655d55]">{summary?.ratingCount ? `${summary.averageRating} (${summary.ratingCount})` : "Chưa có"}</span>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggleSaved()}
        aria-label={summary?.isSaved ? "Bỏ lưu công thức" : "Lưu công thức"}
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#b65338] shadow disabled:opacity-50"
      >
        <Heart className={`size-4 ${summary?.isSaved ? "fill-current" : ""}`} />
      </button>
      </>}
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="In công thức"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow"
      >
        <Printer className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void shareRecipe()}
        aria-label="Chia sẻ công thức"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
