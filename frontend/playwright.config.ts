import { defineConfig, devices } from "@playwright/test";

/**
 * E2E chạy trên hệ thống đã dựng bằng `docker compose up -d` (nginx ở https://localhost, Mailhog ở :8025).
 * Đổi địa chỉ bằng E2E_BASE_URL và E2E_MAILHOG_URL khi chạy ở môi trường khác (ví dụ CI).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Các luồng nối tiếp nhau (đăng ký → xác nhận → tạo → xuất bản → tìm kiếm) nên chạy tuần tự.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://localhost",
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
