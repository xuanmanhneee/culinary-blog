/**
 * Biến môi trường dùng chung cho toàn bộ ứng dụng (khai báo mẫu tại `.env.example`).
 *
 * - `NEXT_PUBLIC_*`: Next.js nhúng giá trị lúc build nên dùng được cả ở trình duyệt.
 * - `API_URL`: chỉ có giá trị ở server (SSR/ISR, hoặc trong Docker gọi thẳng tới service `api`),
 *   giúp tránh vòng qua Internet khi render phía server.
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

/** Tiền tố phiên bản API — backend dùng URL segment versioning nên luôn có `/api/v1`. */
export const API_V1 = `${API_URL}/api/v1`;

/** URL public của website, dùng cho canonical, Open Graph và JSON-LD (NFR-SEO). */
export const SITE_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
);
