# CULINARY BLOG — DESIGN DECISIONS

> Tổng hợp các điểm mâu thuẫn / mơ hồ trong `SRS_Culinary_Blog_v1_0_0.pdf` và quyết định đã chốt cho từng điểm.
> Khi SRS và tài liệu này khác nhau, **tài liệu này được ưu tiên** cho đến khi SRS được cập nhật qua quy trình Change Request.
> Tham chiếu ngữ cảnh chung: [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md).

| Trạng thái | Ý nghĩa |
|---|---|
| ✅ Chốt | Quyết định cuối cùng |
| 🔶 Tạm chốt | Cần đối chiếu lại với code thực tế (xem ghi chú) |

---

## Tổng hợp nhanh

| # | Chủ đề | Quyết định | Trạng thái |
|---|---|---|---|
| 1 | Mã HTTP cho validation | **422** | 🔶 |
| 2 | Mã HTTP cho concurrency conflict | **409** | 🔶 |
| 3 | Xóa recipe | **Soft delete** | ✅ |
| 4 | Điều kiện publish | **≥ 1 Step** | ✅ |
| 5 | Slug recipe trùng | **Tự thêm hậu tố** | ✅ |
| 6 | Body đăng ký | `email, password, displayName` (+ `userName` tùy chọn) | ✅ |
| 7 | Trường của Step | `stepNumber, title, description, timerMinutes, imageUrl` | ✅ |
| 8 | Thứ tự ingredient | `orderIndex` | ✅ |
| 9 | Độ dài tên ingredient | **1–200** | ✅ |
| 10 | Kích thước & lưu refresh token | 64 byte random, lưu SHA-256 hex (64 ký tự) | ✅ |
| 11 | Tên cột refresh token | `RevokedAt`, `ReplacedByTokenHash` | ✅ |
| 12 | Input đăng nhập Google | `POST /auth/google { idToken }` | ✅ |
| 13 | Cache engine & TTL | **Redis**, TTL theo NFR-PERF-003 | ✅ |
| 14 | Response envelope | Không wrapper; list trả `PagedResult` phẳng | ✅ |
| 15 | Tham số sort | `sort=-field` | ✅ |
| 16 | Endpoint ảnh | Cả `/primary` và PATCH metadata | ✅ |
| 17 | Phiên bản Next.js | **15** (App Router) | ✅ |
| 18 | Lưu refresh token phía client | Chỉ trong request body | ✅ |
| 19 | Ping sitemap Google | **Bỏ** | ✅ |
| 20 | CQRS/MediatR vs Service pattern | **Giữ Service pattern** | ✅ |
| 21 | Tên thuộc tính thời gian | Entity `PrepTime/CookTime`, DTO `*Minutes` | ✅ |
| 22 | Phân quyền dashboard | Tạo: Author/Admin · Sửa: Owner/Admin | ✅ |

---

## Chi tiết

### 1. Mã HTTP cho lỗi validation 🔶
- **Mâu thuẫn:** các FR dùng **422**; Phụ lục A/B ghi `VALIDATION_ERROR` = **400**.
- **Quyết định:** dùng **422 Unprocessable Entity** cho mọi lỗi validation (body `ValidationProblemDetails`, error code `VALIDATION_ERROR`). **400** chỉ dùng cho request sai cú pháp / file không hợp lệ (`FILE_SIZE_EXCEEDED`, `FILE_MIME_INVALID`) và lỗi nghiệp vụ không thuộc validation.
- **Lý do:** nhất quán với hầu hết FR và cách phân biệt "sai cú pháp" với "sai ngữ nghĩa".
- **Cần làm:** đối chiếu với `GlobalExceptionMiddleware` hiện có; nếu code đang dùng 400 thì thống nhất một mã tại middleware và cập nhật Phụ lục B.

### 2. Mã HTTP cho concurrency conflict 🔶
- **Mâu thuẫn:** FR-RCP-004 → **409**; Phụ lục A/B (`RECIPE_CONCURRENCY_CONFLICT`) → **422**.
- **Quyết định:** **409 Conflict**, error code `RECIPE_CONCURRENCY_CONFLICT`. `ConcurrencyConflictException` map sang 409.
- **Lý do:** đây là xung đột trạng thái tài nguyên, đúng ngữ nghĩa 409; dành 422 cho validation (mục 1).
- **Cần làm:** như mục 1, kiểm tra mapping trong middleware.

### 3. Xóa recipe: hard hay soft delete ✅
- **Mâu thuẫn:** FR-RCP-007 mô tả hard delete (cascade); §7, §6.4, NFR-REL-003 và §8 mô tả soft delete (`IsDeleted`).
- **Quyết định:** **Soft delete** — `DELETE /recipes/{id}` đặt `IsDeleted = true`, global query filter ẩn bản ghi, trả 204.
- **Hệ quả:**
  - Không xóa Steps/Ingredients/Images khỏi DB; chỉ evict cache.
  - File ảnh trên MinIO **không** bị xóa ngay; chỉ xóa khi người dùng xóa từng ảnh (`DELETE .../images/{imageId}`) hoặc khi có job dọn dẹp bản ghi đã soft delete quá hạn (nằm ngoài phạm vi 1.0.0).
  - Slug của recipe đã xóa vẫn giữ trong unique index (tránh tái sử dụng URL cũ).
