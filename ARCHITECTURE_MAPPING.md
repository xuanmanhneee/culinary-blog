# Architecture Mapping

> Tài liệu này mô tả trạng thái code hiện tại sau khi tích hợp `main` vào nhánh feature. Khi có khác biệt, luồng và hợp đồng backend của `main` là chuẩn; đây là implementation đã có, không phải danh sách tính năng dự kiến.

## 1. Tổng quan hệ thống

```text
Browser
  └─ Next.js App Router (frontend)
       ├─ Trang công khai gọi API backend (home, categories, recipes, search)
       ├─ Dashboard quản lý công thức gọi API backend
       ├─ Trang chi tiết công thức: server fetch + cache public / fetch có token để preview
       └─ Auth.js Credentials + Google OAuth tùy cấu hình
            └─ JWT session giữ token backend; refresh/logout qua API
                 └─ HTTP /api/v1
                      └─ ASP.NET Core Minimal API
                           ├─ Auth, users, categories, recipes, ingredients, steps, images
                           ├─ MediatR commands/queries, validators và domain
                           ├─ EF Core + PostgreSQL
                           ├─ Redis cache + health checks
                           ├─ File storage: Local hoặc MinIO
                           └─ Hangfire jobs / PostgreSQL storage
```

### Công nghệ chính

| Thành phần | Công nghệ / vai trò |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Auth frontend | Auth.js Credentials và Google OAuth tùy cấu hình; JWT session giữ access/refresh token backend |
| Trạng thái server frontend | TanStack Query cho các màn hình quản lý gọi API |
| Trạng thái form | Zustand cho wizard tạo/sửa công thức; React Hook Form và Zod cho từng bước |
| Backend | ASP.NET Core Minimal API, API / Application / Domain / Infrastructure; MediatR và FluentValidation |
| Database | PostgreSQL, EF Core; migration được chạy khi API khởi động |
| Search | PostgreSQL full-text search (`simple`) kết hợp `pg_trgm` fuzzy matching |
| Cache | Redis qua `IDistributedCache` và `ICacheService` |
| Storage | Local file system hoặc MinIO/S3-compatible, chọn bằng `Storage:Provider` |

## 2. Backend

### 2.1 Luồng request và khởi động

```text
HTTP request
  → correlation ID / global exception handling / ProblemDetails
  → status-code pages / static files / CORS / rate limiting
  → authentication → authorization
  → Minimal API endpoint (/api/v1/...)
  → MediatR command/query + validation
  → Domain + EF Core / infrastructure adapters
  → PostgreSQL, Redis hoặc file storage
```

- `Program.cs` đăng ký API versioning theo URL segment, JWT, CORS, rate limiting, OpenAPI/Scalar (Development) và OpenTelemetry; nhóm API phiên bản 1 dùng prefix `/api/v1`.
- Serilog ghi log có cấu trúc ra console và file rolling theo ngày trong `backend/src/CulinaryBlog.API/logs` (giữ tối đa 14 file); các sự kiện auth, đổi role/khóa user, chuyển trạng thái recipe, upload ảnh và exception được ghi kèm các trường ngữ cảnh.
- Middleware xử lý correlation ID, exception thành ProblemDetails và status-code errors; CORS chạy trước rate limiting/authentication để response lỗi vẫn có CORS headers.
- `InitializePersistenceAsync` áp dụng EF Core migrations lúc khởi động. Chạy API với `--seed` để seed dữ liệu rồi kết thúc tiến trình.
- Local storage phục vụ file từ web root; MinIO trả public URL theo cấu hình. Provider được chọn rõ bằng `Storage:Provider=Local|Minio`.
- Health endpoints `/health`, `/health/live`, `/health/ready`; các check gồm PostgreSQL, Redis và MinIO khi provider là MinIO.
- Hangfire dùng PostgreSQL; job nền gồm email xác nhận, tạo ảnh medium/thumbnail, dọn file và tạo sitemap mỗi ngày lúc 02:00 UTC. Dashboard Development yêu cầu Admin.
- Rate limit toàn cục 100 request/phút/IP; auth 10 và upload 5 request/phút/IP. Health checks được miễn giới hạn.

### 2.2 API chính

Các endpoint dùng prefix `/api/v1`.

