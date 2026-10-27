# Architecture Mapping

> Tài liệu này mô tả implementation hiện tại trên nhánh `feature/lab-6-ui-components-and-layout`, sau khi hợp nhất `main`, `2314506_RecipeDashboardApi` và `2314506_RecipeDetailPage`. Đây là trạng thái code đã triển khai, không phải danh sách tính năng dự kiến.

## 1. Tổng quan hệ thống

```text
Browser
  └─ Next.js App Router (frontend)
       ├─ Trang công khai / nội dung tĩnh và dữ liệu mẫu
       ├─ Trang tìm kiếm gọi API backend
       ├─ Dashboard quản lý công thức gọi API backend
       ├─ Trang chi tiết công thức: server fetch + cache public / fetch có token để preview
       └─ Auth.js Credentials: đăng nhập, đăng ký, refresh, logout
             └─ HTTP /api/v1
                  └─ ASP.NET Core Minimal API
                       ├─ Auth, profile, categories, recipes, ingredients, steps, images
                       ├─ Application services / handlers và domain
                       ├─ EF Core + PostgreSQL
                       ├─ Redis health check
                       ├─ File storage: Local hoặc MinIO
                       └─ Hangfire worker/storage
```

### Công nghệ chính

| Thành phần | Công nghệ / vai trò |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Auth frontend | Auth.js Credentials; JWT session của Auth.js giữ access/refresh token backend |
| Trạng thái server frontend | TanStack Query cho các màn hình quản lý gọi API |
| Trạng thái form | Zustand cho wizard tạo/sửa công thức; React Hook Form và Zod cho từng bước |
| Backend | ASP.NET Core Minimal API, phân lớp API / Application / Domain / Infrastructure |
| Database | PostgreSQL, EF Core; migration được chạy khi API khởi động |
| Search | PostgreSQL full-text search kết hợp `pg_trgm` fuzzy matching |
| Storage | Local file system hoặc MinIO/S3-compatible, chọn bằng `Storage:Provider` |

## 2. Backend

### 2.1 Luồng request và khởi động

```text
HTTP request
  → forwarded headers / error handling / HTTPS / static files / CORS
  → authentication → authorization
  → Minimal API endpoint (/api/v1/...)
  → Application service/handler
  → Domain + EF Core / infrastructure adapters
  → PostgreSQL, Redis hoặc file storage
```

- `Program.cs` đăng ký các lớp backend, cấu hình JWT, CORS, health checks và route `/api/v1`.
- Migration database được áp dụng lúc khởi động; seed dữ liệu tùy chọn theo cấu hình.
- Static files được phục vụ từ web root; upload local đặt trong `wwwroot/uploads/recipes`.
- Health checks gồm PostgreSQL và Redis; MinIO check chỉ được đăng ký khi storage provider không phải `Local`.
- Hangfire server và storage được cấu hình. Recurring ping job hiện bị vô hiệu hóa và job cũ được xóa lúc startup; không nên coi việc cấu hình Hangfire là bằng chứng có recurring business job đang chạy.
- Trong môi trường Development, Hangfire dashboard được bật.

### 2.2 API chính

Các endpoint dùng prefix `/api/v1`.

