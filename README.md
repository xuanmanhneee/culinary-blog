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
| Engagement | .NET 10 microservice, EF Core; món đã lưu và rating, database riêng; truy cập qua API/BFF |
| Database | PostgreSQL 16 (EF Core Code First, Full-Text Search) |
| Cache | Adapter boundary available; distributed cache is not enabled yet |
| Object Storage | Local files (Development), MinIO/S3-compatible (Production) |
| API entry point | ASP.NET Core API/BFF; proxy route Engagement nội bộ |
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

### Cách 1 — Chạy nhanh toàn bộ bằng Docker (khuyến nghị)

Yêu cầu: **Git** và **Docker Desktop/Docker Engine có Docker Compose**. Máy cần trống các cổng `80`, `443`, `1025`, `5000`, `5100`, `5432`, `5433`, `5341`, `6379`, `8025`, `9000` và `9001`.

```powershell
git clone https://github.com/xuanmanhneee/culinary-blog.git
cd culinary-blog
docker compose up -d --build
docker compose ps
```

Compose sẽ build và chạy frontend, API chính, Engagement, Nginx, PostgreSQL, Redis, MinIO, MailHog và Seq. Migration cơ sở dữ liệu được áp dụng tự động khi hai API khởi động.

Khi các container đã chạy, tạo dữ liệu mẫu:

```powershell
docker compose exec api dotnet CulinaryBlog.API.dll --seed
```

> Lệnh seed chỉ chạy trong môi trường `Development` và có thể chạy lại an toàn. Thêm `--reset` (`... --seed --reset`) để xóa sạch công thức, danh mục và tài khoản cũ rồi seed lại 10 danh mục, 55 công thức, 1 admin và 5 author.

Mở <https://localhost> để dùng ứng dụng. Lần đầu trình duyệt sẽ cảnh báo vì chứng chỉ local là self-signed; chọn tiếp tục truy cập.

| Thành phần | Địa chỉ |
|---|---|
| Website qua Nginx | <https://localhost> |
| Backend API / Scalar | <http://localhost:5000> / <http://localhost:5000/scalar> |
| Engagement API | <http://localhost:5100> |
| Health check | <http://localhost:5000/health/ready> |
| MailHog | <http://localhost:8025> |
| MinIO Console | <http://localhost:9001> |
| Seq | <http://localhost:5341> |

Tài khoản mẫu sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@culinaryblog.nhom10` | `Author@123` |
| Author | `author1@culinaryblog.nhom10` … `author5@culinaryblog.nhom10` | `Author@123` |

Các lệnh thường dùng:

```powershell
docker compose logs -f api frontend engagement # Xem log
docker compose down                           # Dừng và giữ dữ liệu
docker compose down -v                        # Dừng và xóa toàn bộ dữ liệu local
```

Docker Compose đã có cấu hình mặc định để demo. Google OAuth mặc định tắt; nếu cần bật, khai báo `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` và `GOOGLE_AUTH_ENABLED=true` trong tệp `.env` ở thư mục gốc rồi build lại.

### Cách 2 — Chạy source để phát triển

Ngoài Docker, cần cài **.NET SDK 10**, **Node.js 22** và **pnpm 11**. Tại thư mục gốc, khởi động các dịch vụ hạ tầng trước:

```powershell
docker compose up -d postgres engagement-postgres redis minio mailhog seq
```

Mở ba terminal tại thư mục gốc và chạy lần lượt:

```powershell
# Terminal 1: Engagement API — http://localhost:5100
dotnet watch --project services/CulinaryBlog.Engagement/CulinaryBlog.Engagement.csproj

# Terminal 2: Backend API — http://localhost:5000
dotnet watch --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj --launch-profile http

# Terminal 3: Frontend — http://localhost:3000
Copy-Item frontend/.env.example frontend/.env.local
# Mở frontend/.env.local và điền AUTH_SECRET trước khi chạy hai lệnh sau
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend dev
```

Trước khi chạy frontend lần đầu, điền `AUTH_SECRET` trong `frontend/.env.local` bằng một chuỗi ngẫu nhiên dài. Các URL local còn lại trong tệp mẫu đã khớp với cấu hình mặc định.

Để seed khi chạy source, dừng Backend API rồi chạy:

```powershell
dotnet run --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj --launch-profile http -- --seed
```

Sau đó khởi động lại Backend API bằng lệnh `dotnet watch` ở trên.

### Xử lý lỗi nhanh

- Container chưa sẵn sàng: chạy `docker compose ps` và `docker compose logs <tên-service>`.
- Cổng đã được sử dụng: dừng ứng dụng đang chiếm cổng hoặc sửa port phía host trong `docker-compose.yml`.
- Muốn tạo lại dữ liệu từ đầu: chạy `docker compose down -v`, sau đó `docker compose up -d --build` và seed lại. Lệnh này xóa toàn bộ dữ liệu local trong các Docker volume.
- Frontend không đăng nhập được khi chạy source: kiểm tra `AUTH_SECRET`, `AUTH_URL=http://localhost:3000` và `API_URL=http://localhost:5000` trong `frontend/.env.local`.

---

## 🔌 API tổng quan

Base URL: `/api/v1` · Auth: `Bearer JWT` · Lỗi theo chuẩn **RFC 7807** (`application/problem+json`)

| Module | Endpoint gốc | Mô tả |
|---|---|---|
| Authentication | `/auth` | Đăng ký, đăng nhập email/password, refresh/revoke token, hồ sơ cá nhân |
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
3. **Policy-Based** — policy `VerifiedAuthor` yêu cầu email đã xác thực; Admin chỉ bypass ownership check khi xem, publish/đưa về Draft hoặc xóa recipe.

---

## 🧪 Kiểm thử

- Seed ở môi trường `Development` tạo danh mục, công thức và các tài khoản demo. Khi API đang chạy trong Compose, dùng `docker compose exec api dotnet CulinaryBlog.API.dll --seed`.
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
| _Trần Tấn Khải_ | _Thành viên_ | _2312642_ | [@_TranTan-Khai_](https://github.com/TranTan-Khai) |


## 👷 Phân công công việc

| Vai trò | Công nghệ chính | Việc chính | Người nhận |
|---|---|---|---|
| Auth & Category | JWT, OAuth, RBAC | Đăng ký/đăng nhập/Google OAuth, phân quyền, CRUD danh mục | Tấn Khải |
| Recipe Management | CQRS/MediatR, EF Core | CRUD công thức, ảnh/nguyên liệu/các bước, form nhiều bước | Đình Thạch |
| Search, File & SEO | Postgres FTS, MinIO, Redis, SEO | Tìm kiếm, lọc, upload/resize ảnh, tối ưu SEO | Thảo Nguyên |
| Kiến trúc, Jobs & DevOps | Clean Architecture, Hangfire, OpenTelemetry, Docker | Dựng khung kiến trúc cho cả nhóm, background jobs, logging/tracing, CI/CD | Xuân Mạnh |

---


## 📄 Giấy phép

_MIT License_
