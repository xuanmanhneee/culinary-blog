"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { formatIngredient } from "@/components/recipes/detail/ingredient-format";
import type { RecipeIngredientDto } from "@/lib/types/recipe";

const MAX_SERVINGS = 50;

/** Danh sách nguyên liệu kèm bộ chỉnh khẩu phần: định lượng nhân theo tỉ lệ so với khẩu phần gốc. */
export function RecipeIngredients({ ingredients, servings }: { ingredients: RecipeIngredientDto[]; servings: number }) {
  const [current, setCurrent] = useState(servings);
  const ratio = current / servings;

  return (
    <>
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span>Cho</span>
        <div className="flex items-center rounded-full border border-border bg-card">
          <button type="button" aria-label="Giảm khẩu phần" disabled={current <= 1} onClick={() => setCurrent((n) => n - 1)} className="grid size-8 place-items-center rounded-full text-primary hover:bg-muted disabled:opacity-40"><Minus className="size-3.5" /></button>
          <output aria-live="polite" className="min-w-8 text-center font-bold text-foreground">{current}</output>
          <button type="button" aria-label="Tăng khẩu phần" disabled={current >= MAX_SERVINGS} onClick={() => setCurrent((n) => n + 1)} className="grid size-8 place-items-center rounded-full text-primary hover:bg-muted disabled:opacity-40"><Plus className="size-3.5" /></button>
        </div>
        <span>người ăn</span>
        {current !== servings && <button type="button" onClick={() => setCurrent(servings)} className="text-xs font-semibold text-accent underline-offset-2 hover:underline">Về {servings}</button>}
      </div>
      {ingredients.length === 0 ? (
        <p className="mt-7 text-sm text-muted-foreground">Công thức chưa có nguyên liệu.</p>
      ) : (
        <ul className="mt-7 grid gap-x-6 gap-y-3 lg:grid-cols-2">{ingredients.map((ingredient) => <li key={ingredient.id} className="flex gap-3 text-sm leading-6 text-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" /><span>{formatIngredient(ingredient, ratio)}{ingredient.notes && <span className="text-muted-foreground"> – {ingredient.notes}</span>}</span></li>)}</ul>
      )}
    </>
  );
}