| Nhóm | Endpoint/chức năng |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`; `GET /auth/me`; `PATCH /auth/me` |
| Recipe public | `GET /recipes`, `GET /recipes/search`, `GET /recipes/{slug}` |
| Recipe management | `GET /recipes/by-id/{id}`, `POST /recipes`, `PUT /recipes/{id}`, publish/unpublish/archive và xóa |
| Recipe ingredients | Thêm, sửa, xóa ingredient theo recipe |
| Recipe steps | Thêm, sửa, xóa step theo recipe |
| Recipe images | Upload, chọn ảnh chính, xóa ảnh |
| Categories | Đọc toàn bộ danh mục đang hoạt động theo thứ tự hiển thị; đọc chi tiết; tạo category dành cho Admin |

`GET /recipes` hỗ trợ lọc dữ liệu của người dùng (`mine`) và trạng thái recipe, bên cạnh phân trang. Các route quản lý được bảo vệ bằng authentication/authorization; backend vẫn là nơi quyết định quyền sở hữu và quyền Admin.

### 2.3 Tìm kiếm công thức

- `GET /recipes/search` được xử lý qua `IRecipeSearchReader` trong Infrastructure, không dùng đường truy vấn generic của `IApplicationDbContext`.
- Chỉ recipe đã Published xuất hiện trong kết quả.
- Từ khóa được tách thành các term và tạo PostgreSQL `tsquery` kiểu prefix với cấu hình `vietnamese` dùng unaccent dictionary, kết hợp điều kiện fuzzy trigram (`pg_trgm`) trên `SearchTextNormalized`.
- Query nhận `categorySlug` tùy chọn để giới hạn kết quả theo slug danh mục.
- Kết quả được xếp hạng bằng tổng điểm full-text và word-trigram similarity, sau đó phân trang ổn định theo ID.
- Chuỗi fuzzy được chuyển chữ thường, bỏ dấu kết hợp và chuẩn hóa `đ` thành `d`. Search vector và text chuẩn hóa được duy trì bằng cấu hình/migration database.

### 2.4 Lưu trữ ảnh và cache backend

- `Storage:Provider=Local` đăng ký `LocalFileStorageService`; provider khác sử dụng `MinioFileStorageService` với cấu hình endpoint, bucket và credentials.
- Local storage chỉ chấp nhận extension ảnh được hỗ trợ và lưu file theo thư mục recipe. Khi xóa, service kiểm tra URL thuộc khu vực uploads và đường dẫn không thoát khỏi thư mục đó.
- Upload ảnh kiểm tra loại nội dung/chữ ký ở luồng xử lý; nếu lưu metadata thất bại sau khi upload object, luồng thử xóa object vừa tạo để hạn chế file mồ côi.
- `ICacheService` hiện là logging placeholder, không phải Redis-backed cache. Redis được cấu hình cho health check nhưng không nên hiểu là cache ứng dụng đang được Redis phục vụ.

## 3. Frontend

### 3.1 Xác thực và tài khoản

```text
Login/Register form
  → Auth.js Credentials authorize()
  → POST /api/v1/auth/login hoặc /register
  → Auth.js JWT session chứa backend access token, refresh token, expiry và roles
  → API client dùng access token để gọi route cần đăng nhập
  → Khi access token còn dưới 30 giây: POST /auth/refresh
  → Refresh lỗi: session đánh dấu lỗi và guard đăng xuất về /login