- **Lý do:** khớp `BaseEntity.IsDeleted`, cho phép khôi phục, nhất quán NFR-REL-003.

### 4. Điều kiện publish ✅
- **Mâu thuẫn:** FR-RCP-005: ≥ 1 Step; Phụ lục B (`RECIPE_PUBLISH_INCOMPLETE`): ≥ 1 Step **và** ≥ 1 Ingredient.
- **Quyết định:** chỉ yêu cầu **≥ 1 Step**. Vi phạm → `DomainException` / `BusinessRuleViolationException` với `RECIPE_PUBLISH_INCOMPLETE`.
- **Lý do:** theo đặc tả chi tiết của FR; có thể nâng yêu cầu sau qua CR.

### 5. Slug recipe trùng ✅
- **Mâu thuẫn:** FR-RCP-003 → 409; Phụ lục B (`RECIPE_SLUG_EXISTS`) → tự thêm hậu tố.
- **Quyết định:** **tự thêm hậu tố số** (`-2`, `-3`, …) cho đến khi unique, giống Category. Không trả 409 do slug trùng (409 vẫn dùng cho trùng unique khác như tên category, email).
- **Lưu ý:** slug không đổi sau khi publish (NFR-SEO-004).

### 6. Body đăng ký ✅
- **Mâu thuẫn:** FR-AUTH-001: `fullName, email, userName, password`; §8: `email, password, displayName`.
- **Quyết định:** `{ email, password, displayName, userName? }`. Nếu thiếu `userName`, sinh từ phần local của email (đảm bảo unique). Entity dùng `DisplayName`.
- **Hệ quả:** `PATCH /auth/me` cập nhật `displayName`, `avatarUrl`, `bio`.

### 7. Trường của Step ✅
- **Mâu thuẫn:** FR-RCP-010: `description, durationMinutes`; §7/§8: `title, description, timerMinutes, stepNumber`.
- **Quyết định:** theo data model §7: `stepNumber, title, description, timerMinutes?, imageUrl?`.
- **Ràng buộc:** `description` ≤ 2000 ký tự; `title` ≤ 200; `StepNumber` unique trong cùng recipe; xóa step → renumber liên tục.

### 8. Thứ tự ingredient ✅
- **Mâu thuẫn:** FR: `SortOrder`; DB/API: `OrderIndex`.
- **Quyết định:** `orderIndex` ở mọi nơi (DB, entity, DTO, API).

### 9. Độ dài tên ingredient ✅
- **Mâu thuẫn:** FR-RCP-009: 1–100; DB: `varchar(200)`.
- **Quyết định:** **1–200** ký tự, khớp cột DB.

### 10. Kích thước & lưu refresh token ✅
- **Mâu thuẫn:** FR-AUTH-001: 512-bit; NFR-SEC-002: 128-bit; DB `TokenHash` `varchar(64)`.
- **Quyết định:** sinh **64 byte** ngẫu nhiên bằng CSPRNG, trả cho client dạng chuỗi (Base64Url); DB chỉ lưu **SHA-256 hex (64 ký tự)** trong `TokenHash`. Không lưu token gốc.

### 11. Tên cột refresh token ✅
- **Mâu thuẫn:** FR-AUTH-004: `IsRevoked`, `ReplacedByToken`; §7.8: `RevokedAt`, `ReplacedByTokenHash`.
- **Quyết định:** theo §7.8. Token còn hiệu lực ⇔ `RevokedAt IS NULL AND ExpiresAt > now`. Dùng lại token đã revoke → 401 `AUTH_REFRESH_TOKEN_REVOKED`, log cảnh báo bảo mật và revoke toàn bộ chuỗi token (family) của user.

### 12. Input đăng nhập Google ✅
- **Mâu thuẫn:** FR-AUTH-003 mô tả Authorization Code + PKCE / ExternalLoginInfo; §8: `{ idToken }`.
- **Quyết định:** frontend (Auth.js v5) hoàn tất OAuth và gửi `POST /auth/google { idToken }`; **backend xác minh ID token** với Google (signature, audience, expiry). Lỗi → 400 `AUTH_GOOGLE_TOKEN_INVALID`; Google không khả dụng → 502.

### 13. Cache engine & TTL ✅
- **Mâu thuẫn:** FR dùng `IMemoryCache` / Output Cache với TTL 60', 15', 60'; NFR-PERF-003 dùng Redis với TTL 30', 5', 1'.
- **Quyết định:** **Redis** (distributed) cho mọi cache dùng chung (NFR-SCALE-001). Output Cache dùng Redis làm store.

| Đối tượng | TTL | Tag / Key |
|---|---|---|
| Danh sách category | 30 phút | `categories:all` |
| Chi tiết recipe | 5 phút | tag `recipes`, `recipe:{slug}` |
| Danh sách recipe | 15 phút (vary by query string) | tag `recipes` |
| Kết quả search | 1 phút (vary by query) | — |

