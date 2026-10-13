/**
 * Kiểu dữ liệu chung của backend API (CulinaryBlog.Application.Common.Models).
 * JSON dùng camelCase; Guid và DateTimeOffset được gửi dạng chuỗi.
 */

/** Chuỗi Guid, ví dụ "3fa85f64-5717-4562-b3fc-2c963f66afa6". */
export type Guid = string;

/** Chuỗi ngày giờ ISO 8601 có múi giờ, ví dụ "2026-10-05T06:20:03.052434+00:00". */
export type IsoDateTime = string;

/** PagedResult<T> – kết quả phân trang (FR-RCP-001, FR-SRCH-001). */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
