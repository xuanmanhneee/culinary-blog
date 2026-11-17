"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart, Loader2, Printer, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getRecipeFavoriteStatus, toggleFavoriteRecipe } from "@/lib/api/recipe-management";

interface RecipeActionsProps {
  recipeId: string;
  title: string;
}

export function RecipeActions({ recipeId, title }: RecipeActionsProps) {
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      getRecipeFavoriteStatus(recipeId, session.accessToken)
        .then((res) => setIsFavorite(res.isFavorite))
        .catch(() => {});
    }
  }, [recipeId, session?.accessToken, status]);

  async function handleToggleFavorite() {
    if (status !== "authenticated" || !session?.accessToken) {
      toast.info("Vui lòng đăng nhập để lưu công thức vào bộ sưu tập!");
      return;
    }

    const previousState = isFavorite;
    setIsFavorite(!previousState);

    startTransition(async () => {
      try {
        const res = await toggleFavoriteRecipe(recipeId, session.accessToken);
        setIsFavorite(res.isFavorite);
        if (res.isFavorite) {
          toast.success("Đã lưu công thức vào 'Món đã lưu'!");
        } else {
          toast.info("Đã bỏ lưu công thức.");
        }
      } catch {
        setIsFavorite(previousState);
        toast.error("Không thể cập nhật trạng thái lưu món. Vui lòng thử lại!");
      }
    });
  }

  async function shareRecipe() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch {
        // Người dùng hủy chia sẻ
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết vào bộ nhớ tạm!");
  }

  return (
    <div className="absolute right-5 bottom-5 flex gap-2">
      <button
        type="button"
        onClick={() => void handleToggleFavorite()}
        disabled={isPending}
        aria-label={isFavorite ? "Bỏ lưu công thức" : "Lưu công thức"}
        title={isFavorite ? "Bỏ lưu công thức" : "Lưu vào Món đã lưu"}
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow transition hover:bg-white active:scale-95 disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-[#b65338]" />
        ) : (
          <Heart
            className={`size-4 transition-colors ${
              isFavorite
                ? "fill-[#b65338] text-[#b65338]"
                : "text-[#3d3732] hover:text-[#b65338]"
            }`}
          />
        )}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="In công thức"
        title="In công thức"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow transition hover:bg-white active:scale-95"
      >
        <Printer className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void shareRecipe()}
        aria-label="Chia sẻ công thức"
        title="Chia sẻ liên kết"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow transition hover:bg-white active:scale-95"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
