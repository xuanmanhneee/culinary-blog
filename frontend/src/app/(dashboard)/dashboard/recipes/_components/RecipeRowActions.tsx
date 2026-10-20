"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Eye, Loader2, MoreHorizontal, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecipeStatus, type RecipeListItemDto } from "@/lib/types/recipe";

export type RecipeAction = "publish" | "unpublish" | "archive" | "delete";

interface RecipeRowActionsProps {
  recipe: RecipeListItemDto;
  /** Gọi API; resolve khi xong (kể cả lỗi đã được thông báo) để hộp xác nhận đóng lại. */
  onAction: (recipe: RecipeListItemDto, action: RecipeAction) => Promise<void>;
}

/** Menu thao tác của một công thức: sửa, xem, xuất bản/hủy (FR-RCP-005), lưu trữ (006), xóa (007). */
export function RecipeRowActions({ recipe, onAction }: RecipeRowActionsProps) {
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [pending, setPending] = useState<RecipeAction | null>(null);
  const isPublished = recipe.status === RecipeStatus.Published;

  async function run(action: RecipeAction) {
    setPending(action);
    try {
      await onAction(recipe, action);
    } finally {
      setPending(null);
      setConfirm(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending !== null}
            aria-label={`Thao tác với "${recipe.title}"`}
          >
            {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
              <Pencil />
              Sửa
            </Link>
          </DropdownMenuItem>
          {isPublished && (
            <DropdownMenuItem asChild>
              <Link href={`/recipes/${recipe.slug}`} target="_blank">
                <Eye />
                Xem trang công khai
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
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
        onOpenChange={(open) => !open && pending === null && setConfirm(null)}
        title="Lưu trữ công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> sẽ bị ẩn khỏi trang công khai nhưng vẫn được giữ lại. Bạn có thể
            xuất bản lại bất cứ lúc nào.
          </>
        }
        confirmLabel="Lưu trữ"
        isPending={pending === "archive"}
        onConfirm={() => void run("archive")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && pending === null && setConfirm(null)}
        title="Xóa vĩnh viễn công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> cùng toàn bộ nguyên liệu, các bước và ảnh sẽ bị xóa.
            Thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        destructive
        isPending={pending === "delete"}
        onConfirm={() => void run("delete")}
      />
    </>
  );
}
