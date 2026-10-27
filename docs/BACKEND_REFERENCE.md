# Culinary Blog Backend Reference

> Baseline bàn giao frontend: **2026-10-27**
>
> Base URL development: `http://localhost:5000/api/v1`
>
> OpenAPI runtime: `http://localhost:5000/openapi/v1.json`
>
> Scalar UI: `http://localhost:5000/scalar/v1`

OpenAPI snapshot đã khóa cùng source: [`openapi.v1.json`](./openapi.v1.json).

Tài liệu này là nguồn tham chiếu chính thức cho frontend đối với backend hiện tại.
Nếu tài liệu và OpenAPI runtime khác nhau, ưu tiên OpenAPI runtime và cập nhật lại tài liệu trong cùng pull request.

## 1. Trạng thái freeze

Backend hiện đủ điều kiện để nhóm chuyển trọng tâm sang frontend cho phạm vi:

- đăng ký, đăng nhập, refresh/logout và hồ sơ cá nhân;
- danh mục;
- CRUD và vòng đời công thức;
- nguyên liệu, bước thực hiện và ảnh;
- tìm kiếm không dấu và gần đúng khi gõ sai;
- tìm kiếm, upload và quản lý vòng đời ảnh.

Những chức năng **không thuộc backend core hiện tại**: rating, saved recipes, Google OAuth,
quên mật khẩu, bình luận, notification và cache phân tán. Frontend không nên dựng luồng phụ thuộc vào các chức năng này
trước khi có API contract mới.

## 2. Kiến trúc và ranh giới module

Backend là modular monolith được chia theo vertical capability:

```text
HTTP /api/v1
├── Identity       auth, JWT, user profile, roles
└── Recipes        categories, recipes, ingredients, steps, images, search
```

## 3. Chạy local

Yêu cầu: .NET SDK 10, Docker Desktop.

```powershell
docker compose up -d

# Seed idempotent: có thể chạy lại mà không nhân đôi dữ liệu.
dotnet run --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj -- --seed

dotnet run --project backend/src/CulinaryBlog.API/CulinaryBlog.API.csproj --launch-profile http
```

Khi API đang chạy, kiểm tra toàn bộ luồng chính bằng script có cleanup:

```powershell
powershell -ExecutionPolicy Bypass -File backend/scripts/smoke-test.ps1
```

Tài khoản seed:

```text
email:    author1@culinaryblog.local
password: Author@123
roles:    Admin, Author
```

Các service local:

| Service | URL/port | Mục đích |
|---|---|---|
| Backend | `http://localhost:5000` | REST API |
| PostgreSQL | `localhost:5432` | Core database |
| Mailhog UI | `http://localhost:8025` | Xem email development |
| Mailhog SMTP | `localhost:1025` | SMTP development |

Migration được áp dụng tự động khi API khởi động. Upload Development được lưu tại
`backend/src/CulinaryBlog.API/wwwroot/uploads`; production có thể chuyển sang MinIO bằng adapter
`IFileStorageService` mà không đổi Application layer.

## 4. Quy ước HTTP

### Authentication

Endpoint bảo vệ dùng header:

```http
Authorization: Bearer <accessToken>
```

Access token mặc định sống 15 phút; refresh token sống 7 ngày. Khi nhận `401`, frontend chỉ nên
thử refresh một lần, cập nhật cả access/refresh token rồi retry request ban đầu một lần.

### JSON và enum

- JSON dùng `camelCase`.
- Ngày giờ dùng ISO-8601 UTC.
- UUID truyền dưới dạng chuỗi.
- `difficulty`: `1=Easy`, `2=Medium`, `3=Hard`, `4=Expert`.
- `status`: `0=Draft`, `1=Published`, `2=Archived`.

### Pagination

Response phân trang dùng cấu trúc:

