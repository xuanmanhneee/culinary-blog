# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), đánh số theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Added
- Quên mật khẩu, đặt lại mật khẩu và đổi mật khẩu (`/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`); đổi hoặc đặt lại mật khẩu thu hồi mọi refresh token.
- Tải ảnh đại diện từ máy (`POST /auth/me/avatar`) và trang Tài khoản gom một khung (Hồ sơ, Bảo mật, Cài đặt, Trợ giúp).
- Công tắc nhận bản tin trong Cài đặt (`/subscriptions/me`); email bản tin có link quản lý nhận thư.
- Trang quản trị Tác vụ tự động (`/dashboard/automation`, `/api/v1/admin/jobs`): xem lịch, đổi lịch lặp, chạy ngay, gửi thử và hẹn giờ một lần (giờ Việt Nam).
- Tùy chọn "Ghi nhớ tôi" khi đăng nhập; trang `/confirm-email`.
- Giao diện email thống nhất cho email chào mừng, đặt lại mật khẩu và bản tin.
- Header `X-RateLimit-Limit/Remaining/Reset` cho mức giới hạn chung; cảnh báo log cho câu lệnh SQL chạy quá 100 ms (`Database:SlowQueryThresholdMs`).
- Test tích hợp cho các endpoint (PostgreSQL tạm bằng Testcontainers), test E2E Playwright cho 5 luồng cốt lõi, GitHub Actions CI.
- `docker-compose.prod.yml` (sao lưu `pg_dump` hằng ngày giữ 30 ngày, không mở cổng DB), `scripts/backup-db.sh`, `.editorconfig`.

### Changed
- Tên danh mục phải từ 2 ký tự (theo SRS FR-CAT-003).
- Chỉ đăng ký lịch tác vụ mặc định khi chưa tồn tại, giữ lịch quản trị viên đã đặt qua các lần khởi động lại.
- Link trong email trỏ về website (`Smtp:PublicWebUrl`) thay vì địa chỉ API.

### Fixed
- Trường giới thiệu (bio) không được lưu khi cập nhật hồ sơ.
- Link món ăn trong email bản tin trỏ nhầm về địa chỉ API.
- Bỏ file log và thư mục `.idea` khỏi git.

## [1.0.0]
- Bản đầu theo SRS v1.0.0: xác thực JWT, công thức, danh mục, tìm kiếm toàn văn, upload ảnh, Hangfire, dịch vụ Engagement (đánh giá, món đã lưu).
