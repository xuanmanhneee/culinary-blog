# Culinary Blog - System Design Summary

> Mục đích: bản đồ ngắn gọn giúp thành viên nắm toàn bộ hệ thống trước khi đọc chi tiết source.
>
> Trạng thái rà soát: 2026-10-20. Source đang checkout tại nhánh `2312686_lab05`; nhánh này đang đi trước `main` 4 commit tại thời điểm rà soát.

## 1. Mục tiêu hệ thống

Culinary Blog là ứng dụng web API-driven cho phép:

- Guest xem, lọc và tìm kiếm công thức đã xuất bản.
- Author đăng ký, đăng nhập và quản lý công thức của mình.
- Admin quản lý toàn bộ công thức và danh mục.
- Công thức chứa category, thông tin dinh dưỡng, nguyên liệu, các bước và hình ảnh.

Phạm vi SRS v1.0.0 không gồm comment, rating, bookmark, messaging, payment, mobile native hoặc GraphQL.

## 2. Kiến trúc tổng thể

```text
Browser
   |
   v
Next.js Frontend
   |
   | REST/JSON - /api/v1
   v
.NET Minimal API
   |
   +-- Application/Domain logic
   +-- PostgreSQL: dữ liệu nghiệp vụ, Identity, Hangfire
   +-- Redis: cache mục tiêu, hiện chưa cài đặt thật
   +-- MinIO: lưu ảnh
   +-- Hangfire: background jobs
```

Kiến trúc đích theo SRS là Client-Server, backend Clean Architecture 4 tầng, CQRS + MediatR, PostgreSQL, Redis và MinIO. Source hiện tại mới tuân thủ một phần: phần CRUD chính đang dùng Service pattern, còn CQRS/MediatR chỉ xuất hiện ở nhánh search/upload chưa được nối vào runtime.

## 3. Cấu trúc repository