| Nhóm | Endpoint/chức năng |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`; `GET /auth/confirm-email`; `GET/PATCH /auth/me` |
| Users | `GET /users` — danh sách phân trang; `PATCH /users/{id}/role` — đổi role Admin/Author/Reader; `PATCH /users/{id}/status` — khóa/mở khóa; `DELETE /users/{id}` — xóa tài khoản. Tất cả chỉ Admin |
| Recipe public | `GET /recipes`, `GET /recipes/search` (q, categoryId, difficulty, thời gian, khẩu phần), `GET /recipes/{slug}` |
| Recipe management | `GET /recipes/by-id/{id}`, `POST /recipes`, `PUT /recipes/{id}`, publish/unpublish/archive và xóa |
| Recipe ingredients | Thêm, sửa, xóa ingredient theo recipe |
| Recipe steps | Thêm, sửa, xóa step theo recipe |
| Recipe images | Upload, chọn ảnh chính, xóa ảnh |
| Categories | Đọc toàn bộ danh mục đang hoạt động theo thứ tự hiển thị; đọc chi tiết; tạo category dành cho Admin |

`GET /recipes` hỗ trợ lọc theo `categoryId`, trạng thái, độ khó, thời gian và phân trang; `mine=true` giới hạn vào công thức của người đăng nhập. Các route quản lý được bảo vệ bằng authentication/authorization; backend là nơi quyết định quyền sở hữu và quyền Admin.

### 2.3 Tìm kiếm công thức

- `GET /recipes/search` được xử lý qua `IRecipeSearchReader` trong Infrastructure, không dùng truy vấn generic.
- Chỉ recipe đã Published xuất hiện trong kết quả.
- Từ khóa được tách thành term và tạo PostgreSQL prefix `tsquery` với cấu hình `simple`, kết hợp fuzzy trigram (`pg_trgm`) trên `SearchTextNormalized`.
- Query nhận `categoryId`, độ khó, thời gian nấu tối đa và khẩu phần tối thiểu làm bộ lọc tùy chọn.
- Kết quả được xếp hạng bằng tổng điểm full-text và word-trigram similarity, sau đó phân trang ổn định theo ID.
- Chuỗi fuzzy được chuyển chữ thường, bỏ dấu kết hợp và chuẩn hóa `đ` thành `d`. `SearchVector` và `SearchTextNormalized` được duy trì bằng cấu hình/migration database.

### 2.4 Lưu trữ ảnh và cache backend

- `Storage:Provider=Local` đăng ký `LocalFileStorageService`; provider khác sử dụng `MinioFileStorageService` với cấu hình endpoint, bucket và credentials.
- Local storage chỉ chấp nhận extension ảnh được hỗ trợ và lưu file theo thư mục recipe. Khi xóa, service kiểm tra URL thuộc khu vực uploads và đường dẫn không thoát khỏi thư mục đó.
- Upload chỉ nhận định dạng ảnh được hỗ trợ, giới hạn 5 MB và kiểm tra magic bytes trước khi ghi file.
- Hangfire `ThumbnailJob` đọc ảnh gốc từ file storage, tạo biến thể 800×600 và 300×300 rồi lưu URL dẫn xuất vào metadata ảnh.
- Xóa recipe/ảnh có thể lên lịch dọn file bằng background job để tránh xóa object trong cùng transaction với metadata.
- `ICacheService` dùng `IDistributedCache`/Redis, serialize JSON và hỗ trợ eviction theo tag.

## 3. Frontend

### 3.1 Xác thực và tài khoản

```text
Login/Register form
  → Auth.js Credentials authorize() hoặc Google OAuth
  → POST /api/v1/auth/login, /register hoặc /google
  → Auth.js JWT session chứa backend access token, refresh token, expiry và roles
  → API client dùng access token để gọi route cần đăng nhập
  → Khi access token còn dưới 30 giây: POST /auth/refresh
  → Refresh lỗi: session đánh dấu lỗi và guard đăng xuất về /login
