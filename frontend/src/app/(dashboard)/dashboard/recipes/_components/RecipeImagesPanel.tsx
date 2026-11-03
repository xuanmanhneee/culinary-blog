"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { refreshPublicRecipes } from "@/lib/actions/recipe-cache";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { deleteImage, setPrimaryImage, uploadRecipeImage } from "@/lib/api/recipe-management";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import { recipeKeys } from "@/lib/hooks/useRecipeManagement";
import type { RecipeImageDto } from "@/lib/types/recipe";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Kiểm tra phía client giống backend (FR-RCP-008) để báo lỗi ngay, không cần gửi file lên. */
function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return `"${file.name}": chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc AVIF.`;
  if (file.size > MAX_FILE_SIZE) return `"${file.name}": ảnh không được vượt quá 5 MB.`;
  return null;
}

interface RecipeImagesPanelProps {
  recipeId: string;
  title: string;
  images: RecipeImageDto[];
}

/**
 * Ảnh của công thức trên trang sửa (FR-RCP-008): tải thêm ảnh (nhiều ảnh một lần), đặt ảnh chính, xóa ảnh.
 * Thao tác ảnh lưu ngay, không chờ bấm "Lưu thay đổi" và không đổi RowVersion của công thức.
 */
export function RecipeImagesPanel({ recipeId, title, images }: RecipeImagesPanelProps) {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<RecipeImageDto | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.orderIndex - b.orderIndex);

  /** Chạy thao tác rồi tải lại chi tiết (danh sách ảnh mới) và làm mới trang công khai. */
  async function run(key: string, action: () => Promise<string>) {
    setBusy(key);
    setMessage(null);
    try {
      const text = await action();
      setMessage({ tone: "info", text });
    } catch (error) {
      setMessage({ tone: "error", text: getRecipeErrorMessage(error) });
    } finally {
      await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
      await refreshPublicRecipes();
      setBusy(null);
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const invalid = files.map(validateFile).filter((error): error is string => error !== null);
    if (invalid.length > 0) {
      setMessage({ tone: "error", text: invalid.join(" ") });
      return;
    }

    void run("upload", async () => {
      // Tải lần lượt để giữ thứ tự ảnh như người dùng chọn.
      for (const file of files) await uploadRecipeImage(recipeId, file, token);
      return files.length === 1 ? "Đã tải ảnh lên." : `Đã tải ${files.length} ảnh lên.`;
    });
  }

  return (
    <section aria-label="Ảnh công thức" className="rounded-xl border bg-background p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Ảnh công thức</h2>
          <p className="text-sm text-muted-foreground">
            Ảnh chính hiển thị đầu tiên trên trang công khai. JPEG, PNG, WebP hoặc AVIF, tối đa 5 MB mỗi ảnh.
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => inputRef.current?.click()}>
          {busy === "upload" ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Thêm ảnh
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          aria-label="Chọn ảnh để tải lên"
          onChange={handleFiles}
        />
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Công thức chưa có ảnh nào.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((image, index) => (
            <li key={image.id} className="overflow-hidden rounded-lg border">
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={image.url}
                  alt={image.altText ?? `${title} – ảnh ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover"
                />
                {image.isPrimary && (
                  <span className="absolute top-2 left-2 rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-medium text-white">
                    Ảnh chính
                  </span>
                )}
              </div>
              <div className="flex gap-1 p-2">
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 px-2"
                    disabled={busy !== null}
                    onClick={() =>
                      void run(`primary-${image.id}`, async () => {
                        await setPrimaryImage(recipeId, image.id, token);
                        return "Đã đổi ảnh chính.";
                      })
                    }
                  >
                    {busy === `primary-${image.id}` ? <Loader2 className="animate-spin" /> : <Star />}
                    Đặt làm ảnh chính
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto px-2 text-red-700"
                  disabled={busy !== null}
                  aria-label={`Xóa ảnh ${index + 1}`}
                  onClick={() => setToDelete(image)}
                >
                  {busy === `delete-${image.id}` ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
        </p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Xóa ảnh?"
        description={
          toDelete?.isPrimary
            ? "Đây là ảnh chính. Sau khi xóa, ảnh tiếp theo sẽ trở thành ảnh chính."
            : "Ảnh sẽ bị xóa khỏi công thức."
        }
        confirmLabel="Xóa ảnh"
        destructive
        onConfirm={() => {
          const image = toDelete;
          setToDelete(null);
          if (image)
            void run(`delete-${image.id}`, async () => {
              await deleteImage(recipeId, image.id, token);
              return "Đã xóa ảnh.";
            });
        }}
      />
    </section>
  );
}
