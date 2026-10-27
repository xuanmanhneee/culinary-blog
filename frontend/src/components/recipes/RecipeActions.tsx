"use client";

import { Printer, Share2 } from "lucide-react";

export function RecipeActions({ title }: { title: string }) {
  async function shareRecipe() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="absolute right-5 bottom-5 flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="In công thức"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow"
      >
        <Printer className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void shareRecipe()}
        aria-label="Chia sẻ công thức"
        className="grid size-11 place-items-center rounded-full bg-white/90 text-[#3d3732] shadow"
      >
        <Share2 className="size-4" />
      </button>
    </div>
  );
}
