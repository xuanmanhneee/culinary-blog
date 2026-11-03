"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Save, Star, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refreshPublicRecipes } from "@/lib/actions/recipe-cache";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { deleteImage, setPrimaryImage, updateImageMetadata, uploadRecipeImage } from "@/lib/api/recipe-management";
import { useAccessToken } from "@/lib/hooks/useAccessToken";
import { recipeKeys } from "@/lib/hooks/useRecipeManagement";
import { validateRecipeImageFile } from "@/lib/recipe-image";
import type { RecipeImageDto } from "@/lib/types/recipe";
import type { SelectedRecipeImage } from "./recipe-form/RecipeImageFilePicker";

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
  const [pendingFiles, setPendingFiles] = useState<SelectedRecipeImage[]>([]);
  const objectUrls = useRef(new Set<string>());
  const [toDelete, setToDelete] = useState<RecipeImageDto | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.orderIndex - b.orderIndex);

  useEffect(() => () => {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
  }, []);

  /** Chạy thao tác rồi tải lại chi tiết (danh sách ảnh mới) và làm mới trang công khai. */
  async function run(key: string, action: () => Promise<string>) {
    setBusy(key);
    setMessage(null);
    let actionSucceeded = false;
    try {
      const text = await action();
      actionSucceeded = true;
      setMessage({ tone: "info", text });
    } catch (error) {
      setMessage({ tone: "error", text: getRecipeErrorMessage(error) });
    } finally {
      try {
        await queryClient.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
        await refreshPublicRecipes();
      } catch (error) {
        setMessage((current) => ({
          tone: "error",
          text: actionSucceeded
            ? `Thao tác ảnh đã hoàn tất nhưng không làm mới được dữ liệu: ${getRecipeErrorMessage(error)}`
            : `${current?.text ?? "Thao tác ảnh thất bại."} Không làm mới được dữ liệu: ${getRecipeErrorMessage(error)}`,
        }));
      } finally {
        setBusy(null);
      }
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const invalid = files.map(validateRecipeImageFile).filter((error): error is string => error !== null);
    if (invalid.length > 0) {
      setMessage({ tone: "error", text: invalid.join(" ") });
      return;
    }

    const selected = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      objectUrls.current.add(previewUrl);
      return { file, previewUrl };
    });
    setPendingFiles((current) => [...current, ...selected]);
    setMessage(null);
  }

  function removePendingFile(selection: SelectedRecipeImage) {
    URL.revokeObjectURL(selection.previewUrl);
    objectUrls.current.delete(selection.previewUrl);
    setPendingFiles((current) => current.filter((item) => item !== selection));
  }

  function uploadPendingFiles() {
    if (pendingFiles.length === 0) return;

    void run("upload", async () => {
      const selected = [...pendingFiles];
      let uploadedCount = 0;
      for (const selection of selected) {
        await uploadRecipeImage(recipeId, selection.file, token);
        uploadedCount += 1;
        removePendingFile(selection);
      }
      return uploadedCount === 1 ? "Đã tải ảnh lên." : `Đã tải ${uploadedCount} ảnh lên.`;
    });
  }

  function handleMetadata(event: FormEvent<HTMLFormElement>, image: RecipeImageDto) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const altText = String(form.get("altText") ?? "").trim();
    const orderIndex = Number(form.get("orderIndex"));

    void run(`metadata-${image.id}`, async () => {
      await updateImageMetadata(recipeId, image.id, {
        altText: altText || null,
        orderIndex: Number.isInteger(orderIndex) && orderIndex >= 0 ? orderIndex : image.orderIndex,
      }, token);
      return "Đã cập nhật mô tả và thứ tự ảnh.";
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
        <Button size="sm" variant="outline" disabled={busy !== null || !token} onClick={() => inputRef.current?.click()}>
          {busy === "upload" ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Thêm ảnh
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          aria-label="Chọn ảnh để tải lên"
          onChange={handleFiles}
        />
      </div>

      {pendingFiles.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Xem trước {pendingFiles.length} ảnh đang chờ tải lên</p>
            <Button type="button" size="sm" disabled={busy !== null || !token} onClick={uploadPendingFiles}>
              {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />}
              Tải ảnh lên
            </Button>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pendingFiles.map((selection) => (
              <li key={selection.previewUrl} className="overflow-hidden rounded-lg border bg-background">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image src={selection.previewUrl} alt={`Xem trước ${selection.file.name}`} fill unoptimized className="object-cover" />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="min-w-0 truncate text-xs" title={selection.file.name}>{selection.file.name}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    disabled={busy !== null}
                    aria-label={`Bỏ ${selection.file.name} khỏi danh sách tải lên`}
                    onClick={() => removePendingFile(selection)}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              <form className="space-y-2 border-t p-2" onSubmit={(event) => handleMetadata(event, image)}>
                <Label htmlFor={`alt-${image.id}`} className="text-xs">Mô tả ảnh</Label>
                <Input
                  id={`alt-${image.id}`}
                  name="altText"
                  defaultValue={image.altText ?? ""}
                  maxLength={300}
                  placeholder="Ví dụ: Tô phở bò hoàn chỉnh"
                  disabled={busy !== null}
                />
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`order-${image.id}`} className="mb-1 text-xs">Thứ tự</Label>
                    <Input
                      id={`order-${image.id}`}
                      name="orderIndex"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={image.orderIndex}
                      disabled={busy !== null}
                    />
                  </div>
                  <Button type="submit" size="sm" variant="outline" disabled={busy !== null} aria-label={`Lưu thông tin ảnh ${index + 1}`}>
                    {busy === `metadata-${image.id}` ? <Loader2 className="animate-spin" /> : <Save />}
                    Lưu
                  </Button>
                </div>
              </form>
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
