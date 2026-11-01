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

/** Bảng dinh dưỡng mỗi khẩu phần; ẩn nếu tác giả không nhập chỉ số nào. */
export function RecipeNutrition({ nutrition }: { nutrition: RecipeNutritionDto }) {
  const rows = ROWS.filter((row) => nutrition[row.key] !== null);
  if (rows.length === 0) return null;

  return (
    <div className="mt-6 rounded-[1.5rem] border border-[#ded3c6] bg-white p-7 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-[#302a26]">Dinh dưỡng</h2>
      <p className="mt-1 text-xs text-[#8a8077]">Ước tính cho mỗi khẩu phần</p>
      <dl className="mt-5 divide-y divide-[#ece3d8] text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex justify-between py-2.5">
            <dt className="text-[#665d55]">{row.label}</dt>
            <dd className="font-bold text-[#3a342f]">{numberFormatter.format(nutrition[row.key]!)} {row.unit}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
