import type { RecipeNutritionDto } from "@/lib/types/recipe";

const ROWS: { key: keyof RecipeNutritionDto; label: string; unit: string }[] = [
  { key: "calories", label: "Năng lượng", unit: "kcal" },
  { key: "protein", label: "Chất đạm", unit: "g" },
  { key: "carbohydrates", label: "Tinh bột", unit: "g" },
  { key: "fat", label: "Chất béo", unit: "g" },
  { key: "fiber", label: "Chất xơ", unit: "g" },
  { key: "sodium", label: "Natri", unit: "mg" },
];

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

/** Bảng dinh dưỡng mỗi khẩu phần; nói rõ khi tác giả chưa cung cấp dữ liệu. */
export function RecipeNutrition({ nutrition }: { nutrition: RecipeNutritionDto }) {
  const rows = ROWS.filter((row) => nutrition[row.key] !== null);

  return (
    <div className="rounded-2xl border border-border bg-card p-7 sm:p-8">
      <h2 className="text-lg font-bold text-foreground">Dinh dưỡng</h2>
      <p className="mt-1 text-xs text-muted-foreground">Ước tính cho mỗi khẩu phần</p>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">Tác giả chưa cung cấp thông tin dinh dưỡng.</p>
      ) : (
        <dl className="mt-5 divide-y divide-border text-sm">
          {rows.map((row) => (
            <div key={row.key} className="flex justify-between py-2.5">
              <dt className="text-foreground">{row.label}</dt>
              <dd className="font-bold text-foreground">{numberFormatter.format(nutrition[row.key]!)} {row.unit}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
