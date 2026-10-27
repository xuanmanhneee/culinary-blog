import { ApiError } from "@/lib/api/client";

const statusMessages: Record<number, string> = {
  400: "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy nội dung bạn yêu cầu.",
  409: "Dữ liệu đã thay đổi hoặc bị trùng. Vui lòng tải lại trang.",
  422: "Một số thông tin chưa đúng. Vui lòng kiểm tra lại.",
  429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
  500: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.detail || error.problem.title || statusMessages[error.status] || error.message;
  }

  if (error instanceof Error && error.message) return error.message;
  return "Đã có lỗi không mong muốn xảy ra. Vui lòng thử lại.";
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.problem.errors) return {};

  return Object.fromEntries(
    Object.entries(error.problem.errors).map(([field, messages]) => [field, messages.join(" ")]),
  );
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
