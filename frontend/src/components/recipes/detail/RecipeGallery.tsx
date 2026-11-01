"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RecipeImageDto } from "@/lib/types/recipe";

/** Ảnh lớn đầu trang + dải ảnh nhỏ nằm đè góc dưới để chuyển ảnh (chỉ hiện khi công thức có từ 2 ảnh). */
export function RecipeGallery({ images, title }: { images: RecipeImageDto[]; title: string }) {
  const sorted = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.orderIndex - b.orderIndex);
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((image) => image.id === activeId) ?? sorted[0];

  return (
    <div className="relative mt-12 aspect-[16/8.2] min-h-[360px] overflow-hidden rounded-[2rem] bg-[#e4d8ca]">
      {active ? (
        // Ảnh nằm trên MinIO/thư mục upload của backend (host đổi theo môi trường) nên không qua bộ tối ưu ảnh.
        <Image key={active.id} src={active.url} alt={active.altText ?? title} fill priority unoptimized sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-[#9a8f84]"><ImageOff className="size-10" aria-hidden /><span className="sr-only">Chưa có ảnh</span></div>
      )}
      {sorted.length > 1 && (
        <ul className="absolute inset-x-4 bottom-4 flex justify-end gap-2 overflow-x-auto sm:inset-x-6 sm:bottom-6" aria-label="Ảnh khác của công thức">
          {sorted.map((image, index) => (
            <li key={image.id} className="shrink-0">
              <button type="button" onClick={() => setActiveId(image.id)} aria-label={`Xem ảnh ${index + 1}`} aria-pressed={image.id === active?.id}
                className={cn("relative block size-14 overflow-hidden rounded-xl border-2 shadow-md transition sm:size-20", image.id === active?.id ? "border-white" : "border-white/40 opacity-75 hover:opacity-100")}>
                <Image src={image.url} alt={image.altText ?? `${title} – ảnh ${index + 1}`} fill unoptimized sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
