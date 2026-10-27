"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Loader2, MoreHorizontal, Send, Trash2, Undo2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { useChangeRecipeStatus, useDeleteRecipe } from "@/lib/hooks/useRecipeManagement";
import { RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";

type RecipeAction = "publish" | "unpublish" | "archive" | "delete";

/** Thông báo trên trang danh sách sau thao tác (?notice=...). */
const noticeOf: Record<RecipeAction, string> = {
  publish: "published",
  unpublish: "unpublished",
  archive: "archived",
  delete: "deleted",
};

/**
 * Menu "Thao tác khác" của một công thức: xuất bản / hủy xuất bản (FR-RCP-005), lưu trữ (006),
 * xóa (007). Danh sách được render ở server nên xong thao tác thì làm mới trang.
 */
export function RecipeRowActions({ recipe }: { recipe: RecipeListItemDto }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const changeStatus = useChangeRecipeStatus();
  const deleteRecipe = useDeleteRecipe();
  const isBusy = changeStatus.isPending || deleteRecipe.isPending || isRefreshing;
  const isPublished = recipe.status === RecipeStatus.Published;

  async function run(action: RecipeAction) {
    setConfirm(null);
    try {
      if (action === "delete") await deleteRecipe.mutateAsync(recipe.id);
      else await changeStatus.mutateAsync({ id: recipe.id, action });

      const params = new URLSearchParams(window.location.search);
      params.set("notice", noticeOf[action]);
      params.set("title", recipe.title);
      startRefresh(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
        router.refresh();
      });
    } catch (error) {
      window.alert(getRecipeErrorMessage(error));
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isBusy} aria-label={`Thao tác khác với "${recipe.title}"`}>
            {isBusy ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isPublished ? (
            <DropdownMenuItem onSelect={() => void run("unpublish")}>
              <Undo2 />
              Hủy xuất bản
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => void run("publish")}>
              <Send />
              {recipe.status === RecipeStatus.Archived ? "Xuất bản lại" : "Xuất bản"}
            </DropdownMenuItem>
          )}
          {recipe.status !== RecipeStatus.Archived && (
            <DropdownMenuItem onSelect={() => setConfirm("archive")}>
              <Archive />
              Lưu trữ
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
            <Trash2 />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
        onConfirm={() => void run("archive")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Xóa vĩnh viễn công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> cùng toàn bộ nguyên liệu, các bước và ảnh sẽ bị xóa. Thao tác này không
            thể hoàn tác.
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        destructive
        onConfirm={() => void run("delete")}
      />
    </>
  );
}
