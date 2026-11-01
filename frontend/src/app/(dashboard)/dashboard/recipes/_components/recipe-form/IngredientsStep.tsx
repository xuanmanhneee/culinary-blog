"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2, Wheat } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { emptyIngredient, useRecipeFormStore, type IngredientDraft } from "@/lib/stores/recipe-form-store";
import { ingredientsSchema, optionalNumber, type IngredientsValues } from "./schemas";
import { useServerErrors, type ServerErrors } from "./server-errors";
import { StepActions } from "./StepActions";

/** Bước 2 – danh sách nguyên liệu (FR-RCP-009): tên, số lượng, đơn vị, ghi chú, thứ tự. */
export function IngredientsStep({ serverErrors }: { serverErrors?: ServerErrors | null }) {
  const setIngredients = useRecipeFormStore((state) => state.setIngredients);
  const nextStep = useRecipeFormStore((state) => state.nextStep);
  const previousStep = useRecipeFormStore((state) => state.previousStep);

  const form = useForm<IngredientsValues>({
    resolver: zodResolver(ingredientsSchema),
    defaultValues: { ingredients: useRecipeFormStore.getState().draft.ingredients },
    mode: "onTouched",
  });
  // keyName khác "id" vì "id" là id nguyên liệu trên server (khi sửa).
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "ingredients",
    keyName: "fieldKey",
  });
  const errors = form.formState.errors.ingredients;
  useServerErrors(form.setError, serverErrors, 1);

  useEffect(() => {
    const subscription = form.watch((values) => setIngredients((values.ingredients ?? []) as IngredientDraft[]));
    return () => subscription.unsubscribe();
  }, [form, setIngredients]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        setIngredients(values.ingredients);
        nextStep();
      })}
    >
      {fields.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="Chưa có nguyên liệu"
          description="Có thể bỏ qua bước này và thêm nguyên liệu sau."
          action={
            <Button type="button" variant="outline" onClick={() => append(emptyIngredient())}>
              <Plus />
              Thêm nguyên liệu
            </Button>
          }
        />
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => {
            const itemErrors = errors?.[index];
            return (
              <li key={field.fieldKey} className="rounded-lg border bg-background p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <Field data-invalid={!!itemErrors?.name}>
                    <FieldLabel htmlFor={`ingredient-${index}-name`}>Tên nguyên liệu</FieldLabel>
                    <Input
                      id={`ingredient-${index}-name`}
                      placeholder="Ví dụ: Thịt bò"
                      aria-invalid={!!itemErrors?.name}
                      {...form.register(`ingredients.${index}.name`)}
                    />
                    <FieldError errors={[itemErrors?.name]} />
                  </Field>
                  <Field data-invalid={!!itemErrors?.quantity}>
                    <FieldLabel htmlFor={`ingredient-${index}-quantity`}>Số lượng</FieldLabel>
                    <Input
                      id={`ingredient-${index}-quantity`}
                      type="number"
                      step="any"
                      min={0}
                      placeholder="Vừa đủ"
                      aria-invalid={!!itemErrors?.quantity}
                      {...form.register(`ingredients.${index}.quantity`, { setValueAs: optionalNumber })}
                    />
                    <FieldError errors={[itemErrors?.quantity]} />
                  </Field>
                  <Field data-invalid={!!itemErrors?.unit}>
                    <FieldLabel htmlFor={`ingredient-${index}-unit`}>Đơn vị</FieldLabel>
                    <Input
                      id={`ingredient-${index}-unit`}
                      placeholder="g, ml, muỗng..."
                      aria-invalid={!!itemErrors?.unit}
                      {...form.register(`ingredients.${index}.unit`)}
                    />
                    <FieldError errors={[itemErrors?.unit]} />
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <Field className="min-w-48 flex-1" data-invalid={!!itemErrors?.notes}>
                    <FieldLabel htmlFor={`ingredient-${index}-notes`}>Ghi chú</FieldLabel>
                    <Input
                      id={`ingredient-${index}-notes`}
                      placeholder="Ví dụ: thái mỏng"
                      aria-invalid={!!itemErrors?.notes}
                      {...form.register(`ingredients.${index}.notes`)}
                    />
                    <FieldError errors={[itemErrors?.notes]} />
                  </Field>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      aria-label="Chuyển lên"
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                      aria-label="Chuyển xuống"
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label="Xóa nguyên liệu"
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {fields.length > 0 && (
        <Button type="button" variant="outline" onClick={() => append(emptyIngredient())}>
          <Plus />
          Thêm nguyên liệu
        </Button>
      )}

      <StepActions onBack={previousStep} />
    </form>
  );
}
