"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { getRecipeErrorMessage } from "@/lib/api/problem";
import { uploadRecipeImage } from "@/lib/api/recipe-management";
import { validateRecipeImageFile } from "@/lib/recipe-image";
import type { RecipeImageDto } from "@/lib/types/recipe";

interface RecipeImageManagerProps {
  recipeId: string;
  images: RecipeImageDto[];
  authorId?: string | null;
  uploadOnly?: boolean;
}

export default function RecipeImageManager({
  recipeId,
  images: initialImages,
  authorId,
  uploadOnly = false,
}: RecipeImageManagerProps) {
  const { data: session } = useSession();
  const [images, setImages] = useState<RecipeImageDto[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const accessToken = session?.accessToken;
  const isAdmin = session?.user.roles.includes("Admin") ?? false;
  const hasAuthorRole = session?.user.roles.includes("Author") ?? false;
  const isOwner = Boolean(authorId && session?.user.id === authorId);
  const canUpload = Boolean(accessToken) && (isAdmin || (hasAuthorRole && isOwner));

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  if (uploadOnly && !canUpload) {
    return null;
  }

  async function uploadImage(file: File) {
    if (isUploading || !accessToken || !canUpload) {
      return;
    }

    setMessage("");
    setError("");

    const validationError = validateRecipeImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);
    try {
      const uploadedImage = await uploadRecipeImage(recipeId, file, accessToken);
      setImages((currentImages) => [
        ...currentImages,
        uploadedImage,
      ]);
      setMessage("Tải ảnh lên thành công!");
    } catch (uploadError) {
      setError(getRecipeErrorMessage(uploadError));
    } finally {
      URL.revokeObjectURL(localPreview);
      previewUrlRef.current = null;
      setPreviewUrl(null);
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void uploadImage(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void uploadImage(file);
    }
  }

  return (
    <section
      aria-label={uploadOnly ? "Tải ảnh công thức lên" : undefined}
      aria-labelledby={uploadOnly ? undefined : "recipe-images-heading"}
      className="mt-8"
    >
      {!uploadOnly && (
        <h2 id="recipe-images-heading" className="text-xl font-semibold">
          Ảnh công thức
        </h2>
      )}

      {!uploadOnly && images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => {
            const imageUrl = image.url;
            if (!imageUrl) {
              return null;
            }

            return (
              <li
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100"
              >
                <Image
                  src={imageUrl}
                  alt={image.altText ?? `Ảnh công thức ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-3 py-1 text-sm font-medium text-white">
                    Ảnh đại diện
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : !uploadOnly ? (
        <p className="mt-3 text-sm text-zinc-600">Công thức chưa có ảnh.</p>
      ) : null}

      {canUpload && <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
        className={`mt-5 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-emerald-600 bg-emerald-50" : "border-zinc-300"
        }`}
      >
        {previewUrl && (
          <div className="relative mx-auto mb-4 aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg bg-zinc-100">
            <Image src={previewUrl} alt="Xem trước ảnh đang tải lên" fill unoptimized className="object-cover" />
          </div>
        )}
        <p className="text-sm text-zinc-700">
          Kéo thả ảnh vào đây hoặc chọn tệp (JPEG, PNG, WebP, AVIF; tối đa 5 MB).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileChange}
          disabled={isUploading}
          className="sr-only"
          id="recipe-image-upload"
        />
        <label
          htmlFor="recipe-image-upload"
          className={`mt-3 inline-flex cursor-pointer items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 ${
            isUploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {isUploading && (
            <span
              aria-hidden="true"
              className="mr-2 size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
          )}
          {isUploading ? "Đang tải ảnh lên..." : "Chọn ảnh"}
        </label>
      </div>}

      {isUploading && (
        <p role="status" className="mt-3 text-sm text-zinc-600">
          Đang tải ảnh lên...
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
