"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RECIPE_IMAGE_ACCEPT, validateRecipeImageFile } from "@/lib/recipe-image";

export interface SelectedRecipeImage {
  file: File;
  previewUrl: string;
}

interface RecipeImageFilePickerProps {
  id: string;
  label: string;
  selection: SelectedRecipeImage | null;
  onFileChange: (file: File | null) => void;
}

export function RecipeImageFilePicker({ id, label, selection, onFileChange }: RecipeImageFilePickerProps) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!selected) return;

    const validationError = validateRecipeImageFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileChange(selected);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 px-5 py-5 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40"
      >
        {selection ? (
          <span className="relative block aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg bg-muted">
            <Image src={selection.previewUrl} alt={`Xem trước ${label.toLocaleLowerCase("vi")}`} fill unoptimized className="object-cover" />
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm font-medium"><ImagePlus /> Chọn {label.toLocaleLowerCase("vi")}</span>
        )}
        <span className="text-xs text-muted-foreground">JPEG, PNG, WebP hoặc AVIF · tối đa 5 MB</span>
        {selection && <span className="max-w-full truncate text-xs text-emerald-700">{selection.file.name}</span>}
      </label>
      <input id={id} type="file" accept={RECIPE_IMAGE_ACCEPT} className="sr-only" onChange={handleChange} />
      {selection && (
        <Button type="button" size="sm" variant="ghost" onClick={() => { setError(null); onFileChange(null); }}>
          <X /> Bỏ ảnh đã chọn
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