```json
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

### Error contract

Lỗi dùng RFC 7807, content type `application/problem+json`:

```json
{
  "type": "RECIPE_NOT_FOUND",
  "title": "Resource not found.",
  "status": 404,
  "detail": "Recipe '...' không tồn tại.",
  "instance": "GET /api/v1/...",
  "traceId": "00-..."
}
```

Validation error có thêm `errors`:

```json
{
  "type": "VALIDATION_ERROR",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "title": ["Title is required."]
  }
}
```

Frontend nên xử lý theo `status` và `type`, không so sánh chuỗi `detail`.

| Status | Ý nghĩa |
|---:|---|
| `400` | Body/query sai hoặc vi phạm business rule |
| `401` | Thiếu/hết hạn/sai token |
| `403` | Đã đăng nhập nhưng thiếu role hoặc không sở hữu resource |
| `404` | Resource không tồn tại |
| `409` | Trùng email, username, slug hoặc dữ liệu unique |
| `422` | Optimistic concurrency conflict |
| `429` | Rate limit; đọc header `Retry-After` |
| `500` | Lỗi hệ thống ngoài dự kiến |

### Rate limit

- Mặc định: 100 request/phút/IP.
- `/auth/*`: 10 request/phút/IP.
- Upload ảnh: 5 request/phút/IP.
- `/health/*`: không giới hạn.

## 5. Role và quyền sở hữu

| Hành động | Guest | Author | Admin |
|---|:---:|:---:|:---:|
| Xem category/recipe đã publish, search | ✓ | ✓ | ✓ |
| Tạo recipe |  | ✓ | ✓ |
| Sửa/xóa recipe của mình |  | ✓ | ✓ |
| Sửa recipe người khác |  |  | ✓ |
| Tạo category |  |  | ✓ |

Draft/Archived chỉ owner hoặc Admin xem được. Kiểm tra quyền nằm ở backend; frontend chỉ dùng role
để ẩn/hiện UI, không coi đó là cơ chế bảo mật.

## 6. API catalog

Tổng cộng **28 OpenAPI operations**, tất cả có `operationId` duy nhất và không có route shape trùng.

### Auth

| Method | Route | Auth | operationId | Body/response chính |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `Register` | `RegisterRequest` → `201 AuthResponseDto` |
| POST | `/auth/login` | Public | `Login` | `LoginRequest` → `AuthResponseDto` |
| POST | `/auth/refresh` | Public | `RefreshAccessToken` | `{ refreshToken }` → token pair mới |
| POST | `/auth/logout` | Bearer | `Logout` | `{ refreshToken }` → `204` |
| GET | `/auth/me` | Bearer | `GetCurrentUser` | `UserProfileDto` |
| PATCH | `/auth/me` | Bearer | `UpdateCurrentUser` | `{ fullName?, avatarUrl? }` |

```json
// RegisterRequest
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "userName": "nguyenvana",
  "password": "StrongPassword123!"
}
```

```json
// AuthResponseDto
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": "2026-10-27T10:00:00Z",
  "user": {
    "id": "...",
    "fullName": "Nguyen Van A",
    "email": "user@example.com",
    "userName": "nguyenvana",
    "avatarUrl": null,
    "roles": ["Author"]
  }
}
```

### Categories

| Method | Route | Auth | operationId | Ghi chú |
|---|---|---|---|---|
| GET | `/categories` | Public | `GetCategories` | Sắp theo `orderIndex` |
| GET | `/categories/{slug}` | Public | `GetCategoryBySlug` | `404 CATEGORY_NOT_FOUND` |
| POST | `/categories` | Admin | `CreateCategory` | `201`; name/slug phải unique |

```json
{
  "name": "Món Việt",
  "slug": "mon-viet",
  "description": "Ẩm thực Việt Nam",
  "orderIndex": 1
}
```

### Recipes

| Method | Route | Auth | operationId | Ghi chú |
|---|---|---|---|---|
| GET | `/recipes` | Optional | `GetRecipes` | Danh sách, filter, sort, pagination |
| GET | `/recipes/search` | Public | `SearchRecipes` | Không dấu + typo/fuzzy, chỉ Published |
| GET | `/recipes/{slug}` | Optional | `GetRecipeBySlug` | Chi tiết public/owner/admin |
| GET | `/recipes/by-id/{id}` | Author/Admin | `GetRecipeById` | Dành cho form edit; trả `ETag` |
| POST | `/recipes` | Author/Admin | `CreateRecipe` | Tạo Draft |
| PUT | `/recipes/{id}` | Owner/Admin | `UpdateRecipe` | Gửi `If-Match` hoặc `rowVersion` |
| PATCH | `/recipes/{id}/publish` | Owner/Admin | `PublishRecipe` | Cần ít nhất một step |
| PATCH | `/recipes/{id}/unpublish` | Owner/Admin | `UnpublishRecipe` | Đưa về Draft |
| PATCH | `/recipes/{id}/archive` | Owner/Admin | `ArchiveRecipe` | Ẩn khỏi public |
| DELETE | `/recipes/{id}` | Owner/Admin | `DeleteRecipe` | `204`, hard delete |

Query của `GET /recipes`:

| Field | Default | Rule |
|---|---:|---|
| `page` | `1` | `>= 1` |
| `pageSize` | `12` | `1..50` |
| `categoryId` |  | UUID |
| `difficulty` |  | `1..4` |
| `maxCookTime` |  | `>= 0` |
| `sort` | `-createdAt` | `createdAt`, `title`, `cookTime`; thêm `-` để giảm dần |

Query của `GET /recipes/search`: `q`, `page=1`, `pageSize=10` (`1..50`).

```json
// CreateRecipeRequest
{
  "title": "Phở bò",
  "description": "Phở bò truyền thống",
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "prepTimeMinutes": 30,
  "cookTimeMinutes": 120,
  "servings": 4,
  "difficulty": 2,
  "instructions": "Chuẩn bị nguyên liệu và ninh nước dùng.",
  "nutrition": {
    "calories": 450,
    "protein": 30,
    "carbohydrates": 55,
    "fat": 12,
    "fiber": 3,
    "sodium": 800
  },
  "ingredients": [
    { "name": "Bánh phở", "quantity": 500, "unit": "g", "orderIndex": 0 }
  ],
  "steps": [
    { "title": "Ninh nước dùng", "description": "Ninh xương trong 120 phút", "timerMinutes": 120 }
  ]
}
```

Update dùng cùng các field chính nhưng không có `ingredients`/`steps`; gửi concurrency token:

```http
If-Match: "<ETag nhận từ GET /recipes/by-id/{id}>"
```

Nếu bản ghi đã đổi, backend trả `422 RECIPE_CONCURRENCY_CONFLICT`; frontend cần tải lại dữ liệu.

### Ingredients

| Method | Route | Auth | operationId |
|---|---|---|---|
| POST | `/recipes/{recipeId}/ingredients` | Owner/Admin | `AddRecipeIngredient` |
| PUT | `/recipes/{recipeId}/ingredients/{ingredientId}` | Owner/Admin | `UpdateRecipeIngredient` |
| DELETE | `/recipes/{recipeId}/ingredients/{ingredientId}` | Owner/Admin | `DeleteRecipeIngredient` |

```json
{
  "name": "Muối",
  "quantity": 1,
  "unit": "thìa cà phê",
  "notes": null,
  "orderIndex": 0
}
```

### Steps

| Method | Route | Auth | operationId |
|---|---|---|---|
| POST | `/recipes/{recipeId}/steps` | Owner/Admin | `AddRecipeStep` |
| PUT | `/recipes/{recipeId}/steps/{stepId}` | Owner/Admin | `UpdateRecipeStep` |
| DELETE | `/recipes/{recipeId}/steps/{stepId}` | Owner/Admin | `DeleteRecipeStep` |

```json
{
  "title": "Sơ chế",
  "description": "Rửa và cắt nguyên liệu",
  "timerMinutes": 10,
  "imageUrl": null
}
```

`stepNumber` do backend tự gán. Sau khi xóa, các step còn lại được đánh số lại liên tục.

### Images

| Method | Route | Auth | operationId | Ghi chú |
|---|---|---|---|---|
| POST | `/recipes/{recipeId}/images` | Owner/Admin | `UploadRecipeImage` | `multipart/form-data`, field `file` |
| PATCH | `/recipes/{recipeId}/images/{imageId}/primary` | Owner/Admin | `SetPrimaryRecipeImage` | Đặt ảnh chính |
| DELETE | `/recipes/{recipeId}/images/{imageId}` | Owner/Admin | `DeleteRecipeImage` | Xóa DB và object/file |

Định dạng: JPEG, PNG, WebP, AVIF; tối đa 5 MB; backend kiểm tra cả content type và magic bytes.

```ts
const form = new FormData();
form.append("file", file);

await fetch(`${api}/recipes/${recipeId}/images`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

Không tự đặt `Content-Type` khi gửi `FormData`; browser cần thêm multipart boundary.

### Health và development tools

| Method | Route | Mục đích |
|---|---|---|
| GET | `/health` | Tất cả health check đã đăng ký |
| GET | `/health/live` | Process còn sống |
| GET | `/health/ready` | Core DB sẵn sàng |
| GET | `/hangfire` | Dashboard, chỉ được map trong Development |

## 7. Luồng frontend khuyến nghị

### App bootstrap

1. Đọc token từ nơi lưu an toàn của client.
2. Nếu có access token, gọi `GET /auth/me`.
3. Nếu `401`, thử refresh một lần; thất bại thì xóa session.
4. Không chặn route public trong lúc kiểm tra session trừ khi UX yêu cầu.

### Recipe listing

1. Gọi `GET /recipes` hoặc `/recipes/search`.
2. Render trực tiếp các card từ `items` và dùng `primaryImageUrl` nếu có.

### Recipe edit

1. Gọi `GET /recipes/by-id/{id}` và giữ `ETag` response header.
2. Gửi `PUT /recipes/{id}` với `If-Match`.
3. Nếu `422`, báo dữ liệu đã thay đổi và cho người dùng tải lại.
4. Ingredients, steps và images cập nhật qua endpoint riêng.

## 8. Cấu hình

| Key | Development | Production |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL local | Secret/managed DB |
| `Jwt__Key` | Có key development trong `appsettings.Development.json` | Bắt buộc secret riêng, >=32 ký tự |
| `Jwt__Issuer` | `CulinaryBlog` | Theo deployment |
| `Jwt__Audience` | `CulinaryBlog.Client` | Theo deployment |
| `Cors__AllowedOrigins__0` | `http://localhost:3000` | Domain frontend thật |
| `Storage__Provider` | `Local` | `MinIO` hoặc provider tương thích |

Không dùng development key/password ở production.

## 9. Quy tắc thay đổi sau freeze

- Không đổi/xóa field hoặc route đang dùng nếu chưa tăng API version.
- Thêm field response phải optional hoặc có default hợp lý cho client cũ.
- Mỗi endpoint mới phải có `WithName`/`operationId`, response metadata và auth metadata.
- Migration core nằm trong `Persistence/Migrations`.
- Thay đổi contract phải cập nhật OpenAPI, tài liệu này và smoke test trong cùng commit.
- Refresh snapshot bằng `Invoke-WebRequest http://localhost:5000/openapi/v1.json -OutFile docs/openapi.v1.json`.

## 10. Checklist bàn giao

- [x] Build sạch, không warning/error.
- [x] Migration core áp dụng thành công.
- [x] Seed chạy lại không tạo trùng.
- [x] Health readiness trả `Healthy`.
- [x] Auth login hoạt động.
- [x] Public listing/detail và protected edit-by-id hoạt động.
- [x] Tìm kiếm không dấu và typo hoạt động.
- [x] Upload/serve/delete ảnh hoạt động; file bị xóa khỏi storage.
- [x] OpenAPI không có route shape trùng và mọi operation có `operationId`.
