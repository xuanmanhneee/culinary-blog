"use client";

import Link from "next/link";
import { useState } from "react";
import { Archive, Eye, MoreHorizontal, Pencil, Send, Trash2, Undo2 } from "lucide-react";
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
  onAction: (recipe: RecipeListItemDto, action: RecipeAction) => void;
}

/** Menu thao tác của một công thức: sửa, xem, xuất bản/hủy (FR-RCP-005), lưu trữ (006), xóa (007). */
export function RecipeRowActions({ recipe, onAction }: RecipeRowActionsProps) {
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const isPublished = recipe.status === RecipeStatus.Published;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Thao tác với "${recipe.title}"`}>
            <MoreHorizontal />
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
            <DropdownMenuItem onSelect={() => onAction(recipe, "unpublish")}>
              <Undo2 />
              Hủy xuất bản
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onAction(recipe, "publish")}>
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
            <strong>{recipe.title}</strong> sẽ bị ẩn khỏi trang công khai nhưng vẫn được giữ lại. Bạn có thể
            xuất bản lại bất cứ lúc nào.
          </>
        }
        confirmLabel="Lưu trữ"
        onConfirm={() => {
          onAction(recipe, "archive");
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Xóa vĩnh viễn công thức?"
        description={
          <>
            <strong>{recipe.title}</strong> cùng toàn bộ nguyên liệu, các bước và ảnh sẽ bị xóa.
            Thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        destructive
        onConfirm={() => {
          onAction(recipe, "delete");
          setConfirm(null);
        }}
      />
    </>
  );
}
