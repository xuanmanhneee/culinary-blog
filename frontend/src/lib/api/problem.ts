/**
 * Lỗi riêng của module công thức, xây trên lib/errors.ts dùng chung:
 * - getRecipeErrorMessage: thông báo tiếng Việt theo mã lỗi ứng dụng (SRS Phụ lục B), các lỗi khác
 *   dùng getErrorMessage chung (detail/title của backend, theo HTTP status, lỗi mạng).
 * - applyProblemToForm: đổ lỗi validation backend vào đúng field của React Hook Form.
 */
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/errors";

/** Một số `detail` của backend là tiếng Anh; các mã hay gặp ở dashboard được dịch ở đây. */
const codeMessages: Record<string, string> = {
  RECIPE_NOT_FOUND: "Không tìm thấy công thức, có thể đã bị xóa.",
  RECIPE_FORBIDDEN: "Bạn không có quyền thao tác trên công thức này.",
  RECIPE_SLUG_EXISTS: "Đã có công thức trùng tiêu đề. Hãy đổi tiêu đề khác.",
  RECIPE_PUBLISH_INCOMPLETE: "Công thức cần ít nhất 1 bước thực hiện trước khi xuất bản.",
  RECIPE_CONCURRENCY_CONFLICT: "Công thức vừa được sửa ở nơi khác. Hãy tải lại trang để lấy bản mới nhất.",
  INGREDIENT_NOT_FOUND: "Nguyên liệu không còn tồn tại.",
  STEP_NOT_FOUND: "Bước thực hiện không còn tồn tại.",
  IMAGE_NOT_FOUND: "Ảnh không còn tồn tại.",
};

/** Một câu thông báo cho toast/ErrorState của dashboard công thức. */
export function getRecipeErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && codeMessages[error.code]) return codeMessages[error.code];
  return getErrorMessage(error);
}

/** "ingredients[0].name" (backend) → "ingredients.0.name" (React Hook Form). */
export function toFormPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, ".$1");
}

/**
 * Đổ lỗi validation của backend vào form. Trả về các thông báo không gắn được vào field nào
 * (ví dụ field không có trên bước hiện tại) để hiển thị chung.
 *
 * @param fieldMap đổi tên field backend → field form khi khác nhau.
 * @param knownFields chỉ gắn vào các field form đang hiển thị; field khác trả về trong kết quả.
 */
export function applyProblemToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: { fieldMap?: Record<string, string>; knownFields?: (field: string) => boolean } = {},
): string[] {
  if (!(error instanceof ApiError) || !error.problem.errors) return [getRecipeErrorMessage(error)];

  const unmatched: string[] = [];
  let focused = false;
  for (const [field, messages] of Object.entries(error.problem.errors)) {
    const path = options.fieldMap?.[field] ?? toFormPath(field);
    if (options.knownFields && !options.knownFields(path)) {
      unmatched.push(...messages);
      continue;
    }
    setError(path as Path<T>, { type: "server", message: messages.join(" ") }, { shouldFocus: !focused });
    focused = true;
  }
  return unmatched;
}
