"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toFormPath } from "@/lib/api/problem";

/** Lỗi validation backend theo field, ví dụ { "title": [...], "ingredients[0].name": [...] }. */
export type ServerErrors = Record<string, string[]>;

/** Bước của form chứa field backend: 0 thông tin cơ bản, 1 nguyên liệu, 2 các bước, 3 dinh dưỡng. */
export function stepOfField(field: string): number {
  if (field.startsWith("ingredients")) return 1;
  if (field.startsWith("steps")) return 2;
  if (field.startsWith("nutrition")) return 3;
  return 0;
}

/** Bước đầu tiên có lỗi, để đưa người dùng tới đó. */
export function firstStepWithErrors(errors: ServerErrors): number {
  return Math.min(...Object.keys(errors).map(stepOfField));
}

/**
 * Đổ lỗi backend thuộc `step` vào form của bước đó khi bước được mở.
 * `mapField` đổi tên field khi form khác backend (ví dụ "nutrition" → "calories").
 */
export function useServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: ServerErrors | null | undefined,
  step: number,
  mapField: (path: string) => string = (path) => path,
) {
  useEffect(() => {
    if (!errors) return;
    let focused = false;
    for (const [field, messages] of Object.entries(errors)) {
      if (stepOfField(field) !== step) continue;
      setError(mapField(toFormPath(field)) as Path<T>, { type: "server", message: messages.join(" ") }, {
        shouldFocus: !focused,
      });
      focused = true;
    }
    // Chỉ áp dụng khi bộ lỗi mới tới; mapField là hằng ở nơi gọi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, setError, step]);
}
