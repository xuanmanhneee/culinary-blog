# 🍳 Culinary Blog

> Nền tảng web chia sẻ, khám phá và lưu trữ công thức nấu ăn — full-stack, kiến trúc API-driven.

[![.NET](https://img.shields.io/badge/.NET-10-512BD4)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-000000)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/status-Approved%20v1.0.0-brightgreen)]()

---

## 📖 Giới thiệu

**Culinary Blog** là một nền tảng web cho phép người dùng chia sẻ, khám phá và lưu trữ các công thức nấu ăn từ nhiều nền ẩm thực khác nhau. Hệ thống cung cấp:

- **Nền tảng chia sẻ công thức** — Tác giả (Author) đăng tải công thức với hình ảnh, danh sách nguyên liệu chi tiết, hướng dẫn từng bước và thông tin dinh dưỡng.
- **Tổ chức nội dung** — Phân loại theo danh mục (Category), độ khó, thời gian chuẩn bị/nấu.
- **Tìm kiếm thông minh** — Full-Text Search tiếng Việt bằng PostgreSQL `tsvector`/`tsquery` với extension `unaccent`.
- **Bảo mật đa lớp** — JWT stateless, phân quyền theo vai trò (RBAC), theo tài nguyên (resource-based) và theo policy.

Dự án được xây dựng theo tài liệu đặc tả **SRS** chuẩn IEEE 830 / ISO/IEC/IEEE 29148:2018 (phiên bản 1.0.0, đã duyệt).

---

## 🧱 Kiến trúc & Công nghệ

Hệ thống theo mô hình Client–Server, giao tiếp qua REST API. Backend tuân thủ **Clean Architecture** kết hợp **CQRS + MediatR**.

| Tầng | Công nghệ |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Auth.js v5, TanStack Query, React Hook Form + Zod |
| Backend | .NET 10 Minimal APIs, C#, MediatR (CQRS), FluentValidation |
| Database | PostgreSQL 16 (EF Core Code First, Full-Text Search) |
| Cache | Redis 7 |
| Object Storage | MinIO (S3-Compatible) |
| Reverse Proxy | Nginx |
| Observability | Serilog + Seq, OpenTelemetry (Grafana/Jaeger) |
| Background Jobs | Hangfire |
| Containerization | Docker / Docker Compose |

### Backend — Clean Architecture (4 tầng)

```
CulinaryBlog.Domain          # Entities, Value Objects, Enums — không phụ thuộc thư viện ngoài
CulinaryBlog.Application     # CQRS Commands/Queries, Handlers, DTOs, Validators, Pipeline Behaviors
CulinaryBlog.Infrastructure  # EF Core, Repository, JWT, MinIO, Email, Redis Cache
CulinaryBlog.API             # Minimal API Endpoints, Middleware, DI, OpenAPI (Scalar UI)
```

Mỗi request đi qua **MediatR Pipeline**: `Logging → Validation → Caching → Handler → Cache Invalidation`.

### Data Model (tóm tắt)

`Recipe` 1—N `RecipeStep`, `RecipeIngredient`, `RecipeImage` · 1—1 `RecipeNutrition` (owned) · N—1 `Category`, `ApplicationUser` (Author) · `ApplicationUser` 1—N `RefreshToken`

---

## 📁 Cấu trúc thư mục

```
culinary-blog/
├── src/                                # Backend — .NET 10, Clean Architecture
│   ├── CulinaryBlog.Domain/            # Nhân lõi — không phụ thuộc thư viện ngoài
│   │   ├── Entities/                   #   Recipe, Category, ApplicationUser, RecipeStep, ...
│   │   ├── ValueObjects/               #   Slug, EmailAddress
│   │   ├── Enums/                      #   RecipeDifficulty, RecipeStatus
│   │   ├── Events/                     #   RecipePublishedEvent
│   │   └── Interfaces/                 #   IRepository<T>, IRecipeRepository, ...
│   │
│   ├── CulinaryBlog.Application/       # Orchestration layer — CQRS
│   │   ├── Recipes/
│   │   │   ├── Commands/               #   CreateRecipeCommand, PublishRecipeCommand, ...
│   │   │   └── Queries/                #   GetRecipesQuery, GetRecipeBySlugQuery, ...
│   │   ├── Auth/                       #   LoginCommand, RegisterCommand, ...
│   │   ├── Categories/
│   │   ├── Common/
│   │   │   ├── Behaviors/              #   ValidationBehavior, CachingBehavior, LoggingBehavior, ...
│   │   │   └── DTOs/                   #   RecipeDto, UserDto, PagedResult<T>
│   │   └── Interfaces/                 #   IEmailService, IJwtService, IFileStorageService, ...
│   │
│   ├── CulinaryBlog.Infrastructure/    # Cài đặt các interface của Application
│   │   ├── Persistence/                #   CulinaryBlogDbContext, Migrations, Repositories
│   │   ├── Identity/                   #   JwtService, PBKDF2 hashing (ASP.NET Core Identity)
│   │   ├── Storage/                    #   MinioFileStorageService (AWSSDK.S3)
│   │   ├── Email/                      #   MailKitEmailService
│   │   ├── Caching/                    #   RedisCacheService
│   │   └── BackgroundJobs/             #   Hangfire job registrations
│   │
│   └── CulinaryBlog.API/               # Presentation layer — HTTP interface
│       ├── Endpoints/                  #   AuthEndpoints, RecipesEndpoints, CategoriesEndpoints
│       ├── Middleware/                 #   GlobalExceptionMiddleware, CorrelationIdMiddleware, ...
│       ├── Extensions/                 #   AddApplication, AddInfrastructure, AddPresentation
│       └── Program.cs
│
├── frontend/                                 # Frontend — Next.js App Router, TypeScript
│   ├── app/                             #   Route segments (App Router)
│   │   ├── (public)/
│   │   │   ├── recipes/[slug]/          #     Trang chi tiết công thức
│   │   │   └── categories/[slug]/       #     Trang danh mục
│   │   ├── (auth)/                      #     Đăng ký / đăng nhập
│   │   └── (dashboard)/                 #     Khu vực Author/Admin
│   ├── components/                      #   UI components dùng chung
│   ├── lib/                             #   API client, utils, Zod schemas
│   ├── hooks/                           #   TanStack Query hooks
│   └── auth.ts                          #   Cấu hình Auth.js v5
│
├── nginx/
│   └── nginx.conf                       # Reverse proxy, SSL termination, rate limiting
├── ssl/                                 # Chứng chỉ SSL (production)
├── docker-compose.yml                   # Development stack
├── docker-compose.prod.yml              # Production stack (build tối ưu + secrets)
├── .env.production                      # Biến môi trường production (không commit)
├── SRS_Culinary_Blog_v1_0_0.pdf         # Tài liệu đặc tả yêu cầu phần mềm
└── README.md
```

---

## 🚀 Bắt đầu (Getting Started)

### Yêu cầu môi trường phát triển

| Thành phần | Yêu cầu |
|---|---|
| .NET SDK | 10.0.x |
| Node.js | 20+ LTS (npm 10+) |
| Docker | Docker Desktop 4.x+ / Docker Engine (để chạy PostgreSQL, Redis, MinIO local) |
| Git | 2.40+ |
| IDE | Visual Studio 2022 17.12+ / Rider 2024+ / VS Code + C# Dev Kit |

### Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/xuanmanhneee/culinary-blog.git
cd culinary-blog

# 2. Khởi động các service phụ trợ (PostgreSQL, Redis, MinIO, Seq, Mailhog)
docker compose up -d

# 3. Backend
cd src/CulinaryBlog.API
dotnet restore
dotnet ef database update
dotnet run

# 4. Frontend
cd ../../frontend
npm install
npm run dev
```

Sau khi chạy, ứng dụng khả dụng tại:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| API Docs (Scalar) | http://localhost:5000/scalar |
| MinIO Console | http://localhost:9001 |
| Seq (logs, dev only) | http://localhost:5341 |
| Mailhog (dev only) | http://localhost:8025 |

### Triển khai Production

Toàn bộ hệ thống được container hoá qua **Docker Compose**:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

| Service | Image | Port (host:container) |
|---|---|---|
| nginx | nginx:alpine | 80:80, 443:443 |
| api | culinaryblog-api (Dockerfile) | 5000:8080 |
| frontend | culinaryblog-web (Dockerfile) | 3000:3000 |
| postgres | postgres:16-alpine | 5432:5432 |
| redis | redis:7-alpine | 6379:6379 |
| minio | minio/minio:latest | 9000:9000, 9001:9001 |

---

## 🔌 API tổng quan

Base URL: `/api/v1` · Auth: `Bearer JWT` · Lỗi theo chuẩn **RFC 7807** (`application/problem+json`)

| Module | Endpoint gốc | Mô tả |
|---|---|---|
| Authentication | `/auth` | Đăng ký, đăng nhập (email/password, Google OAuth 2.0), refresh/revoke token, hồ sơ cá nhân |
| Categories | `/categories` | CRUD danh mục công thức |
| Recipes | `/recipes` | CRUD, publish/unpublish/archive, tìm kiếm full-text |
| Recipe Images | `/recipes/{id}/images` | Upload / cập nhật / xoá ảnh |
| Recipe Steps | `/recipes/{id}/steps` | CRUD các bước thực hiện |
| Recipe Ingredients | `/recipes/{id}/ingredients` | CRUD nguyên liệu |
| Health Checks | `/health`, `/health/live`, `/health/ready` | Kiểm tra tình trạng hệ thống |

Tài liệu API đầy đủ (request/response schema) được sinh tự động tại **`/scalar`** khi chạy backend.

---

## 🔐 Phân quyền

Hệ thống có 3 vai trò: **Guest**, **Author**, **Admin**, với 3 tầng kiểm soát:

1. **Role-Based** — phân biệt quyền theo vai trò.
2. **Resource-Based** — Author chỉ sửa/xoá được recipe của chính mình.
3. **Policy-Based** — policy `VerifiedAuthor` yêu cầu email đã xác thực; Admin có quyền bypass ownership check.

---

## 🧪 Kiểm thử

- Dữ liệu seed dùng thư viện **Bogus** (50 recipe mẫu, 5 tác giả mẫu).
- Test API thủ công qua **Postman** hoặc **Scalar UI** (`/scalar`).

---

## 📂 Tài liệu dự án

- [`SRS_Culinary_Blog_v1_0_0.pdf`](./SRS_Culinary_Blog_v1_0_0.pdf) — Tài liệu Đặc tả Yêu cầu Phần mềm đầy đủ (IEEE 830 / ISO 29148), bao gồm yêu cầu chức năng, phi chức năng, mô hình dữ liệu và đặc tả API chi tiết.

---

## 👥 Thành viên nhóm

| Họ và tên | Vai trò | MSSV | GitHub |
|---|---|---|---|
| _Phan Lê Xuân Mạnh_ | _Nhóm trưởng_ | _2312686_ | [@_xuanmanhneee_](https://github.com/xuanmanhneee) |
| _Nguyễn Đình Thạch_ | _Thành viên_ | _2314506_ | [@_Thach Nguyen_](https://github.com/nguyendinhthach) |
| _Lý Ngọc Thảo Nguyên_ | _Thành viên_ | _2312700_ | [@_LeonSK-hav_](https://github.com/LeonSK-hav) |
| _Trần Tấn Khải_ | _Thành viên_ | _2312642_ | [@__](https://github.com/) |


## 👷 Phân công công việc

| Vai trò | Công nghệ chính | Việc chính | Người nhận |
|---|---|---|---|
| Auth & Category | JWT, OAuth, RBAC | Đăng ký/đăng nhập/Google OAuth, phân quyền, CRUD danh mục | Tấn Khải |
| Recipe Management | CQRS/MediatR, EF Core | CRUD công thức, ảnh/nguyên liệu/các bước, form nhiều bước | Đình Thạch |
| Search, File & SEO | Postgres FTS, MinIO, Redis, SEO | Tìm kiếm, lọc, upload/resize ảnh, tối ưu SEO | Thảo Nguyên |
| Kiến trúc, Jobs & DevOps | Clean Architecture, Hangfire, OpenTelemetry, Docker | Dựng khung kiến trúc cho cả nhóm, background jobs, logging/tracing, CI/CD | Xuân Mạnh |

---

## 📅 Tiến độ công việc

| Tuần | Thành viên | Công việc | Trạng thái |
|---|---|---|---|
| 1 | Xuân Mạnh | Dựng cấu trúc thư mục Clean Architecture, khởi tạo solution/project, cấu hình `CulinaryBlogDbContext`, seed data mẫu bằng Bogus (50 recipe, 5 author) | ✅ Hoàn thành |
| 1 | Thảo Nguyên | Xử lý upload file lên MinIO (`IFileStorageService`) | ✅ Hoàn thành |
| 1 | Tấn Khải | Auth (đăng ký/đăng nhập, JWT) | 🔄 Đang thực hiện |
| 1 | Đình Thạch | Recipe Management (CRUD công thức) | ✅ Hoàn thành |

## 📄 Giấy phép

_MIT License_