```

- Hỗ trợ đăng ký và đăng nhập bằng email/mật khẩu qua backend.
- Đổi mật khẩu yêu cầu mật khẩu hiện tại; backend dùng ASP.NET Core Identity và thu hồi các refresh token đang hoạt động sau khi đổi thành công.
- Trang `/account` cho phép cập nhật họ tên, ảnh đại diện và bio qua `PATCH /auth/me`; đổi mật khẩu gọi `POST /auth/change-password`. Session Auth.js đồng bộ profile mới và đăng xuất sau khi đổi mật khẩu vì refresh token bị thu hồi.
- Quên/đặt lại mật khẩu chưa được triển khai: cần tích hợp dịch vụ gửi email trước khi công khai reset token an toàn.
- Auth.js lưu backend tokens trong JWT session; không dùng Zustand làm nguồn token. Provider xóa localStorage của auth store cũ.
- Đăng xuất Auth.js đồng thời gọi endpoint logout backend khi có token.
- Trang `/account` có luồng xem/cập nhật profile qua `/auth/me`.
- Google OAuth chưa được nối vào frontend; mô tả provider trong comment là hướng mở rộng, không phải tính năng đang hoạt động.

### 3.2 Dashboard và wizard recipe

- Dashboard công thức tải danh sách qua `GET /recipes?mine=true`, lọc status và phân trang; TanStack Query quản lý cache/trạng thái request.
- Tạo và sửa recipe dùng wizard 4 bước: thông tin cơ bản, nguyên liệu, các bước, dinh dưỡng/xem lại. Từng bước dùng React Hook Form/Zod; Zustand giữ dữ liệu khi chuyển bước.
- Draft tạo mới được lưu trong `sessionStorage` (theo tab) để phục hồi khi tải lại; chế độ sửa tải dữ liệu từ server và không lưu bản nháp client-side.
- Tạo mới gửi recipe; sửa dùng `GET /recipes/by-id/{id}` để lấy ETag, `PUT` với `If-Match`, sau đó đồng bộ ingredients và steps. Nếu ETag xung đột, UI yêu cầu tải lại phiên bản mới.
- Dashboard cung cấp thao tác đổi trạng thái/xóa theo quyền. API backend kiểm tra quyền cuối cùng.
- Tab “Món đã lưu” hiện là placeholder; chưa có luồng favorites/save đồng bộ backend.

### 3.3 Trang chi tiết công thức

Trang `/recipes/[slug]` lấy dữ liệu qua `getRecipeForViewer(slug)`:

1. Thử lấy recipe public bằng request có cache/revalidate 300 giây và cache tags.
2. Với recipe không public bị backend từ chối, thử lại không cache bằng access token của Auth.js session để chủ sở hữu/Admin xem preview.
3. Nếu không tồn tại, hiển thị not-found; nếu không đủ quyền xem preview, hiển thị forbidden.

Trang detail hiện có:

- Metadata/Open Graph; JSON-LD chỉ xuất hiện với recipe công khai, không xuất hiện với bản preview.
- Cảnh báo preview cho draft/archived và robots `noindex, nofollow`.
- Gallery ảnh, thời gian chuẩn bị/nấu, khẩu phần, độ khó, nguyên liệu có điều chỉnh servings, dinh dưỡng, các bước và ghi chú tác giả.
- Hành động của chủ sở hữu/Admin, chỉnh sửa và quản lý upload ảnh; hành động in/chia sẻ được giữ lại.
- Loading và not-found UI riêng.

### 3.4 Các trang công khai và mức độ tích hợp API

- Trang tìm kiếm `/search` gọi API backend và hỗ trợ kết quả/phân trang theo query.
- Trang chủ tải danh mục từ `GET /categories` và sáu công thức Published mới nhất từ `GET /recipes`, có cache/revalidate 300 giây; lỗi API được hiển thị rõ theo từng khu vực.
- `/categories` tải danh sách danh mục từ `GET /categories`, hiển thị ảnh/miêu tả khi có. Liên kết danh mục dẫn tới `/search?categorySlug=...`.
- `/recipes` vẫn dùng dữ liệu mẫu; bộ lọc hiển thị ở trang đó chưa được nối backend. Luồng search theo category sẽ được hoàn tất cùng Hạng mục 3.

## 4. Luồng dữ liệu frontend ↔ backend

| Luồng | Điểm vào frontend | API/backend | Ghi chú |
|---|---|---|---|
| Đăng ký/đăng nhập | `/register`, `/login` | `/auth/register`, `/auth/login` | Credentials qua Auth.js |
| Refresh/logout | Auth.js callbacks/events | `/auth/refresh`, `/auth/logout` | Refresh token rotation; lỗi refresh kết thúc session |
| Hồ sơ | `/account` | `/auth/me` GET/PATCH | Yêu cầu session |
| Danh sách quản lý | `/dashboard/recipes` | `/recipes?mine=true` | Status filter + pagination |
| Tạo/sửa | wizard dashboard | recipes, ingredients, steps | Sửa có ETag/`If-Match` |
| Search | `/search?q=...` | `/recipes/search` | Full-text + fuzzy |
| Detail/preview | `/recipes/[slug]` | `/recipes/{slug}` | Public cache; fallback authenticated cho preview |
| Upload ảnh | Detail/editor image UI | recipe image endpoints | Backend lưu metadata và object/file |

API client dùng prefix `/api/v1`, gắn access token cho request xác thực, giải mã ProblemDetails và phân biệt lỗi HTTP với lỗi mạng.

## 5. Các giới hạn đã xác nhận

- Google OAuth chưa được triển khai ở frontend.
- Favorite/“Món đã lưu” chưa được nối với API; tab hiện chỉ là placeholder.
- Trang danh sách `/recipes` vẫn dùng dữ liệu mẫu; bộ lọc hiển thị trên trang đó chưa gọi backend.
- `ICacheService` chưa triển khai cache phân tán; Redis hiện có health check.
- Hangfire được cấu hình nhưng recurring ping đang bị tắt.
- Một số lối tắt tài khoản như cài đặt/trợ giúp hiển thị điều hướng UI; không đồng nghĩa đã có backend workflow tương ứng.
