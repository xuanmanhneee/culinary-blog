"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeDifficultyBadge } from "@/components/recipes/RecipeDifficultyBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMinutes, formatTotalTime } from "@/lib/recipe-format";
import { useRecipeFormStore, type NutritionDraft } from "@/lib/stores/recipe-form-store";
import type { RecipeCategoryDto } from "@/lib/types/recipe";
import { nutritionSchema, optionalNumber, type NutritionValues } from "./schemas";
import { useServerErrors, type ServerErrors } from "./server-errors";
import { StepActions } from "./StepActions";

const nutritionFields: { name: keyof NutritionValues; label: string; unit: string }[] = [
  { name: "calories", label: "Năng lượng", unit: "kcal" },
  { name: "protein", label: "Protein", unit: "g" },
  { name: "carbohydrates", label: "Carbohydrate", unit: "g" },
  { name: "fat", label: "Chất béo", unit: "g" },
  { name: "fiber", label: "Chất xơ", unit: "g" },
  { name: "sodium", label: "Natri", unit: "mg" },
];

interface ReviewStepProps {
  categories: RecipeCategoryDto[];
  isSubmitting: boolean;
  /** `publish = true`: tạo xong xuất bản ngay (chỉ ở chế độ tạo mới). */
  onSubmit: (publish?: boolean) => void;
  serverErrors?: ServerErrors | null;
}

/** Bước 4 – dinh dưỡng mỗi khẩu phần (tùy chọn) và xem lại toàn bộ trước khi lưu. */
export function ReviewStep({ categories, isSubmitting, onSubmit, serverErrors }: ReviewStepProps) {
  const mode = useRecipeFormStore((state) => state.mode);
  const draft = useRecipeFormStore((state) => state.draft);
  const setNutrition = useRecipeFormStore((state) => state.setNutrition);
  const previousStep = useRecipeFormStore((state) => state.previousStep);

  const form = useForm<NutritionValues>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: useRecipeFormStore.getState().draft.nutrition,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control });
  // Backend báo lỗi chung "nutrition" → hiện ở ô đầu tiên; "nutrition.x" → ô x.
  useServerErrors(form.setError, serverErrors, 3, (path) =>
    path === "nutrition" ? "calories" : path.replace(/^nutrition\./, ""),
  );

  useEffect(() => {
    setNutrition({ ...useRecipeFormStore.getState().draft.nutrition, ...values } as NutritionDraft);
  }, [setNutrition, values]);

  const { basic, ingredients, steps } = draft;
  const category = categories.find((item) => item.id === basic.categoryId);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        setNutrition(values);
        onSubmit(false);
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>Dinh dưỡng mỗi khẩu phần (tùy chọn)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {nutritionFields.map((item) => (
            <Field key={item.name} data-invalid={!!errors[item.name]}>
              <FieldLabel htmlFor={`nutrition-${item.name}`}>
                {item.label} ({item.unit})
              </FieldLabel>
              <Input
                id={`nutrition-${item.name}`}
                type="number"
                step="any"
                min={0}
                aria-invalid={!!errors[item.name]}
                {...form.register(item.name, { setValueAs: optionalNumber })}
              />
              <FieldError errors={[errors[item.name]]} />
            </Field>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Xem lại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">{category?.name ?? "Chưa chọn danh mục"}</p>
            <h2 className="text-lg font-bold">{basic.title || "(Chưa có tiêu đề)"}</h2>
            <p className="text-muted-foreground">{basic.description}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-muted-foreground">
              <span>Chuẩn bị {formatMinutes(basic.prepTimeMinutes)}</span>
              <span>Nấu {formatMinutes(basic.cookTimeMinutes)}</span>
              <span>Tổng {formatTotalTime(basic.prepTimeMinutes, basic.cookTimeMinutes)}</span>
              <span>{basic.servings} phần</span>
              <RecipeDifficultyBadge difficulty={basic.difficulty} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Nguyên liệu ({ingredients.length})</h3>
            {ingredients.length === 0 ? (
              <p className="text-muted-foreground">Chưa có nguyên liệu.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {ingredients.map((item) => (
                  <li key={item.key}>
                    {[item.quantity ?? "Vừa đủ", item.unit, item.name].filter(Boolean).join(" ")}
                    {item.notes && <span className="text-muted-foreground"> – {item.notes}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-medium">Các bước ({steps.length})</h3>
            <ol className="list-decimal space-y-2 pl-5">
              {steps.map((item, index) => (
                <li key={item.key}>
                  <span className="font-medium">{item.title || `Bước ${index + 1}`}</span>
                  {item.timerMinutes && <span className="text-muted-foreground"> ({formatMinutes(item.timerMinutes)})</span>}
                  <p className="text-muted-foreground">{item.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <StepActions
        onBack={previousStep}
        isSubmitting={isSubmitting}
        extraAction={
          mode === "create" ? (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit((values) => {
                setNutrition(values);
                onSubmit(true);
              })}
            >
              <Send />
              Lưu và xuất bản
            </Button>
          ) : undefined
        }
        submitLabel={
          <>
            <Save />
            {mode === "create" ? "Lưu bản nháp" : "Lưu thay đổi"}
          </>
        }
      />
    </form>
  );
}
