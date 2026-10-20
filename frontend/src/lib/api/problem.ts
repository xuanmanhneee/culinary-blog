/**
 * Chuyển lỗi backend (ApiError mang RFC 7807 Problem Details) thành thứ UI hiển thị được:
 * thông báo dễ hiểu theo mã lỗi, và lỗi theo field để đổ vào React Hook Form.
 */
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";

/** Thông báo tiếng Việt cho các mã lỗi ứng dụng (SRS Phụ lục B) hay gặp ở module công thức. */
const codeMessages: Record<string, string> = {
  RECIPE_NOT_FOUND: "Không tìm thấy công thức, có thể đã bị xóa.",
  RECIPE_FORBIDDEN: "Bạn không có quyền thao tác trên công thức này.",
  RECIPE_SLUG_EXISTS: "Đã có công thức trùng tiêu đề. Hãy đổi tiêu đề khác.",
  RECIPE_PUBLISH_INCOMPLETE: "Công thức cần ít nhất 1 bước thực hiện trước khi xuất bản.",
  RECIPE_CONCURRENCY_CONFLICT: "Công thức vừa được sửa ở nơi khác. Hãy tải lại trang để lấy bản mới nhất.",
  INGREDIENT_NOT_FOUND: "Nguyên liệu không còn tồn tại.",
  STEP_NOT_FOUND: "Bước thực hiện không còn tồn tại.",
  IMAGE_NOT_FOUND: "Ảnh không còn tồn tại.",
  AUTH_UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

const statusMessages: Record<number, string> = {
  400: "Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu.",
  409: "Dữ liệu bị trùng.",
  422: "Dữ liệu đã thay đổi, vui lòng tải lại.",
  429: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.",
};

/** Một câu thông báo cho toast/ErrorState, ưu tiên mã lỗi rồi tới HTTP status. */
export function getErrorMessage(error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại."): string {
  if (error instanceof ApiError) {
    const byCode = error.code ? codeMessages[error.code] : undefined;
    const byStatus =
      statusMessages[error.status] ?? (error.status >= 500 ? "Máy chủ đang gặp sự cố, vui lòng thử lại sau." : undefined);
    return byCode ?? byStatus ?? (error.message || fallback);
  }
  if (error instanceof TypeError) return "Không kết nối được tới máy chủ. Kiểm tra mạng rồi thử lại.";
  return fallback;
}

/** "ingredients[0].name" (backend) → "ingredients.0.name" (React Hook Form). */
export function toFormPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, ".$1");
}

/**
 * Đổ lỗi validation của backend vào form. Trả về các thông báo không gắn được vào field nào
 * (ví dụ field không có trên bước hiện tại) để hiển thị chung.
 *
 * @param fieldMap đổi tên field backend → field form khi khác nhau, ví dụ { "steps": "steps.root" }.
 * @param knownFields chỉ gắn vào các field form đang hiển thị; field khác trả về trong kết quả.
 */
export function applyProblemToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: { fieldMap?: Record<string, string>; knownFields?: (field: string) => boolean } = {},
): string[] {
  if (!(error instanceof ApiError) || !error.problem.errors) return [getErrorMessage(error)];

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