```

- Đăng ký/đăng nhập email-mật khẩu dùng ASP.NET Core Identity; Google OAuth tùy cấu hình frontend, gửi ID token sang backend để xác minh và phát token nội bộ.
- Đăng ký xếp job gửi email xác nhận qua SMTP/Hangfire và trả token đăng nhập ngay; xác nhận email có endpoint riêng nhưng hiện không phải điều kiện chặn đăng nhập.
- Trang `/account` đọc/cập nhật họ tên, ảnh đại diện và bio qua `GET/PATCH /auth/me`; profile mới được đồng bộ vào Auth.js session.
- API đổi mật khẩu và quên/đặt lại mật khẩu chưa được cung cấp trong luồng backend hiện tại; UI đổi mật khẩu cũ đã bỏ để không gọi endpoint không tồn tại.
- Auth.js lưu backend tokens trong JWT session; không dùng Zustand làm nguồn token. Provider xóa localStorage của auth store cũ.
- Đăng xuất Auth.js đồng thời gọi endpoint logout backend khi có token.
- Refresh token được quay vòng khi access token còn dưới 30 giây; refresh thất bại đánh dấu session lỗi để guard đưa người dùng về `/login`.
- Google OAuth chỉ bật khi có `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` ở frontend và cấu hình Google tương ứng ở backend.

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

- Metadata/Open Graph; JSON-LD Schema.org `Recipe` chỉ xuất hiện với recipe công khai, có URL chuẩn, ảnh, tác giả, nguyên liệu và hướng dẫn được sắp thứ tự; dữ liệu được escape an toàn khi serialize.
- Cảnh báo preview cho draft/archived và robots `noindex, nofollow`.
- Gallery ảnh, thời gian chuẩn bị/nấu, khẩu phần, độ khó, nguyên liệu có điều chỉnh servings, dinh dưỡng, các bước và ghi chú tác giả.
- Hành động của chủ sở hữu/Admin, chỉnh sửa và quản lý upload ảnh; hành động in/chia sẻ được giữ lại.
- Loading và not-found UI riêng.

### 3.4 Các trang công khai và mức độ tích hợp API

- Trang tìm kiếm `/search` nhận `q`, `categoryId` và `page` từ URL; lựa chọn danh mục và phân trang cập nhật URL, rồi gọi `GET /recipes/search?q=...&categoryId=...&page=...`.
- Trang chủ tải danh mục từ `GET /categories` và sáu công thức Published mới nhất từ `GET /recipes`, có cache/revalidate 300 giây; lỗi API được hiển thị rõ theo từng khu vực.
- `/categories` tải danh sách danh mục từ `GET /categories`, hiển thị ảnh/miêu tả khi có. Liên kết danh mục dẫn tới `/search?categoryId=...`.
- `/recipes` tải danh sách từ backend; hỗ trợ lọc theo danh mục, độ khó, thời gian nấu và phân trang.

## 4. Luồng dữ liệu frontend ↔ backend

| Luồng | Điểm vào frontend | API/backend | Ghi chú |
|---|---|---|---|
| Đăng ký/đăng nhập | `/register`, `/login` | `/auth/register`, `/auth/login`, `/auth/google` | Credentials/Google qua Auth.js |
| Xác nhận email | Email job | `/auth/confirm-email` | SMTP qua Hangfire; chưa bắt buộc trước login |
| Refresh/logout | Auth.js callbacks/events | `/auth/refresh`, `/auth/logout` | Refresh token rotation; lỗi refresh kết thúc session |
| Hồ sơ | `/account` | `/auth/me` GET/PATCH | Yêu cầu session |
| Danh sách quản lý | `/dashboard/recipes` | `/recipes?mine=true` | Status filter + pagination |
| Tạo/sửa | wizard dashboard | recipes, ingredients, steps | Sửa có ETag/`If-Match` |
| Search | `/search?q=...&categoryId=...` | `/recipes/search` | PostgreSQL `simple` FTS + fuzzy; category filter và page |
| Danh sách công khai | `/recipes` | `/recipes` | CategoryId, difficulty, cook-time filters |
| Detail/preview | `/recipes/[slug]` | `/recipes/{slug}` | Public cache; fallback authenticated cho preview |
| Upload ảnh | Detail/editor image UI | recipe image endpoints | Backend lưu metadata và object/file |

API client dùng prefix `/api/v1`, gắn access token cho request xác thực, giải mã ProblemDetails và phân biệt lỗi HTTP với lỗi mạng.

## 5. Lỗi, giới hạn và chức năng chưa hoàn chỉnh đã rà soát

Các mục dưới đây được xác nhận từ log người dùng gửi hoặc đối chiếu trực tiếp mã nguồn. Đây là danh sách phát hiện trong lần rà soát này, không phải cam kết rằng mọi lỗi có thể có đã được loại trừ.

### 5.1 Lỗi chạy được thấy trong terminal

| Mức ảnh hưởng | Phát hiện | Tác động / diễn giải |
|---|---|---|
| Chặn đăng nhập và session | Auth.js báo `MissingSecret`; `GET /api/auth/session` trả `500` và trình duyệt báo `ClientFetchError`. | `AUTH_SECRET` chưa được cấu hình. Trong workspace rà soát không có `frontend/.env.local` hay `frontend/.env`; `.env.example` để `AUTH_SECRET` trống. Các màn cần session, đăng nhập/đăng ký qua Auth.js, account và dashboard có thể lỗi hoặc không xác thực được. |
| Chặn dữ liệu từ backend | `ApiNetworkError` với `ECONNREFUSED` ở `GET /random`, stack trỏ tới `RandomRecipePage` khi gọi `/recipes` và `/categories`. | Frontend không kết nối được API tại URL đang cấu hình (mặc định `http://localhost:5000`). Thường là backend chưa chạy hoặc URL/port không khớp. `/random` tải cả hai API bằng `Promise.all`, nên một request lỗi làm cả trang thất bại; status `200` của request trang trong log dev không chứng minh dữ liệu đã tải thành công. |
| Lỗi kéo theo | Nhiều `MissingSecret`, `GET /api/auth/session 500` và `ClientFetchError` lặp lại. | Các lỗi lặp là nhiều lần gọi session của Auth.js bị cùng một cấu hình thiếu secret chặn, không phải nhiều lỗi độc lập. |

