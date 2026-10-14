# CULINARY BLOG — PROJECT OVERVIEW

> Tóm tắt từ `SRS_Culinary_Blog_v1_0_0.pdf` (v1.0.0, Approved, 04/06/2026, IEEE 830 / ISO 29148) + đối chiếu với cây thư mục backend hiện tại (`tree.txt`, branch `feature/domain-repository-uow-api`).
> Mục đích: tài liệu tham chiếu nhanh cho đội phát triển để code/review/test đúng spec mà không phải đọc lại toàn bộ SRS.
> Quy ước: **[SRS]** = yêu cầu theo tài liệu; **[CODE]** = trạng thái repo hiện tại; **[⚠]** = mâu thuẫn/mơ hồ cần hỏi lại hoặc chọn một hướng và ghi chú rõ.

---

## 0. TL;DR

- **Sản phẩm**: Blog ẩm thực — người dùng chia sẻ/khám phá công thức nấu ăn. Full-stack, API-driven (Backend và Frontend là 2 hệ thống độc lập, giao tiếp qua REST/JSON).
- **Backend**: .NET 10 Minimal APIs (C#), Clean Architecture 4 tầng, EF Core 10 Code-First, PostgreSQL 16, ASP.NET Core Identity + JWT.
- **Frontend**: Next.js App Router + TypeScript, Tailwind, Auth.js v5, TanStack Query, React Hook Form + Zod.
- **Hạ tầng**: Redis 7 (cache), MinIO (S3, ảnh), Hangfire (background jobs, lưu trên PostgreSQL), Serilog + Seq, OpenTelemetry, Nginx, Docker Compose.
- **Quy mô kỳ vọng**: ≤ 10.000 recipe, ≤ 5.000 user, ≤ 50 category, single-server.
- **Ngôn ngữ nội dung**: tiếng Việt (FTS có `unaccent`, config `vietnamese`).
- **Phạm vi 1.0.0 KHÔNG gồm**: bình luận, rating, bookmark/favorite, real-time (SignalR), mobile native, thanh toán, nhắn tin, GraphQL.

---

## 1. Trạng thái repo hiện tại [CODE]

Solution gốc: `culinary-blog/backend/src`. Branch: `feature/domain-repository-uow-api`.

```
CulinaryBlog.API            Program.cs, appsettings*.json, *.http (Category, RecipeDetail, RecipeIngredients)
  Endpoints/                CategoriesEndpoints, RecipeEndpoints, RecipeIngredientEndpoints
  Middleware/               GlobalExceptionMiddleware
CulinaryBlog.Application    DependencyInjection.cs
  Categories/ Models/       CategoryDto, CreateCategoryRequest
              Services/     ICategoryService, CategoryService
  Common/ Exceptions/       AppException, ConcurrencyConflictException, ConflictException,
                            ForbiddenException, NotFoundException, UnauthorizedException, ValidationException
          Models/           PagedResult
  Recipes/ Models/          RecipeDto, RecipeRequests
           Services/        IRecipeService, RecipeService, IRecipeIngredientService, RecipeIngredientService
CulinaryBlog.Domain
  Common/                   BaseEntity, IRepository, IUnitOfWork
    Exceptions/             BusinessRuleViolationException, DomainException, ErrorCodes
  Modules/ Categories/      Category, ICategoryRepository
           Identity/        ApplicationUser, RefreshToken, IRefreshTokenRepository
           Recipes/         Recipe, RecipeStep, RecipeIngredient, RecipeImage, RecipeNutrition,
                            RecipeDifficulty, RecipeStatus, IRecipeRepository
CulinaryBlog.Infrastructure
  DependencyInjection.cs
  Jobs/                     PingJob
  Modules/ Categories/      CategoryConfiguration, CategoryRepository
           Identity/        ApplicationUserConfiguration, RefreshTokenConfiguration, RefreshTokenRepository
           Recipes/         RecipeConfiguration, RecipeImageConfiguration, RecipeIngredientConfiguration,
                            RecipeStepConfiguration, RecipeRepository
  Persistence/              CulinaryBlogDbContext, DesignTimeDbContextFactory, UnitOfWork,
                            Interceptors/AuditInterceptor,
                            Migrations/ (InitialCreate, AddRowVersionDefaults, ModelSnapshot) — 2026-09-22,
                            Seed/ (CategorySeeder, IdentitySeeder, RecipeSeeder, DbSeederRunner)
```

### Nhận định về mức độ hoàn thành (suy ra từ cây thư mục)

| Hạng mục | Trạng thái |
|---|---|
| Domain entities (Recipe aggregate, Category, ApplicationUser, RefreshToken) | Đã có |
| Repository interfaces + UoW (`IRepository`, `IUnitOfWork`, `I*Repository`) | Đã có |
| EF configurations, DbContext, AuditInterceptor, migrations, seeders | Đã có |
| Endpoints Categories, Recipes, RecipeIngredients | Đã có (nhánh hiện tại) |
| `GlobalExceptionMiddleware` + hệ exception Application/Domain | Đã có |
| **Auth endpoints** (register/login/google/refresh/logout/me) | **Chưa thấy** (chỉ có entity + `RefreshTokenRepository`) |
| Endpoints Recipe Steps, Recipe Images, Search | Chưa thấy file riêng |
| MinIO / file storage, Redis cache, Hangfire jobs thật (chỉ có `PingJob`), email, Serilog/OTel, rate limiting, health checks | Chưa thấy |
| Frontend | Ngoài `backend/src`, không có trong tree |

### [⚠] Khác biệt lớn giữa SRS và code

1. **SRS bắt buộc CQRS + MediatR** (CONS-002) với pipeline behaviors; **code hiện dùng Service pattern** (`ICategoryService`, `IRecipeService`, `IRecipeIngredientService`) — không có thư mục Commands/Queries/Handlers/Behaviors. → Đã chốt **giữ Service pattern**, không dùng MediatR (xem `DESIGN_DECISIONS.md` mục 20).
2. **SRS đặt module-first ở Domain** không rõ; code tổ chức theo `Modules/<Feature>` ở Domain/Infrastructure và `<Feature>/{Models,Services}` ở Application. **Giữ nguyên cấu trúc này** khi thêm code.
3. Validation: SRS yêu cầu FluentValidation qua pipeline (CONS-008); tree không có validators. Nếu chưa có FluentValidation, validation hiện đang nằm ở service/domain → xác nhận trước khi thêm.
4. Tên file DTO gộp (`RecipeRequests.cs`, `RecipeDto.cs`) — thêm DTO mới theo cùng convention.

---

## 2. Actors & phân quyền [SRS]

| Actor | Quyền |
|---|---|
| **Guest** | Xem recipe **Published**, danh mục, tìm kiếm. Không tạo/sửa/xóa. |
| **Author** (role mặc định sau đăng ký) | + CRUD recipe **của mình**, upload ảnh, quản lý steps/ingredients, publish/archive recipe của mình, thấy Draft/Archived của mình. |
| **Admin** (gán thủ công qua seeding) | + CRUD category, sửa/xóa recipe của bất kỳ ai, thấy mọi trạng thái, truy cập `/hangfire`, xem logs. Bypass ownership check. |

Ba tầng phân quyền:
1. **Role-based**: Guest/Author/Admin (policy `"AuthorPolicy"`, `"AdminPolicy"` — không hardcode chuỗi role).
2. **Resource-based**: `recipe.AuthorId == currentUserId` (qua `IAuthorizationService` + `RecipeAuthorizationHandler`, operation `Update`/`Delete`...). Admin bypass.
3. **Policy-based**: `"VerifiedAuthor"` yêu cầu email đã xác nhận.

Phân quyền phải kiểm tra ở **Application layer**, không chỉ ở Presentation.

---

## 3. Kiến trúc [SRS]

### 3.1 Clean Architecture — dependency rule

```
API (Presentation) ──► Application ──► Domain
Infrastructure ──────► Application ──► Domain      (Infra implements interfaces)
```
- **Domain**: không phụ thuộc gì (chỉ BCL; SRS cho phép tối đa FluentValidation). Chứa entities, owned entity (`RecipeNutrition`), enums, value objects (Slug, EmailAddress — optional), repository interfaces, domain exceptions, domain events (optional: `RecipePublishedEvent`).
- **Application**: chỉ reference Domain. DTO, service interfaces (`IEmailService`, `IJwtService`, `IFileStorageService`, `ICurrentUser`), validators, logic nghiệp vụ. **Không reference Infrastructure.**
- **Infrastructure**: EF Core DbContext/configs/migrations/repositories, `JwtService`, `MinioFileStorageService` (AWSSDK.S3), `MailKitEmailService`, `RedisCacheService`, Hangfire registrations, `AuditInterceptor`.
- **API**: Minimal API endpoint groups (không MVC Controllers), middleware (`GlobalExceptionMiddleware`, `CorrelationIdMiddleware`, rate limiting), DI (`AddApplication`, `AddInfrastructure`, `AddPresentation`), Scalar UI tại `/scalar`.
- Vi phạm dependency được bắt bằng ArchUnit.NET / architecture tests.

### 3.2 CQRS + MediatR (theo SRS — xem [⚠] §1)

Thứ tự pipeline: `LoggingBehavior` (cảnh báo >500ms) → `ValidationBehavior` (FluentValidation) → `CachingBehavior` (query implements `ICacheable`) → Handler → `CacheInvalidationBehavior` (command implements `ICacheInvalidator`). Commands đổi state, Queries chỉ đọc — không trộn.

### 3.3 Frontend routes [SRS]

| Route | Render | Auth |
|---|---|---|
| `/` | ISR (revalidate=3600) | Không |
| `/recipes` | SSR | Không |
| `/recipes/[slug]` | ISR (300) + JSON-LD | Không |
| `/categories` | ISR (3600) | Không |
| `/categories/[slug]` | ISR (600) | Không |
| `/auth/login`, `/auth/register` | CSR | Không (redirect nếu đã login) |
| `/dashboard`, `/dashboard/recipes`, `/dashboard/recipes/new` (wizard), `/dashboard/recipes/[id]/edit` | CSR | Author/Admin (edit: Owner/Admin) |
| `/dashboard/categories` | CSR | Admin |
| `/profile` | CSR | Bắt buộc |
| `/search` | SSR | Không |

### 3.4 Triển khai (Docker Compose)

| Service | Image | Port |
|---|---|---|
| nginx | nginx:alpine | 80, 443 |
| api | culinaryblog-api | 5000→8080 |
| frontend | culinaryblog-web | 3000 |
| postgres | postgres:16-alpine | 5432 (volume `pgdata`) |
| redis | redis:7-alpine (`--appendonly yes`) | 6379 |
| minio | minio/minio | 9000, 9001 (console) |
| seq, mailhog | dev only | 5341→80, 8025/1025 |

Dev: `docker-compose.yml`; prod: `docker-compose.prod.yml` (`.env.production`). Dockerfile multi-stage (SDK → aspnet:10.0). Dev base URL `http://localhost:5000/api/v1`; prod `https://api.culinaryblog.com/api/v1`.

---

## 4. Ràng buộc bắt buộc (CONS) [SRS]

| Mã | Ràng buộc |
|---|---|
| CONS-001 | Clean Architecture 4 tầng; Domain không phụ thuộc thư viện ngoài |
| CONS-002 | CQRS + MediatR cho Application (xem [⚠]) |
| CONS-003 | Backend Minimal APIs (không Controllers); Frontend App Router (không Pages Router) |
| CONS-004 | JWT stateless: access 15 phút, refresh 7 ngày; password hash PBKDF2 qua Identity |
| CONS-005 | RESTful; lỗi theo RFC 7807 `application/problem+json`; versioning `/api/v1/` |
| CONS-006 | PostgreSQL duy nhất; EF Core Code-First migrations; không raw SQL (nếu có thì parameterized) |
| CONS-007 | Upload ≤ 5 MB; chỉ `image/jpeg`, `image/png`, `image/webp`, `image/avif`; kiểm tra MIME thực (magic bytes) |
| CONS-008 | Validation bằng FluentValidation + pipeline; **không validate trong endpoint handler** |
| CONS-009 | Docker hóa; Dockerfile multi-stage; Compose cho local |
| CONS-010 | Serilog bắt buộc; mọi log có `CorrelationId`, `RequestPath`, `UserId` (khi đã auth) |

---

## 5. Domain model [SRS §6.4, §7]

### 5.1 BaseEntity (mọi entity kế thừa)
`Id` (uuid, default `gen_random_uuid()`), `CreatedAt` (timestamptz, set bởi `AuditInterceptor`), `UpdatedAt` (nullable), `IsDeleted` (bool, **global query filter** `!IsDeleted`), `RowVersion` (bytea, `[Timestamp]`, concurrency token).

> Ngoại lệ: `RefreshToken` có cột riêng (không có IsDeleted/RowVersion trong đặc tả); `ApplicationUser` kế thừa `IdentityUser<string>` (Id varchar(450)).

### 5.2 Quan hệ
- `Category 1—N Recipe` (**ON DELETE RESTRICT**)
- `ApplicationUser 1—N Recipe` (Author, FK `AuthorId` varchar(450))
- `Recipe 1—N RecipeStep | RecipeIngredient | RecipeImage` (**CASCADE**)
- `Recipe 1—1 RecipeNutrition` (**Owned**, cột `Nutrition_*` trong bảng `Recipes`)
- `ApplicationUser 1—N RefreshToken` (CASCADE)

### 5.3 Recipe (aggregate root)
| Cột | Kiểu / ràng buộc |
|---|---|
| Title | varchar(200) NOT NULL (không unique) |
| Slug | varchar(220) NOT NULL **UNIQUE**; sinh từ Title (lowercase, bỏ dấu, `-`); **không đổi sau Publish** |
| Description | text NOT NULL (≤ 2000 ký tự) |
| Instructions | text NOT NULL (markdown, legacy; chi tiết dùng Steps) |
| PrepTime | int NOT NULL CHECK > 0 (phút) |
| CookTime | int NOT NULL CHECK >= 0 (0 = no-cook) |
| Servings | int NOT NULL CHECK > 0 |
| Difficulty | smallint enum: 1=Easy, 2=Medium, 3=Hard, 4=Expert (default 1) |
| Status | smallint enum: 0=Draft, 1=Published, 2=Archived (default 0) |
| CategoryId | uuid FK NOT NULL |
| AuthorId | varchar(450) FK NOT NULL |
| SearchVector | tsvector NULL, **GIN index**, cập nhật bằng PostgreSQL trigger khi Title/Description đổi, dùng `unaccent` |
| PublishedAt | timestamptz NULL, set khi chuyển Published |
| Index | Slug (unique B-tree), Difficulty, Status, CategoryId, AuthorId, PublishedAt, IsDeleted (partial), Title (GIN trigram – optional) |

**RecipeNutrition (owned)**: `Nutrition_Calories`, `_Protein`, `_Carbohydrates`, `_Fat`, `_Fiber` (decimal(8,2)? — kcal/gram per serving), `_Sodium` (decimal(8,2)?, mg). Tất cả nullable.

### 5.4 Các entity con
- **RecipeStep**: `RecipeId`, `StepNumber` (int >0, **unique cùng RecipeId**), `Title` varchar(200), `Description` text, `TimerMinutes` int? (>=0), `ImageUrl` varchar(500)?.
- **RecipeIngredient**: `RecipeId`, `Name` varchar(200), `Quantity` decimal(10,3)?, `Unit` varchar(50)?, `Notes` varchar(500)?, `OrderIndex` int default 0.
- **RecipeImage**: `RecipeId`, `OriginalUrl` varchar(500) NOT NULL, `MediumUrl` (800×600)?, `ThumbnailUrl` (300×300)?, `AltText` varchar(200)?, `IsPrimary` bool (tối đa 1/recipe), `OrderIndex`.
- **Category**: `Name` varchar(100) UNIQUE, `Slug` varchar(120) UNIQUE (index), `Description` text?, `ImageUrl` varchar(500)?, `OrderIndex` int.
- **ApplicationUser** (bảng `AspNetUsers`): thêm `DisplayName` varchar(100) NOT NULL, `AvatarUrl`?, `Bio` text?, `IsActive` bool default true (admin ban), `CreatedAt`. Giữ các cột Identity chuẩn (Email, PasswordHash, LockoutEnd, AccessFailedCount...).
- **RefreshToken**: `Id` uuid, `UserId` FK, `TokenHash` varchar(64) **UNIQUE** (SHA-256, không lưu raw), `ExpiresAt`, `RevokedAt`?, `ReplacedByTokenHash`?, `CreatedAt`, `CreatedByIp` varchar(45)?.

### 5.5 Business rules (domain)
- Publish **yêu cầu ≥ 1 Step** (`recipe.Publish()` ném `DomainException` nếu `Steps.Count == 0`). Phụ lục B còn nói "≥ 1 ingredient và 1 step" ([⚠] xem §12).
- Tạo recipe → luôn `Draft`. Publish/Unpublish idempotent (đã đúng trạng thái → 200).
- Xóa Step → **renumber** StepNumber liên tục (1,2,3…). Thêm Step: `StepNumber = max + 1`.
- Ảnh đầu tiên tự `IsPrimary = true`; set primary → các ảnh khác false; xóa ảnh primary còn ảnh khác → tự chọn ảnh đầu còn lại làm primary.
- Category: **không xóa được nếu còn recipe** (kể cả Draft). Đổi tên category **không đổi slug**.
- Slug trùng → thêm hậu tố `-2`, `-3`… (category/recipe); xem [⚠] về 409 vs auto-suffix.
- Email/UserName **không đổi** qua `PATCH /auth/me`.
- Concurrency: `RowVersion` (ETag/`If-Match`) khi PUT recipe; mismatch → `ConcurrencyConflictException`.

---

## 6. Yêu cầu chức năng (27 FR, 7 module) [SRS §3]

Ưu tiên MoSCoW: **M** Must, **S** Should.

### 6.1 FR-AUTH (7)
| FR | Endpoint | Ưu tiên | Điểm chính |
|---|---|---|---|
| 001 Register | `POST /auth/register` | M | Validate (fullName, email, userName, password ≥8: hoa+thường+số+đặc biệt) → check email → `ApplicationUser.Create` → `CreateAsync` (PBKDF2) → role **Author** → sinh access+refresh token (auto-login) → lưu refresh → enqueue `WelcomeEmailJob` → **201** `AuthResponseDto`. Lỗi: 409 email tồn tại; 422 validation. |
| 002 Login | `POST /auth/login` | M | `FindByEmail` → `CheckPassword` → check lockout → token mới. Sai: **401** generic ("Email hoặc mật khẩu không đúng", chống user enumeration). **Lockout 5 lần sai → khóa 15 phút → 423 Locked**. Thành công → `ResetAccessFailedCount`. |
| 003 Google | `POST /auth/google` | S | OAuth 2.0 Auth Code + PKCE (Auth.js v5 phía FE). User mới → tạo từ Google profile, role Author, `AddLoginAsync`; email đã tồn tại → link login. Lỗi: 401/400/502. |
| 004 Refresh | `POST /auth/refresh` | M | **Token rotation bắt buộc**: token cũ `Revoked`, set `ReplacedBy...`, cấp cặp mới. Token đã revoke bị dùng lại → 401 + log SECURITY ALERT (+ revoke cả family). User bị xóa/khóa → 401. |
| 005 Logout | `POST /auth/logout` | M | Bearer + body `{refreshToken}` → revoke → **204**; idempotent (không tìm thấy vẫn 204). |
| 006 Me | `GET /auth/me` | S | Từ JWT claim → `UserProfileDto` (không trả PasswordHash/SecurityStamp). 404 nếu user đã bị xóa. |
| 007 Update me | `PATCH /auth/me` | S | Chỉ FullName/DisplayName, AvatarUrl (và Bio theo §8). fullName 2–100 ký tự, avatar là URL hợp lệ. |

### 6.2 FR-CAT (5)
| FR | Endpoint | Auth | Điểm chính |
|---|---|---|---|
| 001 List | `GET /categories` | Public (M) | Kèm `recipeCount` (chỉ Published), sort Name ASC, **cache key `categories:all`** |
| 002 Detail | `GET /categories/{slug}?page&pageSize` | Public (M) | Category + `PagedResult<RecipeSummaryDto>` (Published; Author thấy thêm Draft của mình). 404 slug sai |
| 003 Create | `POST /categories` | Admin (M) | name 2–50, không HTML; slugify (bỏ dấu); trùng slug → hậu tố số; invalidate cache; **201 + Location** |
| 004 Update | `PUT /categories/{id:guid}` | Admin (M) | Đổi Name/Description (+ImageUrl/OrderIndex theo §8), **slug giữ nguyên** |
| 005 Delete | `DELETE /categories/{id:guid}` | Admin (S) | Còn recipe → **409** `CATEGORY_DELETE_HAS_RECIPES`; thành công 204 |

### 6.3 FR-RCP (10)
| FR | Endpoint | Auth | Điểm chính |
|---|---|---|---|
| 001 List | `GET /recipes` | Public (M) | Filter `categoryId`, `difficulty`, `maxCookTime`, `minServings`; sort `sort=-createdAt` (mặc định), `title`, `-cookTime`…; page default 1, pageSize default 12 max 50. Guest chỉ Published; Author: Published ∪ (Draft/Archived của mình); Admin: tất cả. COUNT trước phân trang. `categoryId` không tồn tại → 200 rỗng. Output Cache policy `RecipeList` |
| 002 Detail | `GET /recipes/{slug}` | Public; Draft/Archived: owner/Admin (M) | Eager load Steps (order StepNumber), Ingredients (order), Images, Category, Author, Nutrition. 404 / 403. Output cache tag `recipes`, `recipe:{slug}` |
| 003 Create | `POST /recipes` | Author/Admin (M) | Body: title (5–200), description, categoryId, prepTimeMinutes, cookTimeMinutes, servings, difficulty, instructions?, nutrition?, steps?[], ingredients?[]. Status=Draft, slug auto. 201 `RecipeDto`. 422 category sai; 409 slug trùng |
| 004 Update | `PUT /recipes/{id:guid}` | Owner/Admin (M) | Resource-based auth + RowVersion (`If-Match`). 403 / 404 / 409 concurrency. Evict cache tag |
| 005 Publish | `PATCH /recipes/{id}/publish` · `/unpublish` | Owner/Admin (M) | Domain method; thiếu Step → 422/400; idempotent |
| 006 Archive | `PATCH /recipes/{id}/archive` | Owner/Admin (S) | Ẩn khỏi public, không xóa |
| 007 Delete | `DELETE /recipes/{id:guid}` | Owner/Admin (M) | Cascade Steps/Ingredients/Images; xóa file MinIO **async qua Hangfire**; evict cache; 204 |
| 008 Images | `POST /recipes/{id}/images` · `PATCH .../images/{imgId}/primary` · `DELETE .../images/{imgId}` | Owner/Admin (M) | multipart field `file`; validate MIME + size + **magic bytes** (JPEG `FF D8 FF`, PNG `89 50 4E 47`); path `recipes/{recipeId}/{guid}.{ext}`; 201 `{url,isPrimary}`; MinIO down → 503 |
| 009 Ingredients | `POST/PUT/DELETE /recipes/{id}/ingredients/{ingId?}` | Owner/Admin (M) | name 1–100(SRS)/200(DB), quantity > 0, unit không rỗng, notes?, sortOrder/orderIndex? |
| 010 Steps | `POST/PUT/DELETE /recipes/{id}/steps/{stepId?}` | Owner/Admin (M) | description ≤ 2000; auto StepNumber; delete → renumber |

### 6.4 FR-SRCH (4)
- **001 Full-text search** `GET /recipes/search?q=&page=&pageSize=`: `q` ≥ 2 ký tự (else 422); build tsquery dạng prefix `pho:* & bo:*`; `EF.Functions.ToTsQuery("vietnamese", ...)` trên `SearchVector`; xếp hạng `ts_rank` DESC; **chỉ Published**; trả `PagedResult<RecipeSummaryDto>` + `relevanceScore`; hỗ trợ không dấu ("pho" → "phở"); cache ngắn (1–5 phút) hoặc không cache; sanitize tsquery.
- **002 Filter / 003 Sort / 004 Pagination** đã gộp vào FR-RCP-001 (AND logic; offset-based SKIP/TAKE; response có `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`).

### 6.5 FR-FILE (2)
- `IFileStorageService.UploadAsync(IFormFile, folder, ct) → publicUrl` — tên `{folder}/{Guid}{ext}` (chống path traversal), giữ MIME, bucket `culinary-blog`, policy public-read.
- `DeleteAsync(fileUrl, ct)` — idempotent (không có object → không throw); lỗi kết nối → Hangfire retry tối đa 3.
- Abstraction để swap MinIO ↔ S3 ↔ local FS (local FS chỉ dev).

### 6.6 FR-JOB (3) — Hangfire in-process, storage PostgreSQL, dashboard `/hangfire` (Admin)
| Job | Loại | Trigger | Retry |
|---|---|---|---|
| WelcomeEmailJob | Fire-and-forget | Sau register | 3 lần, backoff 1/5/30 phút → Failed + log |
| Image Resize/Thumbnail | Fire-and-forget | Sau upload ảnh | 3 lần; fail thì ảnh gốc vẫn hiển thị. Tạo 300×300 + 800×600, cập nhật URL DB |
| Sitemap Generation | Recurring | cron `0 2 * * *` UTC | 2 lần; gồm Published recipes + categories + trang tĩnh; upload MinIO/wwwroot; ping Google Search Console |

### 6.7 FR-OBS (3)
- **Health**: `GET /health` (DB+Redis+MinIO, 200/503), `/health/live` (luôn Healthy), `/health/ready` (DB+Redis; fail → 503).
- **Logging**: Serilog (Console JSON, File rolling daily, Seq dev); `CorrelationIdMiddleware` (`X-Correlation-ID`, sinh nếu thiếu, trả lại trong response); level Debug(dev)/Information(prod).
- **Tracing/Metrics**: OpenTelemetry (ASP.NET, HttpClient, EF Core), OTLP → Seq (dev) / Jaeger-Tempo (prod); business metrics (recipe created/published); `TraceId` nằm trong log.

---

## 7. REST API — quy ước [SRS §5.2, §8]

- Prefix `/api/v1`; JSON `application/json; charset=utf-8`; upload `multipart/form-data`.
- Auth: `Authorization: Bearer <access_token>`; **refresh token nằm trong body** (không cookie, tránh CSRF).
- **Lỗi**: RFC 7807 `{ type, title, status, detail, errors:{field:[msg]} }`; `type` chứa **Application Error Code** (SCREAMING_SNAKE_CASE) — FE xử lý theo code, không theo message.
- **Success wrapper** (Ch.5/8): `{ "data": ..., "meta": { page, pageSize, total, totalPages } }` — nhưng FR-RCP-001 lại mô tả `PagedResult` phẳng → xem [⚠] §12.
- Pagination chuẩn: `?page=1&pageSize=10&sortBy=createdAt&sortOrder=desc` (Ch.8) vs `sort=-createdAt` (FR-SRCH-003) → [⚠].
- Rate-limit headers: `X-RateLimit-Limit/Remaining/Reset`, `Retry-After` (429).
- CORS: origin whitelist từ appsettings (không `*`); methods GET/POST/PUT/PATCH/DELETE/OPTIONS; headers `Content-Type, Authorization, X-Correlation-ID`.
- Versioning URL path; v1 duy trì ≥ 6 tháng khi có v2.

### Bảng endpoint tổng hợp

| Nhóm | Method | Path | Auth |
|---|---|---|---|
| Auth | POST | `/auth/register` `/auth/login` `/auth/google` `/auth/refresh` | – |
| Auth | POST | `/auth/logout` | Bearer |
| Auth | GET/PATCH | `/auth/me` | Bearer |
| Category | GET | `/categories`, `/categories/{slug}` | – |
| Category | POST / PUT / DELETE | `/categories`, `/categories/{id}` | Admin |
| Recipe | GET | `/recipes`, `/recipes/{slug}`, `/recipes/search` | – (Draft: owner/Admin) |
| Recipe | POST | `/recipes` | Author/Admin |
| Recipe | PUT / DELETE | `/recipes/{id}` | Owner/Admin |
| Recipe | PATCH | `/recipes/{id}/publish` `/unpublish` `/archive` | Owner/Admin |
| Image | POST | `/recipes/{id}/images` | Owner/Admin |
| Image | PATCH / DELETE | `/recipes/{id}/images/{imageId}` (+ `/primary` ở FR-RCP-008) | Owner/Admin |
| Step | POST / PUT / DELETE | `/recipes/{id}/steps[/{stepId}]` | Owner/Admin |
| Ingredient | POST / PUT / DELETE | `/recipes/{id}/ingredients[/{ingId}]` | Owner/Admin |
| Health | GET | `/health`, `/health/live`, `/health/ready` | – |

### HTTP status & Error codes (Phụ lục A, B)
`200 201 204 400 401 403 404 409 422 423 429 500 503` (+502 cho Google API down).

Error codes: `AUTH_EMAIL_EXISTS`(409), `AUTH_INVALID_CREDENTIALS`(401), `AUTH_TOKEN_EXPIRED`(401), `AUTH_TOKEN_INVALID`(401), `AUTH_REFRESH_TOKEN_EXPIRED`(401), `AUTH_REFRESH_TOKEN_REVOKED`(401), `AUTH_GOOGLE_TOKEN_INVALID`(400), `AUTH_ACCOUNT_DISABLED`(403), `RECIPE_NOT_FOUND`(404), `RECIPE_SLUG_EXISTS`(409), `RECIPE_PUBLISH_INCOMPLETE`(400), `RECIPE_FORBIDDEN`(403), `RECIPE_CONCURRENCY_CONFLICT`(422), `CATEGORY_NOT_FOUND`(404), `CATEGORY_NAME_EXISTS`(409), `CATEGORY_DELETE_HAS_RECIPES`(409), `FILE_SIZE_EXCEEDED`(400), `FILE_MIME_INVALID`(400), `VALIDATION_ERROR`(400), `RATE_LIMIT_EXCEEDED`(429).

> [CODE] `Domain/Common/Exceptions/ErrorCodes.cs` là nơi tập trung mã lỗi — thêm/đối chiếu ở đó. Exception → HTTP mapping nằm ở `GlobalExceptionMiddleware`: `NotFoundException→404`, `ConflictException→409`, `ConcurrencyConflictException→409/422`, `ForbiddenException→403`, `UnauthorizedException→401`, `ValidationException→400/422`, `BusinessRuleViolationException/DomainException→400/422`, còn lại → 500 (không lộ stack trace).

---

## 8. Yêu cầu phi chức năng (NFR) — rút gọn có số liệu

**Hiệu năng**: API p50 ≤ 150ms (GET cache), p95 ≤ 500ms, p99 ≤ 1000ms; ≥ 100 concurrent users trên 2 vCPU/4GB; cache hit ≥ 80%; **không N+1** (`Include/ThenInclude`/projection); mọi cột WHERE/ORDER BY có B-tree index; cảnh báo query > 100ms; FE Core Web Vitals: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms, First Load JS ≤ 200KB gzip.

**Bảo mật (OWASP Top 10 2021)**:
- Password: PBKDF2-HMACSHA512 ≥100.000 iterations; ≥8 ký tự, hoa+thường+số+đặc biệt.
- JWT: HS256, 15 phút, claims `userId, email, roles, jti`. Refresh: random bytes, **SHA-256 hash trước khi lưu**, 7 ngày, rotation + reuse detection (revoke cả family).
- Rate limit theo IP: `/auth/*` 10 req/phút; chung 100/phút; upload 5/phút → 429 + `Retry-After`.
- Validate input ở Application layer trước xử lý; XSS: sanitize + CSP header; file: magic bytes, kiểm tra size trước khi buffer, tên file GUID.
- HTTPS TLS 1.2+, HSTS (max-age=31536000), CORS whitelist; cookie (nếu có) `SameSite=Strict; Secure`.
- Secrets: User Secrets (dev), env vars (prod), không commit secrets, rotate JWT key ~90 ngày, gitleaks/truffleHog pre-commit.
- Audit: log mọi write op với userId + timestamp.

**Usability**: responsive (mobile 320–767, tablet 768–1199, desktop ≥1200; Tailwind), WCAG 2.1 AA (semantic HTML, ARIA, keyboard, contrast 4.5:1), error message actionable + i18n-ready bằng error code, loading skeleton/optimistic update/toast/progress bar upload.

**Reliability**: uptime ≥ 99.5%; global exception handler; Redis down → fallback DB (không throw); Hangfire retry ≤3 exponential backoff; refresh token lưu DB (không Redis); backup `pg_dump` 03:00 hằng ngày giữ 30 ngày; MinIO volume persistent.

**Maintainability**: SonarAnalyzer/StyleCop/EditorConfig; ESLint (Airbnb) + Prettier; 0 compiler warning; ≥1 reviewer; unit ≥ 80% (Application layer), integration: mọi endpoint ≥ 1 happy + 1 error, E2E 5 flow (register, login, create recipe, publish, search) — xUnit, Jest+Testing Library, Playwright; README setup < 5 phút; Scalar `/scalar`; ADR; CHANGELOG (Keep a Changelog + SemVer).

**Scalability**: API stateless; **Redis distributed cache (không IMemoryCache)**; RedLock cho singleton job (sitemap); Npgsql pool max 100; GIN cho FTS; Nginx upstream pool; MinIO distributed mode; CDN cho `_next/static`.

**SEO**: JSON-LD `Recipe` (name, description, image, author, datePublished, prepTime, cookTime, totalTime, recipeYield, recipeIngredient[], recipeInstructions[], nutrition) pass Rich Results Test; `<title>` "{Recipe} | Culinary Blog" ≤ 60 ký tự; meta description 150–160; Open Graph (1200×630) + Twitter `summary_large_image`; canonical; robots `index,follow` (Published) / `noindex` (Draft/Archived); sitemap.xml + robots.txt; URL `/recipes/{slug}`, `/categories/{slug}`; slug đổi (draft) → 301.

---

## 9. Cache — thiết kế (và các giá trị mâu thuẫn)

| Đối tượng | SRS FR | SRS NFR | Ghi chú |
|---|---|---|---|
| Category list | `IMemoryCache` key `categories:all`, TTL 60' sliding | Redis TTL 30' | [⚠] chọn Redis (NFR-SCALE bắt buộc distributed) |
| Recipe list | .NET Output Cache `RecipeList`, TTL 15', vary by query | — | tag `recipes` |
| Recipe detail | Output Cache, TTL 60', tag `recipes` + `recipe:{slug}` | Redis TTL 5' (cache-aside) | [⚠] |
| Search | không cache hoặc 5' | 1' | [⚠] |
| Invalidation | Event-driven: evict khi Create/Update/Delete (publish/archive/images/steps/ingredients cũng evict) | | |

---

## 10. Môi trường & phụ thuộc ngoài

- **Dev**: .NET 10 SDK, Node 20+ (npm 10+), Docker Desktop, VS2022 17.12+/Rider 2024+/VS Code C# Dev Kit, Git 2.40+. PostgreSQL/Redis/MinIO qua Compose. Seed dữ liệu bằng **Bogus**: 50 recipe + 5 author mẫu. Email dev: Mailhog.
- **Prod**: Ubuntu 22.04, Docker 24+/27, PostgreSQL 16 (extensions **`unaccent`, `pg_trgm` bắt buộc**), Redis 7.2 AOF, MinIO (bucket public-read cho ảnh), Nginx 1.24+. Tối thiểu 2 vCPU/4GB/20GB SSD.
- **Config/Secrets**: `GoogleClientId/Secret`, `MinIO__Endpoint/AccessKey/SecretKey/BucketName`, `Smtp__Host/Port/Username/Password`, `Seq__ServerUrl`, `OTEL_EXPORTER_OTLP_ENDPOINT`, Hangfire dùng chung ConnectionString PostgreSQL.
- **Degradation**: Google down → vẫn login email/password; MinIO down → không upload/xem ảnh (dev fallback local FS); Redis down → đọc DB; PostgreSQL down → readiness fail, Nginx 503; Hangfire down → job nền mất, core vẫn chạy.
- **Browser**: Chrome/Edge 90+, Firefox 88+, Safari 14+, iOS 14+; không IE.

---

## 11. Quy ước khi viết code (rút từ SRS — dùng làm checklist)

1. Đặt code đúng tầng; Domain không import package ngoài; Application không reference Infrastructure.
2. Mọi mutation đi qua `IUnitOfWork` (một transaction) và `SaveChangesAsync`.
3. Logic nghiệp vụ nằm trong **domain methods** (`Recipe.Create/Update/Publish/Unpublish/Archive/SetNutrition`, `RecipeStep.Create`, `RecipeIngredient.Create`, `Category.Create`, `ApplicationUser.Create`) — dùng factory method, setter private.
4. Không validate trong endpoint handler; dùng validator/service layer.
5. Ném exception có kiểu (`NotFoundException`, `ConflictException`, `ForbiddenException`, `ConcurrencyConflictException`, `DomainException`…) — để `GlobalExceptionMiddleware` map sang RFC 7807 kèm error code.
6. EF Core: global filter `!IsDeleted`, `AsNoTracking` cho query đọc, `Include` tường minh, không raw SQL với input người dùng, không N+1.
7. Ảnh: kiểm tra MIME + magic bytes + size trước khi upload; tên file GUID.
8. Sau mutation → invalidate cache liên quan (tag `recipes`, `recipe:{slug}`, `categories:all`).
9. Việc nặng/IO ngoài (xóa file MinIO, email, thumbnail) → Hangfire, không chặn HTTP response.
10. Log có `CorrelationId`, `RequestPath`, `UserId`; không log secret/password/token.
11. Mỗi endpoint mới: có test (≥1 happy + 1 error), XML doc cho Scalar, thêm vào file `.http` tương ứng.
12. Migration mới: dùng EF Code-First; nhớ SearchVector trigger + GIN index và extension `unaccent`/`pg_trgm` (migration thủ công `migrationBuilder.Sql`).

---

## 12. Mâu thuẫn trong SRS và quyết định đã chốt

SRS có 22 điểm mâu thuẫn/mơ hồ (mã HTTP, soft/hard delete, điều kiện publish, cache, schema field, CQRS...). Tất cả đã được chốt tại [`DESIGN_DECISIONS.md`](./DESIGN_DECISIONS.md). **Khi SRS và `DESIGN_DECISIONS.md` khác nhau, theo `DESIGN_DECISIONS.md`.** Các mục đánh dấu [⚠] ở trên chỉ là điểm đánh dấu; xem file đó để biết kết luận.

Một số quyết định ảnh hưởng nhiều nhất:

- Validation → **422**; concurrency conflict → **409**.
- Recipe dùng **soft delete**; publish chỉ cần **≥ 1 Step**; slug trùng → **tự thêm hậu tố**.
- Cache dùng **Redis**; response không wrapper (`PagedResult` phẳng); sort theo `sort=-field`.
- **Giữ Service pattern**, không dùng MediatR/CQRS.

---

## 13. Gợi ý thứ tự triển khai tiếp theo (dựa trên [CODE] hiện tại)

1. Rà `ErrorCodes`, `GlobalExceptionMiddleware` khớp RFC 7807 + bảng error code §7.
2. Hoàn thiện Recipes: list (filter/sort/paging + quyền theo role) → detail → create/update (RowVersion) → publish/unpublish/archive → delete.
3. Steps & Images endpoints (+ `IFileStorageService`/MinIO, magic-bytes validator).
4. **Auth module** (Identity + JWT + refresh rotation + lockout) → rồi áp `RequireAuthorization`/policy + `RecipeAuthorizationHandler` + `ICurrentUser` thay cho placeholder hiện có.
5. FTS: migration thêm `SearchVector` + trigger + GIN + extensions; `GET /recipes/search`.
6. Cache (Redis + Output Cache + invalidation), rate limiting, CorrelationId + Serilog, health checks.
7. Hangfire: WelcomeEmail, Image Resize, Sitemap; OpenTelemetry.
8. Test (unit ≥80% Application, integration mọi endpoint, architecture tests), Docker Compose, Nginx.
9. Frontend theo bảng route §3.3 (ISR/SSR, JSON-LD, OG tags).

---

## 14. Thuật ngữ nhanh

**AT/RT** access/refresh token · **Slug** chuỗi URL-friendly duy nhất · **Soft delete** `IsDeleted=true` · **Owned entity** nhúng cột vào bảng cha (`RecipeNutrition`) · **Rotation** dùng refresh xong thì revoke cái cũ · **Reuse detection** token đã revoke bị dùng lại → revoke cả family · **ISR** Incremental Static Regeneration · **FTS** Full-Text Search (tsvector/tsquery) · **UoW** Unit of Work · **AEC** Application Error Code (trong `type` của RFC 7807) · **MoSCoW** Must/Should/Could/Won't.