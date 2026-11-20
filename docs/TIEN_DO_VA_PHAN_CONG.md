# Tiến độ và phân công công việc – Culinary Blog

Nhóm trưởng: Phan Lê Xuân Mạnh · Repo: https://github.com/xuanmanhneee/culinary-blog

## 1. Phân công theo mô-đun

| Thành viên | Mô-đun |
|---|---|
| Phan Lê Xuân Mạnh (nhóm trưởng) | Kiến trúc, Jobs, DevOps, Engagement, Auth (JWT, Google), Category, tích hợp |
| Nguyễn Đình Thạch | Recipe, Ingredient, Step, Recipe Image |
| Lý Ngọc Thảo Nguyên | Search, File/Image Processing, SEO, giao diện trang chủ/danh mục/quản trị |
| Trần Tấn Khải | Auth (đăng ký, đăng nhập, phân quyền) |

**Cách phối hợp:** mỗi người phụ trách một mô-đun từ dữ liệu, API đến giao diện; làm trên nhánh riêng, gộp qua pull request; hợp đồng API (`docs/openapi.v1.json`) là điểm thống nhất giữa frontend và backend; nhóm trưởng gom, xử lý xung đột và hoàn thiện khi tích hợp.

## 2. Bảng tiến độ

Trạng thái: **Xong** · **Có điều kiện** (đã cài đặt nhưng cần cấu hình/bổ sung để dùng thật) · **Chưa**.

| Mô-đun | Công việc | Phụ trách | Trạng thái |
|---|---|---|---|
| **Platform** | Khung Clean Architecture, CQRS theo mô-đun | Xuân Mạnh | Xong |
| | Dữ liệu mẫu, migration CSDL | Xuân Mạnh | Xong |
| | Xử lý lỗi RFC 7807 (409, 422), OpenAPI v1 | Xuân Mạnh | Xong |
| | Tích hợp, giải quyết xung đột khi gộp nhánh, tái cấu trúc theo kiến trúc | Xuân Mạnh | Xong |
| | Công việc nền (Hangfire), bảo vệ dashboard | Xuân Mạnh | Xong |
| | Logging có cấu trúc (Serilog, Seq), tracing, metric | Xuân Mạnh | Xong |
| | Cache Redis, chịu lỗi khi Redis không sẵn sàng | Xuân Mạnh | Xong |
| | Docker Compose, image frontend | Xuân Mạnh | Xong |
| | Nginx reverse proxy, TLS cục bộ | Xuân Mạnh | Có điều kiện (chứng chỉ self-signed) |
| **Auth** | Đăng ký, đăng nhập, phân quyền theo vai trò | Tấn Khải | Xong |
| | JWT, refresh token | Xuân Mạnh | Xong |
| | API hồ sơ, đổi mật khẩu | Xuân Mạnh | Xong |
| | Form hồ sơ, đổi mật khẩu | Thảo Nguyên | Xong |
| | Đăng nhập Google OAuth | Xuân Mạnh | Có điều kiện (cần Google Client ID) |
| | Quản trị người dùng: danh sách, vai trò, khóa, xóa | Thảo Nguyên | Xong |
| **Category** | API danh mục, ảnh danh mục | Xuân Mạnh | Xong |
| | Trang quản trị danh mục | Xuân Mạnh | Xong |
| | Trang danh mục công khai | Thảo Nguyên | Xong |
| **Recipe** | Tạo, danh sách (lọc `mine`, `status`), xem chi tiết theo slug | Đình Thạch | Xong |
| | Cập nhật có kiểm soát đồng thời (409) | Đình Thạch | Xong |
| | Vòng đời trạng thái: publish, unpublish, archive, xóa | Đình Thạch | Xong |
| | Slug trùng tự thêm hậu tố | Xuân Mạnh | Xong |
| | Phân quyền endpoint công thức, audit log | Đình Thạch | Xong |
| **Ingredient / Step** | CRUD nguyên liệu | Đình Thạch | Xong |
| | CRUD các bước thực hiện | Đình Thạch | Xong |
| **Recipe Image** | Đặt ảnh chính, xóa ảnh, quản lý ảnh ở trang sửa | Đình Thạch | Xong |
| | Tải ảnh lên MinIO, tạo thumbnail, kiểm tra định dạng | Thảo Nguyên | Xong |
| **Search / SEO** | Tìm kiếm full-text tiếng Việt không dấu (PostgreSQL FTS) | Thảo Nguyên | Xong |
| | Lọc theo danh mục, sắp xếp kết quả | Thảo Nguyên | Xong |
| | Sitemap, canonical URL, JSON-LD Recipe | Thảo Nguyên | Xong |
| **Engagement** | Lưu món / bỏ lưu | Xuân Mạnh | Xong |
| | Đánh giá 1–5 | Xuân Mạnh | Xong |
| **Frontend** | Khung giao diện, thành phần dùng chung, auth store | Thảo Nguyên | Xong |
| | Trang chủ, tìm kiếm | Thảo Nguyên | Xong |
| | Chọn món ngẫu nhiên | Xuân Mạnh | Xong |
| | Dashboard công thức, trang chi tiết (khẩu phần, dinh dưỡng, gallery) | Đình Thạch | Xong |
| | Biểu mẫu tạo/sửa công thức nhiều bước, ảnh, trạng thái | Thảo Nguyên | Xong |
| **Kiểm thử** | Kiểm thử đơn vị và hành vi API (xUnit) | Xuân Mạnh | Xong |
| | Kiểm thử giao diện tự động (E2E) | | Chưa |

## 3. Kết quả