### 5.2 Chức năng có giao diện nhưng chưa hoàn chỉnh

- **Google login:** luồng đã có ở frontend và backend, nhưng không bật mặc định. `.env.example` để trống `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` và đặt `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false`; backend cũng cần `Google:ClientId`. Vì chưa có file env trong workspace, Google login hiện chưa sẵn sàng chạy. Cờ hiển thị nút và cấu hình provider là hai điều kiện riêng: bật cờ mà thiếu credentials vẫn không đăng ký provider.
- **Yêu thích / “Món đã lưu”:** tab trong dashboard chỉ hiển thị trạng thái rỗng tĩnh; chưa có thao tác lưu/bỏ lưu, API hay lưu trữ favorites.
- **Đổi / quên mật khẩu:** API đổi mật khẩu, quên mật khẩu và đặt lại mật khẩu chưa có trong backend hiện tại. “Quên mật khẩu?” trên login chỉ là chữ, không điều hướng; form đổi mật khẩu đã không còn trong account.
- **Ghi nhớ đăng nhập:** checkbox “Ghi nhớ tôi” trên login không có tên hoặc xử lý state; không thay đổi thời hạn session.
- **Newsletter:** form ở trang chủ dùng `action="#"`, input không có `name` và không nối API/dịch vụ gửi email; gửi form không đăng ký nhận thư.
- **Cài đặt tài khoản:** thông báo, ngôn ngữ và bảo mật đều ghi “Sắp có”, chưa có workflow hoặc lưu cấu hình.
- **Quản lý người dùng:** backend có endpoint Admin để đổi role, khóa/mở khóa và xóa tài khoản; trang Admin frontend hiện vẫn chỉ đọc/tìm/lọc danh sách nên chưa có UI gọi các thao tác này.
- **Xác nhận email:** hệ thống tạo email xác nhận và có endpoint xác nhận, nhưng đăng nhập backend không kiểm tra `EmailConfirmed`; tài khoản có thể đăng nhập trước khi xác nhận.
- **Đề xuất món ngẫu nhiên:** bộ chọn lấy tối đa 50 công thức mới nhất rồi chọn ngẫu nhiên trong tập đó, không đại diện cho toàn bộ công thức khi có hơn 50 món.

### 5.3 Vấn đề tích hợp / độ tin cậy cần lưu ý

- **Sitemap:** Hangfire sinh URL `/categories/{slug}`, nhưng frontend hiện chỉ có route `/categories`, không có trang chi tiết danh mục theo slug; các URL danh mục sinh ra sẽ không có route tương ứng. Job ghi `sitemap.xml` vào web root của backend, trong khi website chạy bằng Next.js riêng và không có route sitemap Next.js; cần xác minh cách public sitemap trên domain website trước khi dựa vào nó cho SEO.
- **Cấu hình API trong Docker:** chú thích `frontend/.env.example` gợi ý `API_URL=http://api:5000`; service API trong Docker Compose lắng nghe port `8080` bên trong container và chỉ publish thành `localhost:5000` trên host. Frontend chạy trong cùng Docker network phải dùng port nội bộ `8080`; nếu dùng ví dụ `api:5000` sẽ không kết nối được.
- **Không có frontend test suite trong repository;** backend hiện chỉ có 2 test và đều kiểm tra handler/validation của search. Chưa có kiểm thử tích hợp API/database, Auth/Google, UI hoặc end-to-end để xác nhận các luồng chính.
- `README.md` còn nội dung không khớp implementation hiện tại (ví dụ cấu trúc thư mục/API và mô tả Redis cache), nên không nên dùng riêng README làm nguồn chuẩn khi dựng hoặc đánh giá hệ thống.

## 6. Phân biệt phạm vi kiểm tra

- Log terminal ở mục 5.1 là bằng chứng runtime người dùng cung cấp; chúng xác nhận cấu hình Auth.js thiếu secret và frontend không kết nối được backend tại thời điểm chạy thử.
- Các mục 5.2–5.3 là rà soát tĩnh mã nguồn/cấu hình và thiếu endpoint/route; chưa chạy từng tích hợp với Google, SMTP, PostgreSQL, Redis hay MinIO trong môi trường thực tế.
- Các thay đổi endpoint và logging backend trong LAB 8 đã build thành công với 0 warning/0 error; 2 backend tests hiện có đều pass. Chưa chạy kiểm thử tích hợp các endpoints với PostgreSQL/Identity trong môi trường thực tế.
 