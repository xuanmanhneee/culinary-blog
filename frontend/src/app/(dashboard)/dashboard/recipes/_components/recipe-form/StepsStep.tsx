"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, ListOrdered, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { emptyStep, useRecipeFormStore, type StepDraft } from "@/lib/stores/recipe-form-store";
import { optionalNumber, stepsSchema, type StepsValues } from "./schemas";
import { StepActions } from "./StepActions";

/** Bước 3 – các bước thực hiện (FR-RCP-010). Số thứ tự theo vị trí, backend đánh lại 1, 2, 3... */
export function StepsStep() {
  const setSteps = useRecipeFormStore((state) => state.setSteps);
  const nextStep = useRecipeFormStore((state) => state.nextStep);
  const previousStep = useRecipeFormStore((state) => state.previousStep);

  const form = useForm<StepsValues>({
    resolver: zodResolver(stepsSchema),
    defaultValues: { steps: useRecipeFormStore.getState().draft.steps },
    mode: "onTouched",
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
    keyName: "fieldKey",
  });
  const errors = form.formState.errors.steps;

  useEffect(() => {
    const subscription = form.watch((values) => setSteps((values.steps ?? []) as StepDraft[]));
    return () => subscription.unsubscribe();
  }, [form, setSteps]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        setSteps(values.steps);
        nextStep();
      })}
    >
      {fields.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Chưa có bước thực hiện"
          description="Công thức cần ít nhất 1 bước để có thể xuất bản."
          action={
            <Button type="button" variant="outline" onClick={() => append(emptyStep())}>
              <Plus />
              Thêm bước
            </Button>
          }
        />
      ) : (
        <ol className="space-y-3">
          {fields.map((field, index) => {
            const itemErrors = errors?.[index];
            return (
              <li key={field.fieldKey} className="flex gap-4 rounded-lg border bg-background p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Field data-invalid={!!itemErrors?.title}>
                      <FieldLabel htmlFor={`step-${index}-title`}>Tiêu đề (tùy chọn)</FieldLabel>
                      <Input
                        id={`step-${index}-title`}
                        placeholder={`Bước ${index + 1}`}
                        aria-invalid={!!itemErrors?.title}
                        {...form.register(`steps.${index}.title`)}
                      />
                      <FieldError errors={[itemErrors?.title]} />
                    </Field>
                    <Field data-invalid={!!itemErrors?.timerMinutes}>
                      <FieldLabel htmlFor={`step-${index}-timer`}>Thời gian (phút)</FieldLabel>
                      <Input
                        id={`step-${index}-timer`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        placeholder="Không bắt buộc"
                        aria-invalid={!!itemErrors?.timerMinutes}
                        {...form.register(`steps.${index}.timerMinutes`, { setValueAs: optionalNumber })}
                      />
                      <FieldError errors={[itemErrors?.timerMinutes]} />
                    </Field>
                  </div>
                  <Field data-invalid={!!itemErrors?.description}>
                    <FieldLabel htmlFor={`step-${index}-description`}>Mô tả</FieldLabel>
                    <Textarea
                      id={`step-${index}-description`}
                      rows={3}
                      placeholder="Mô tả chi tiết thao tác..."
                      aria-invalid={!!itemErrors?.description}
                      {...form.register(`steps.${index}.description`)}
                    />
                    <FieldError errors={[itemErrors?.description]} />
                  </Field>
                  <div className="flex justify-end gap-1">
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Xóa bước">
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Lỗi cấp danh sách, ví dụ "Cần ít nhất 1 bước thực hiện." */}
      <FieldError errors={[errors?.root, errors as { message?: string } | undefined]} />

      {fields.length > 0 && (
        <Button type="button" variant="outline" onClick={() => append(emptyStep())}>
          <Plus />
          Thêm bước
        </Button>
      )}

      <StepActions onBack={previousStep} />
    </form>
  );
}
