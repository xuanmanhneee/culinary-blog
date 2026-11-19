/**
 * Biến môi trường dùng chung cho toàn bộ ứng dụng (khai báo mẫu tại `.env.example`).
 *
 * - `NEXT_PUBLIC_*`: Next.js nhúng giá trị lúc build nên dùng được cả ở trình duyệt.
 * - `API_URL` và `API_V1`: cấu hình riêng ở server (SSR/ISR, hoặc trong Docker gọi thẳng
 *   tới service `api`), giúp tránh vòng qua Internet khi render phía server.
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** URL backend: server ưu tiên `API_URL`, trình duyệt dùng `NEXT_PUBLIC_API_URL`. */
export const API_URL = trimTrailingSlash(
  (typeof window === "undefined" ? process.env.API_URL : undefined) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000",
);

/** Tiền tố phiên bản API — cho phép server override trực tiếp, client luôn dùng URL public. */
export const API_V1 = trimTrailingSlash(
  (typeof window === "undefined" ? process.env.API_V1 : undefined) ||
    `${API_URL}/api/v1`,
);

/** URL public của website, dùng cho canonical, Open Graph và JSON-LD (NFR-SEO). */
export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
);
