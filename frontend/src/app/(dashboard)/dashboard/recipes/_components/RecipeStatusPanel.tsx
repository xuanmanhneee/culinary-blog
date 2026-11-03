"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ExternalLink, Loader2, Send, Trash2, Undo2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RecipeStatusBadge } from "@/components/recipes/RecipeStatusBadge";
import { Button } from "@/components/ui/button";
import { refreshPublicRecipes } from "@/lib/actions/recipe-cache";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import type { RecipeStatusAction } from "@/lib/api/recipe-management";
import { useChangeRecipeStatus, useDeleteRecipe } from "@/lib/hooks/useRecipeManagement";
import { RecipeStatus, type RecipeDetailDto } from "@/lib/types/recipe";

const statusHints: Record<RecipeStatus, string> = {
  [RecipeStatus.Draft]: "Chỉ bạn và quản trị viên nhìn thấy. Xuất bản để mọi người cùng xem.",
  [RecipeStatus.Published]: "Đang hiển thị trên trang công khai.",
  [RecipeStatus.Archived]: "Đã ẩn khỏi trang công khai nhưng dữ liệu vẫn được giữ lại.",
};

const doneMessages: Record<RecipeStatusAction, string> = {
  publish: "Đã xuất bản công thức.",
  unpublish: "Đã chuyển công thức về bản nháp.",
  archive: "Đã lưu trữ công thức.",
};

interface RecipeStatusPanelProps {
  recipe: RecipeDetailDto;
  /** Gọi sau khi đổi trạng thái, kèm bản mới (RowVersion mới) để form cập nhật If-Match. */
  onStatusChanged: (recipe: RecipeDetailDto) => void;
}

/**
 * Trạng thái công thức trên trang sửa (FR-RCP-005/006/007):
 * Bản nháp → Xuất bản → Lưu trữ; Đã lưu trữ → xuất bản lại hoặc về bản nháp; xóa ở mọi trạng thái.
 * Thao tác dùng dữ liệu đã lưu trên server, không gồm thay đổi chưa lưu trong form.
 */
export function RecipeStatusPanel({ recipe, onStatusChanged }: RecipeStatusPanelProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const changeStatus = useChangeRecipeStatus();
  const deleteRecipe = useDeleteRecipe();
  const isBusy = changeStatus.isPending || deleteRecipe.isPending;
  const { status } = recipe;

  async function change(action: RecipeStatusAction) {
    setConfirm(null);
    setMessage(null);
    try {
      const updated = await changeStatus.mutateAsync({ id: recipe.id, action });
      onStatusChanged(updated);
      await refreshPublicRecipes();
      setMessage({ tone: "info", text: doneMessages[action] });
    } catch (error) {
      setMessage({ tone: "error", text: getRecipeErrorMessage(error) });
    }
  }

  async function remove() {
    setConfirm(null);
    setMessage(null);
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      await refreshPublicRecipes();
      router.push(`/dashboard/recipes?notice=deleted&title=${encodeURIComponent(recipe.title)}`);
    } catch (error) {
      setMessage({ tone: "error", text: getRecipeErrorMessage(error) });
    }
  }

  return (
    <section aria-label="Trạng thái công thức" className="rounded-xl border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            Trạng thái: <RecipeStatusBadge status={status} />
            {isBusy && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang xử lý" />}
          </div>
          <p className="text-sm text-muted-foreground">{statusHints[status]}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/recipes/${recipe.slug}`} target="_blank">
              <ExternalLink />
              {status === RecipeStatus.Published ? "Xem trang công khai" : "Xem trước"}
            </Link>
          </Button>
          {status !== RecipeStatus.Published && (
            <Button size="sm" disabled={isBusy} onClick={() => void change("publish")}>
              <Send />
              {status === RecipeStatus.Archived ? "Xuất bản lại" : "Xuất bản"}
            </Button>
          )}
          {status !== RecipeStatus.Draft && (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => void change("unpublish")}>
              <Undo2 />
              {status === RecipeStatus.Archived ? "Khôi phục về bản nháp" : "Hủy xuất bản"}
            </Button>
          )}
          {status !== RecipeStatus.Archived && (
            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => setConfirm("archive")}>
              <Archive />
              Lưu trữ
            </Button>
          )}
          <Button size="sm" variant="destructive" disabled={isBusy} onClick={() => setConfirm("delete")}>
            <Trash2 />
            Xóa
          </Button>
        </div>
      </div>

      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "error"
              ? "mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          }
        >
          {message.text}
          {message.tone === "info" && " Thay đổi chưa lưu trong form vẫn được giữ, nhớ bấm lưu ở bước cuối."}
        </p>
      )}

      <ConfirmDialog
        open={confirm === "archive"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Lưu trữ công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> sẽ bị ẩn khỏi trang công khai nhưng vẫn được giữ lại. Bạn có thể xuất bản
            lại bất cứ lúc nào.
          </>
        }
        confirmLabel="Lưu trữ"
        onConfirm={() => void change("archive")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Xóa công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> cùng nguyên liệu, các bước và ảnh sẽ bị xóa. Thao tác này không thể hoàn
            tác.
          </>
        }
        confirmLabel="Xóa"
        destructive
        onConfirm={() => void remove()}
      />
    </section>
  );
}
