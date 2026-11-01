"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRecipeFormStore } from "@/lib/stores/recipe-form-store";
import { RECIPE_DIFFICULTY_LABELS, RecipeDifficulty, type RecipeCategoryDto } from "@/lib/types/recipe";
import { basicInfoSchema, requiredNumber, type BasicInfoValues } from "./schemas";
import { useServerErrors, type ServerErrors } from "./server-errors";
import { StepActions } from "./StepActions";

const difficulties = Object.values(RecipeDifficulty);

/** Bước 1 – thông tin cơ bản (FR-RCP-003/004). */
export function BasicInfoStep({
  categories,
  serverErrors,
}: {
  categories: RecipeCategoryDto[];
  serverErrors?: ServerErrors | null;
}) {
  const setBasic = useRecipeFormStore((state) => state.setBasic);
  const nextStep = useRecipeFormStore((state) => state.nextStep);

  // Giá trị ban đầu đọc một lần khi bước được mở (component được mount lại mỗi lần đổi bước).
  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: useRecipeFormStore.getState().draft.basic,
    mode: "onTouched",
  });
  const { errors } = form.formState;
  useServerErrors(form.setError, serverErrors, 0);

  // Tự lưu vào store khi gõ để chuyển bước/tải lại trang không mất dữ liệu.
  useEffect(() => {
    const subscription = form.watch((values) =>
      setBasic({ ...useRecipeFormStore.getState().draft.basic, ...values } as BasicInfoValues),
    );
    return () => subscription.unsubscribe();
  }, [form, setBasic]);

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => {
        setBasic(values);
        nextStep();
      })}
    >
      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">Tiêu đề</FieldLabel>
          <Input id="title" placeholder="Ví dụ: Phở bò Hà Nội" aria-invalid={!!errors.title} {...form.register("title")} />
          <FieldDescription>5–200 ký tự. Đường dẫn (slug) được tạo tự động từ tiêu đề.</FieldDescription>
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="description">Mô tả ngắn</FieldLabel>
          <Textarea
            id="description"
            rows={3}
            placeholder="Điều gì làm món ăn này đặc biệt?"
            aria-invalid={!!errors.description}
            {...form.register("description")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.categoryId}>
            <FieldLabel htmlFor="categoryId">Danh mục</FieldLabel>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId" className="w-full" aria-invalid={!!errors.categoryId} onBlur={field.onBlur}>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.categoryId]} />
          </Field>

          <Field data-invalid={!!errors.difficulty}>
            <FieldLabel htmlFor="difficulty">Độ khó</FieldLabel>
            <Controller
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <select id="difficulty" className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={String(field.value)} onChange={(event) => field.onChange(Number(event.target.value))}>
                  {difficulties.map((value) => <option key={value} value={String(value)}>{RECIPE_DIFFICULTY_LABELS[value]}</option>)}
                </select>
              )}
            />
            <FieldError errors={[errors.difficulty]} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field data-invalid={!!errors.prepTimeMinutes}>
            <FieldLabel htmlFor="prepTimeMinutes">Chuẩn bị (phút)</FieldLabel>
            <Input
              id="prepTimeMinutes"
              type="number"
              min={1}
              inputMode="numeric"
              aria-invalid={!!errors.prepTimeMinutes}
              {...form.register("prepTimeMinutes", { setValueAs: requiredNumber })}
            />
            <FieldError errors={[errors.prepTimeMinutes]} />
          </Field>
          <Field data-invalid={!!errors.cookTimeMinutes}>
            <FieldLabel htmlFor="cookTimeMinutes">Nấu (phút)</FieldLabel>
            <Input
              id="cookTimeMinutes"
              type="number"
              min={1}
              inputMode="numeric"
              aria-invalid={!!errors.cookTimeMinutes}
              {...form.register("cookTimeMinutes", { setValueAs: requiredNumber })}
            />
            <FieldError errors={[errors.cookTimeMinutes]} />
          </Field>
          <Field data-invalid={!!errors.servings}>
            <FieldLabel htmlFor="servings">Khẩu phần</FieldLabel>
            <Input
              id="servings"
              type="number"
              min={1}
              inputMode="numeric"
              aria-invalid={!!errors.servings}
              {...form.register("servings", { setValueAs: requiredNumber })}
            />
            <FieldError errors={[errors.servings]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="instructions">Ghi chú thêm (tùy chọn)</FieldLabel>
          <Textarea
            id="instructions"
            rows={3}
            placeholder="Mẹo nhỏ, cách bảo quản, biến tấu..."
            {...form.register("instructions")}
          />
        </Field>
      </FieldGroup>

      <StepActions />
    </form>
  );
}