- **Invalidation:** event-driven — mọi create/update/delete/publish/archive và thao tác images/steps/ingredients đều evict tag liên quan. Redis down → fallback đọc DB, không throw.

### 14. Response envelope ✅
- **Mâu thuẫn:** Chương 5/8 mô tả `{ data, meta }`; FR-RCP-001 mô tả `PagedResult` phẳng.
- **Quyết định:** **không dùng wrapper**. Endpoint đơn trả thẳng DTO; endpoint danh sách trả `PagedResult<T>` gồm `items, totalCount, page, pageSize, totalPages, hasNextPage, hasPreviousPage`. Lỗi: RFC 7807.
- **Lý do:** khớp `PagedResult` đã có trong codebase, ít nested hơn cho frontend.

### 15. Tham số sort ✅
- **Mâu thuẫn:** `sort=-createdAt` (FR-SRCH-003) vs `sortBy` + `sortOrder` (Chương 8).
- **Quyết định:** `sort={field}` với tiền tố `-` là giảm dần; mặc định `-createdAt`. Field hợp lệ: `createdAt`, `title`, `cookTime`. Không hỗ trợ `sortBy`/`sortOrder`. Field lạ → 422.

### 16. Endpoint ảnh ✅
- **Mâu thuẫn:** FR-RCP-008: `PATCH .../images/{imgId}/primary`; §8: `PATCH .../images/{imageId}` với `isPrimary`.
- **Quyết định:** cung cấp cả hai, phân vai rõ ràng:
  - `PATCH /recipes/{id}/images/{imageId}/primary` — đặt ảnh chính (các ảnh khác thành `false`).
  - `PATCH /recipes/{id}/images/{imageId}` — cập nhật `altText`, `orderIndex`.
- **Hệ quả:** `isPrimary` trong body của PATCH metadata **không** được hỗ trợ (tránh hai đường làm cùng một việc).

### 17. Phiên bản Next.js ✅
- **Mâu thuẫn:** "14+" (§6.1) vs "15" (Tham chiếu).
- **Quyết định:** **Next.js 15**, App Router, TypeScript.

### 18. Lưu refresh token phía client ✅
- **Mâu thuẫn:** FR-AUTH-005 nhắc localStorage/cookie; §5.2 "không dùng cookie".
- **Quyết định:** API chỉ nhận refresh token qua **request body**, không đọc/ghi cookie. Cách frontend lưu token do tầng Auth.js/Next.js quyết định, nằm ngoài hợp đồng API.

### 19. Ping sitemap Google ✅
- **Mâu thuẫn:** FR-JOB-003 / NFR-SEO-003 yêu cầu ping `google.com/ping?sitemap=`; endpoint này đã ngừng hoạt động.
- **Quyết định:** **bỏ bước ping**. Job vẫn sinh `sitemap.xml` hằng ngày 02:00 UTC và `robots.txt` khai báo URL sitemap; việc gửi sitemap thực hiện thủ công qua Google Search Console.

### 20. CQRS/MediatR vs Service pattern ✅
- **Mâu thuẫn:** CONS-002, CONS-008, NFR-MAINT-004 yêu cầu CQRS + MediatR + pipeline behaviors; code hiện tại dùng `ICategoryService`, `IRecipeService`, `IRecipeIngredientService`.
- **Quyết định:** **giữ Service pattern** trong tầng Application; không đưa MediatR vào.
- **Hệ quả cho các yêu cầu liên quan:**
  - Validation (CONS-008): đặt trong validators được gọi ở tầng service, không trong endpoint handler.
  - Logging/performance/caching/invalidation: thực hiện qua decorator hoặc middleware thay cho pipeline behaviors.
  - Vẫn tách rõ phương thức đọc (query) và ghi (command) trong từng service; mutation đi qua `IUnitOfWork`.
- **Cần làm:** ghi lại thành ADR và đề nghị CR cho CONS-002 khi cập nhật SRS.

### 21. Tên thuộc tính thời gian ✅
- **Mâu thuẫn:** `PrepTime/CookTime` (entity) vs `prepTimeMinutes/cookTimeMinutes` (DTO/FR).
- **Quyết định:** entity & DB: `PrepTime`, `CookTime` (phút); JSON API: `prepTimeMinutes`, `cookTimeMinutes`. Mapping ở tầng DTO.

### 22. Phân quyền dashboard ✅
- **Mâu thuẫn:** một số chỗ ghi "Author/Admin", một số "Owner/Admin".
- **Quyết định:**
  - Tạo recipe (`/dashboard/recipes/new`): Author hoặc Admin.
  - Sửa/xóa/publish/archive và quản lý ảnh/steps/ingredients (`/dashboard/recipes/[id]/edit`): chủ sở hữu (Owner) hoặc Admin.
  - `/dashboard/categories`: chỉ Admin.

---

## Quy trình thay đổi

Mọi thay đổi quyết định ở trên cần: (1) cập nhật tài liệu này, (2) ghi ADR nếu ảnh hưởng kiến trúc, (3) cập nhật SRS qua Change Request ở lần phát hành tiếp theo.