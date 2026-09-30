"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import type { RecipeImageDto } from "@/lib/types/recipe";

interface RecipeImageManagerProps {
  recipeId: string;
  images: RecipeImageDto[];
}

interface UploadedRecipeImage extends RecipeImageDto {
  id: string;
}

const maxFileSize = 5 * 1024 * 1024;
const acceptedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5000";

function getErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (typeof body === "object" && body !== null) {
    const problem = body as { detail?: unknown; title?: unknown; errors?: unknown };
    if (typeof problem.detail === "string") {
      return problem.detail;
    }
    if (typeof problem.title === "string") {
      return problem.title;
    }
    if (typeof problem.errors === "object" && problem.errors !== null) {
      const messages = Object.values(problem.errors)
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .filter((value): value is string => typeof value === "string");
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
  }

  return fallback;
}

export default function RecipeImageManager({
  recipeId,
  images: initialImages,
}: RecipeImageManagerProps) {
  const [images, setImages] = useState<RecipeImageDto[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    if (isUploading) {
      return;
    }

    setMessage("");
    setError("");

    if (file.size > maxFileSize) {
      setError("Ảnh không được vượt quá 5 MB.");
      return;
    }
    if (!acceptedImageTypes.has(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc AVIF.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${apiUrl}/api/v1/recipes/${encodeURIComponent(recipeId)}/images`,
        { method: "POST", body: formData },
      );
      const responseText = await response.text();
      let responseBody: unknown;
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText);
        } catch (parseError) {
          if (!(parseError instanceof SyntaxError)) {
            throw parseError;
          }
          responseBody = responseText;
        }
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(responseBody, `Không thể tải ảnh lên (HTTP ${response.status}).`),
        );
      }

      if (
        typeof responseBody !== "object"
        || responseBody === null
        || !("id" in responseBody)
        || typeof responseBody.id !== "string"
        || !("originalUrl" in responseBody)
        || typeof responseBody.originalUrl !== "string"
      ) {
        throw new Error("Máy chủ trả về dữ liệu ảnh không hợp lệ.");
      }

      const uploadedImage: UploadedRecipeImage = {
        id: responseBody.id,
        originalUrl: responseBody.originalUrl,
        isPrimary: "isPrimary" in responseBody && responseBody.isPrimary === true,
      };
      setImages((currentImages) => [...currentImages, uploadedImage]);
      setMessage("Tải ảnh lên thành công!");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Đã xảy ra lỗi khi tải ảnh lên.",
      );
    } finally {
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
    <section aria-labelledby="recipe-images-heading" className="mt-8">
      <h2 id="recipe-images-heading" className="text-xl font-semibold">
        Ảnh công thức
      </h2>

      {images.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => {
            const imageUrl = image.url ?? image.originalUrl;
            if (!imageUrl) {
              return null;
            }

            return (
              <li
                key={image.id ?? imageUrl}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100"
              >
                <Image
                  src={imageUrl}
                  alt={`Ảnh công thức ${index + 1}`}
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
      ) : (
        <p className="mt-3 text-sm text-zinc-600">Công thức chưa có ảnh.</p>
      )}

      <div
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
      </div>

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