```text
culinary-blog/
|-- backend/
|   |-- CulinaryBlog.slnx
|   `-- src/
|       |-- CulinaryBlog.Domain/
|       |-- CulinaryBlog.Application/
|       |-- CulinaryBlog.Infrastructure/
|       `-- CulinaryBlog.API/
|-- frontend/
|   `-- src/
|       |-- app/
|       |-- components/
|       |-- lib/api/
|       |-- lib/types/
|       `-- auth.ts
|-- docs/
|-- docker-compose.yml
`-- package.json
```

Các lệnh root:

```bash
pnpm dev:frontend
pnpm dev:backend
```

## 4. Backend - trách nhiệm từng tầng

### Domain

Nguồn chuẩn hiện tại nên là `CulinaryBlog.Domain/Modules/*`:

- `Modules/Identity`: `ApplicationUser`, `RefreshToken`, roles.
- `Modules/Categories`: `Category` và repository contract.
- `Modules/Recipes`: aggregate `Recipe`, images, ingredients, steps, nutrition và trạng thái.
- `Common`: `BaseEntity`, domain exceptions, Unit of Work contract.

`Recipe` là aggregate root. Các thao tác thêm/xóa step, ingredient, image và chuyển trạng thái nên đi qua aggregate này để giữ business rules.

### Application

Chứa use cases và DTO:

- `Auth/Services/AuthService`: register, login, refresh, logout, profile.
- `Categories/Services/CategoryService`: đọc và tạo category.
- `Recipes/Services/*`: CRUD recipe, ingredients, steps và image metadata.
- `Common/Exceptions`: lỗi ứng dụng được middleware đổi thành RFC 7807.
- `Common/Interfaces`: abstraction cho storage, cache và current user.

Hiện tại phần CRUD chính dùng service classes. Search và upload lại dùng MediatR handlers với model khác; đây là phần phải hợp nhất khi refactor.

### Infrastructure

- `Persistence/CulinaryBlogDbContext`: DbContext chính và nên là DbContext duy nhất của Core API.
- `Modules/*`: repository, JWT và Identity implementation.
- `Storage/MinioFileStorageService`: upload ảnh lên MinIO.
- `Persistence/Seed`: roles, users, categories và recipes mẫu.
- `Persistence/Migrations`: EF Core migrations.
- `Jobs/PingJob`: Hangfire job mẫu, chưa phải job nghiệp vụ hoàn chỉnh.

### API

- `Program.cs`: composition root, middleware và endpoint registration.
- `Endpoints/*`: Minimal API route groups.
- `GlobalExceptionMiddleware`: chuyển exception sang Problem Details.
- `Extensions/*`: JWT, CORS, versioning, rate limiting và OpenAPI.

Luồng request điển hình:

```text
HTTP request
 -> CORS / Rate limiter
 -> JWT authentication / authorization
 -> Minimal API endpoint
 -> Application service
 -> Repository / Domain aggregate
 -> UnitOfWork.SaveChanges
 -> DTO / RFC 7807 response
```

## 5. Domain và dữ liệu

```text
ApplicationUser 1 ---- N Recipe N ---- 1 Category
                              |
                              +---- N RecipeIngredient
                              +---- N RecipeStep
                              +---- N RecipeImage
                              `---- 1 RecipeNutrition (owned)

ApplicationUser 1 ---- N RefreshToken
```

Trạng thái Recipe:

```text
Draft <----> Published
  ^              |
  |              v
  +---------- Archived
```

Quy tắc quan trọng:

- Recipe mới luôn là `Draft`.
- Guest chỉ xem `Published`.
- Owner hoặc Admin mới được sửa/xóa/đổi trạng thái.
- Publish yêu cầu tối thiểu các dữ liệu mà business rule quy định.
- Update recipe dùng `RowVersion`/ETag để kiểm soát concurrent writes.
- Slug là định danh URL công khai và cần ổn định sau khi publish.

## 6. API hiện đang được map

Base path: `/api/v1`.

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /auth/me`

Google OAuth được SRS yêu cầu nhưng chưa được triển khai.

### Categories

- `GET /categories`
- `GET /categories/{slug}`
- `POST /categories` - Admin

Update/delete category chưa được triển khai.

### Recipes

- `GET /recipes`
- `GET /recipes/{slug}`
- `GET /recipes/{id}` - Owner/Admin
- `POST /recipes`
- `PUT /recipes/{id}`
- `PATCH /recipes/{id}/publish`
- `PATCH /recipes/{id}/unpublish`
- `PATCH /recipes/{id}/archive`
- `DELETE /recipes/{id}`
- CRUD ingredient và step qua nested routes.
- Set primary và delete image metadata qua nested routes.

Search và upload image có code nhưng endpoint group tương ứng đang không được map trong `Program.cs`. Không được xem hai chức năng này là hoàn thành.

### System

- `/health`, `/health/live`, `/health/ready`.
- `/scalar` và OpenAPI trong Development.
- `/hangfire`, hiện cần bổ sung bảo vệ Admin hoặc chỉ bật Development.

## 7. Authentication và authorization

```text
Login/Register
 -> ASP.NET Core Identity kiểm tra user/password
 -> JwtService cấp access token
 -> Refresh token được hash và lưu PostgreSQL
 -> Client gửi Authorization: Bearer <token>
```

- Access token: 15 phút.
- Refresh token: 7 ngày và có rotation.
- Role: `Author`, `Admin`.
- Endpoint kiểm tra role; Application layer kiểm tra ownership của Recipe.
- Frontend dùng Auth.js, nhưng hiện chưa tự refresh access token khi hết hạn.
- System roles phải được seed độc lập với demo data để register hoạt động trên database mới.

## 8. Frontend

Frontend dùng Next.js App Router, TypeScript, Tailwind và Auth.js.

Các lớp nên giữ tách biệt:

```text
app/          route, page và layout
components/   component dùng chung
features/     UI/use case theo module
lib/api/      HTTP client và endpoint adapters
lib/types/    API contracts
stores/       client-only state
mocks/        dữ liệu tĩnh trong giai đoạn thiết kế UI
```

Nguyên tắc:

- Component không gọi `fetch` trực tiếp.
- `lib/api` là nơi duy nhất biết URL và HTTP contract.
- Auth.js là nguồn sự thật cho session/token; không lưu một bản token khác trong Zustand.
- Zustand chỉ nên giữ UI state hoặc state cục bộ cần chia sẻ.
- Trong lúc backend refactor, UI dùng mocks và adapter để tránh phụ thuộc DTO chưa ổn định.

## 9. Hạ tầng hiện tại

`docker-compose.yml` hiện cung cấp:

- PostgreSQL.
- Redis.
- MinIO.
- Seq.
- Mailhog.

API, frontend và Nginx chưa được container hóa trong compose hiện tại dù SRS mô tả đầy đủ các service này.

Redis container tồn tại nhưng source mới có `LoggingCacheService`; chưa có distributed cache thật. Health check hiện mới kiểm tra database, chưa kiểm tra Redis/MinIO như mô tả.

## 10. Hướng microservice thử nghiệm

Giữ Core API gồm Auth, Categories và Recipe aggregate. Hai boundary phù hợp nhất:

```text
Core API
|-- HTTP/signed request --> Media Service --> MinIO
`-- Outbox events -------> Search Service --> PostgreSQL FTS
```

### Media Service

- Sở hữu upload, MIME validation, resize và object lifecycle.
- Không được truy cập trực tiếp bảng Recipes.
- Core API kiểm tra owner/Admin và lưu image metadata.

### Search Service

- Là read model, không phải nguồn sự thật của Recipe.
- Nhận event publish/update/unpublish/delete.
- Dùng PostgreSQL FTS để tiếp tục phù hợp SRS.
- Chấp nhận eventual consistency.

Không nên tách Auth, Categories, Ingredients hoặc Steps ở giai đoạn này.

## 11. Điểm xung đột phải giải quyết

1. Có hai bộ Recipe model:
   - Chuẩn: `Domain/Modules/Recipes`.
   - Trùng: `Domain/Recipes/Entities`.
2. Có hai DbContext:
   - Chuẩn: `CulinaryBlogDbContext`.
   - Trùng: `ApplicationDbContext` cho search/upload.
3. CRUD chính dùng Service pattern, search/upload dùng CQRS/MediatR.
4. README/SRS đang mô tả nhiều chức năng hơn runtime thực tế.
5. `main` chưa chứa toàn bộ thay đổi trên nhánh đang checkout.
6. Chưa có automated tests để bảo vệ quá trình hợp nhất.

## 12. Quy ước kiểm soát source cho nhóm

Mỗi module phải có một người chịu trách nhiệm cuối cùng và một nguồn sự thật:

| Phạm vi | Nguồn sự thật |
|---|---|
| Domain model | `CulinaryBlog.Domain/Modules/*` |
| Database schema | `CulinaryBlogDbContext` + migrations |
| API contract | OpenAPI của API đang chạy |
| Error contract | RFC 7807 + `ErrorCodes` |
| Frontend contract | Types sinh/đối chiếu từ OpenAPI |
| Quyết định kiến trúc | ADR trong `docs/adr/` |

Checklist trước khi merge:

- Không tạo entity/DTO/DbContext mới khi chưa kiểm tra nguồn chuẩn.
- Endpoint phải có authorization, validation và Problem Details thống nhất.
- Migration phải đi cùng thay đổi model.
- Cập nhật OpenAPI và tài liệu nếu contract thay đổi.
- Có test tối thiểu cho happy path và authorization/error path.
- Build, typecheck và lint phải xanh.
- Một reviewer kiểm tra boundary, không chỉ kiểm tra code chạy được.

## 13. Thứ tự refactor khuyến nghị

1. Chọn commit/branch chuẩn và đồng bộ `main`.
2. Hợp nhất Recipe về một model và một DbContext.
3. Chọn thống nhất CQRS/MediatR hoặc Service pattern theo quyết định của nhóm/SRS.
4. Chuyển search và upload sang model chuẩn.
5. Hoàn thiện role bootstrap, Auth refresh và bảo vệ Hangfire.
6. Chốt OpenAPI rồi tích hợp frontend.
7. Bổ sung unit/integration/E2E tests.
8. Sau khi Core API ổn định mới tách Media Service, rồi Search Service.