Hệ thống chạy được toàn bộ bằng Docker Compose gồm 10 dịch vụ: Nginx, frontend, API chính, Engagement, hai CSDL PostgreSQL, Redis, MinIO, Seq và MailHog, với dữ liệu mẫu và tài khoản mẫu. Chu trình sử dụng hoàn chỉnh: tác giả đăng nhập, soạn và xuất bản công thức; khách tìm kiếm và xem; người dùng lưu món và đánh giá; quản trị viên quản lý người dùng và danh mục.

### 3.1. Kiểm thử

| Hình thức | Kết quả (20/11/2026) |
|---|---|
| Kiểm thử tự động backend (xUnit) | 42/42 đạt, gồm Auth, Category, Recipe, Engagement, Cache, Jobs, Middleware, Users |
| Kiểm tra kiểu frontend (`tsc --noEmit`) | Không lỗi |
| Chạy thử tích hợp qua Docker Compose | Đạt các kịch bản ở bảng dưới |
| Kiểm thử giao diện tự động (E2E) | Chưa có; giao diện được kiểm tra thủ công |

| Kịch bản | Kết quả mong đợi | Kết quả |
|---|---|---|
| Đăng nhập tài khoản mẫu | Vào đúng khu vực theo vai trò | Đạt |
| Tìm `pho` | Trả về "Phở bò tái" | Đạt |
| Tạo bản nháp, xuất bản | Bản nháp không hiện công khai; sau xuất bản có `PublishedAt` | Đạt |
| Sửa bằng phiên bản cũ | API trả 409, không ghi đè | Đạt |
| Tải ảnh sai định dạng hoặc quá lớn | API từ chối | Đạt |
| Đánh giá ngoài khoảng 1–5 | API từ chối | Đạt |
| Quản trị viên tự khóa mình | Hệ thống từ chối | Đạt |
| Đăng nhập Google | Chuyển tới Google, nhận ID token, tạo hoặc liên kết người dùng | Đã kiểm tra chuyển hướng và việc backend từ chối token giả; **chờ đăng nhập thật** |

Quá trình kiểm thử tích hợp phát hiện một lỗi cấu hình: Nginx chuyển cả `/api/auth/*` (đường dẫn của Auth.js) sang backend nên trả 404. Nhóm đã thêm một `location` riêng trỏ về frontend.

### 3.2. Demo

Ảnh chụp từ bản chạy thật nằm trong `docs/images` (tìm kiếm, chi tiết công thức, biểu mẫu tạo công thức, quản lý người dùng). Kịch bản trình diễn:

1. Tìm `pho` để minh họa tìm kiếm không dấu.
2. Đăng nhập tác giả, tạo công thức qua biểu mẫu nhiều bước, xuất bản.
3. Sửa bằng phiên bản cũ để thấy lỗi 409.
4. Lưu món và đánh giá (Engagement).
5. Đăng nhập quản trị viên, quản lý người dùng và danh mục.

## 4. Đánh giá

### 4.1. Điểm đạt được

- **Đủ phạm vi SRS ở mức lõi:** các nhóm chức năng chính đều chạy được, không chỉ dừng ở API.
- **Kiến trúc rõ ràng:** modular monolith theo Clean Architecture và CQRS; dịch vụ Engagement tách riêng cho thấy cách xử lý dữ liệu và lỗi giữa hai dịch vụ.
- **Toàn vẹn dữ liệu:** kiểm soát đồng thời bằng phiên bản (409), xóa mềm, chuyển trạng thái có điều kiện.
- **Vận hành được:** có logging có cấu trúc, tracing, health check, công việc nền, cache chịu lỗi và hợp đồng OpenAPI.

### 4.2. Hạn chế

| Hạn chế | Ảnh hưởng | Hướng xử lý |
|---|---|---|
| Google OAuth cần Client ID riêng cho từng môi trường | Máy khác phải tự cấu hình mới dùng được | Có hướng dẫn trong phụ lục cài đặt |
| TLS dùng chứng chỉ self-signed | Trình duyệt cảnh báo lần đầu | Dùng chứng chỉ hợp lệ khi triển khai thật |
| Tạo công thức gồm nhiều yêu cầu liên tiếp | Có thể lưu dở nếu một bước giữa chừng thất bại | Gộp thành một giao dịch hoặc thêm cơ chế khôi phục |
| Engagement gọi HTTP tới backend chính | Lỗi khi backend không sẵn sàng; bản chụp trong danh sách đã lưu có thể cũ | Thêm hàng đợi sự kiện và thử lại |
| Chưa có E2E | Lỗi giao diện chỉ phát hiện khi kiểm tra thủ công | Bổ sung Playwright cho các luồng chính |

### 4.3. Bài học rút ra

- Kiểm thử tích hợp cho thấy lỗi ở ranh giới giữa các thành phần (như cấu hình Nginx) mà kiểm thử đơn vị không bắt được; nên chạy tích hợp sớm thay vì để cuối kỳ.
- Hợp đồng OpenAPI giúp frontend và backend làm song song, nhưng cần cập nhật cùng lúc với mã nguồn để không lệch.
- Công việc nên được chia nhỏ theo tuần và làm qua pull request để tiến độ và đóng góp của từng người thấy rõ ngay từ đầu, thay vì dồn về giai đoạn tích hợp cuối.

### 4.4. Hướng phát triển

Bổ sung E2E, hàng đợi sự kiện cho Engagement, giao dịch gộp cho luồng tạo công thức, bình luận và theo dõi tác giả, đồng thời triển khai lên tên miền thật với chứng chỉ hợp lệ.
