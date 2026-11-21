# Task: đưa hệ thống khớp với báo cáo môn học

Báo cáo (`BAO_CAO_MON_HOC_CULINARY_BLOG.docx`, Chương 4, Bảng 4.2) và `DESIGN_DECISIONS.md` đã chốt các quyết định dưới đây. Mã nguồn hiện còn lệch ở bốn điểm hành vi; các task sau chỉ sửa cho khớp, không thêm tính năng.

| Quyết định đã chốt | Mã hiện tại |
|---|---|
| Xung đột cập nhật đồng thời → **409** `RECIPE_CONCURRENCY_CONFLICT` | trả 422 |
| Lỗi kiểm tra dữ liệu → **422** kèm lỗi theo từng trường | trả 400 |
| Slug công thức trùng → **tự thêm hậu tố** `-2`, `-3`... | ném 409 `RECIPE_SLUG_EXISTS` |
| Refresh token → **64 byte** ngẫu nhiên, lưu SHA-256 | sinh 32 byte |

**Thứ tự làm:** T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8. T1–T4 độc lập với nhau, làm được song song. Mỗi task nên là một commit riêng.

**Đã kiểm tra, không cần sửa:** frontend nhận biết xung đột theo mã lỗi `RECIPE_CONCURRENCY_CONFLICT` (không theo số 422), và đọc lỗi theo từng trường từ `problem.errors` không phụ thuộc mã trạng thái, nên đổi mã HTTP ở backend không làm hỏng luồng này. `errors.ts` đã có câu thông báo cho cả 409 và 422.

---

## T0. Chạy đo nền trước khi sửa
- **Việc:** `dotnet test backend/CulinaryBlog.slnx`, `pnpm lint` và `pnpm build` trong `frontend/`. Ghi lại kết quả (hiện có 36 test backend đạt).
- **Xong khi:** biết rõ trạng thái xanh trước khi đổi, để phân biệt lỗi do mình gây ra.

## T1. Lỗi kiểm tra dữ liệu trả 422
- **File:** `backend/src/CulinaryBlog.API/Middleware/GlobalExceptionMiddleware.cs`, nhánh `ValidationException` (đang `Status400BadRequest`, khoảng dòng 72–78).
- **Việc:**
  - Đổi sang `Status422UnprocessableEntity`.
  - Giữ nguyên 400 cho `BadHttpRequestException`, `BusinessRuleViolationException`, `DomainException` và lỗi file (`FILE_SIZE_EXCEEDED`, `FILE_MIME_INVALID`).
  - Rà các endpoint khai báo `.ProducesValidationProblem()` hoặc `.ProducesProblem(Status400BadRequest)` cho lỗi validation (AuthEndpoints 6, CategoriesEndpoints 5, RecipeEndpoints 7, UserEndpoints 3, và các endpoint ảnh, nguyên liệu, bước) và đổi mô tả sang 422 chỗ nào là validation.
- **Xong khi:** `POST /api/v1/auth/register` với email sai định dạng trả 422, body có `errors` theo từng trường; gọi endpoint với JSON sai cú pháp vẫn trả 400.
- **Lưu ý:** `backend/scripts/smoke-test.ps1` dòng 45 kiểm tra 400 cho "email confirmation không hợp lệ"; xem đó là validation hay business rule rồi chỉnh cho đúng.

## T2. Xung đột đồng thời trả 409
- **File:** `GlobalExceptionMiddleware.cs` dòng 84 (`ConcurrencyConflictException` → 422); `backend/src/CulinaryBlog.API/Endpoints/RecipeEndpoints.cs` dòng 114 (`.ProducesProblem(Status422UnprocessableEntity)` trên PUT recipe).
- **Việc:**
  - Đổi sang `Status409Conflict`, giữ nguyên mã lỗi `RECIPE_CONCURRENCY_CONFLICT`.
  - Sửa mô tả endpoint PUT ở `RecipeEndpoints.cs` dòng 109 ("Bản cũ: 422 ..." → 409).
- **Xong khi:** mở sửa một công thức ở hai tab, lưu tab 1 rồi lưu tab 2: tab 2 nhận 409 `RECIPE_CONCURRENCY_CONFLICT` và hiện hộp thoại tải lại (frontend bắt theo mã lỗi nên không cần đổi logic).

## T3. Slug công thức trùng thì tự thêm hậu tố
- **File:**
  - `Application/Modules/Recipes/Commands/CreateRecipe/CreateRecipeCommandHandler.cs` dòng 45–47.
  - `Application/Modules/Recipes/Commands/UpdateRecipe/UpdateRecipeCommandHandler.cs` dòng 48–49.
  - Mẫu tham khảo: `CreateCategoryCommandHandler.cs` dòng 34 (vòng lặp `suffix = 2`).
- **Việc:**
  - Thay `throw new ConflictException(RecipeSlugExists ...)` bằng vòng lặp thêm `-2`, `-3`... cho đến khi duy nhất.
  - Khi sửa: chỉ đổi slug theo tiêu đề lúc còn Draft (giữ nguyên quy tắc hiện có), và so sánh với slug của chính công thức để không tự trùng với mình.
  - Gom logic sinh slug duy nhất vào một hàm dùng chung (ví dụ trong `RecipeUseCaseSupport` hoặc `SlugHelper`) thay vì lặp ở hai handler.
  - Cập nhật mô tả endpoint `RecipeEndpoints.cs` dòng 99 và 109 (bỏ "Trùng slug: 409").
- **Xong khi:** tạo hai công thức cùng tiêu đề cho slug `ten-mon` và `ten-mon-2`, không có 409; sau khi xuất bản, đổi tiêu đề không đổi slug.
- **Dọn:** nếu `ErrorCodes.RecipeSlugExists` không còn nơi nào dùng thì xóa, và xóa nhánh `RECIPE_SLUG_EXISTS` trong `frontend/src/app/(dashboard)/dashboard/recipes/_components/recipe-form/RecipeFormWizard.tsx` dòng 41 cùng chuỗi tương ứng ở `frontend/src/lib/api/problem.ts` dòng 15.

## T4. Refresh token 64 byte
- **File:** `backend/src/CulinaryBlog.Infrastructure/Modules/Identity/JwtService.cs` dòng 71–74 (`RandomNumberGenerator.GetBytes(32)`).
- **Việc:**
  - Đổi thành `GetBytes(64)`.
  - Giữ `SHA256` hex 64 ký tự cho cột `TokenHash` (đã `HasMaxLength(64)`).
  - Kiểm tra không có chỗ nào ràng buộc độ dài chuỗi token thô (`RefreshRequest`, `LogoutRequest` trong `AuthModels.cs` không có validator độ dài, nhưng cần rà thêm validator và cấu hình frontend); chuỗi Base64Url của 64 byte dài 86 ký tự.
- **Xong khi:** đăng nhập trả `refreshToken` dài 86 ký tự; làm mới và đăng xuất vẫn hoạt động; token cũ đã phát (32 byte) vẫn dùng được cho đến khi hết hạn vì băm theo chuỗi thô.

## T5. Sinh lại OpenAPI và đồng bộ tài liệu
- **Làm sau T1–T4.**
- **Việc:**
  - Chạy API ở Development, tải `/openapi/v1.json` ghi đè `docs/openapi.v1.json`.
  - Kiểm tra mô tả và mã trạng thái 400/409/422 đã đổi đúng.
  - Sửa comment ở `frontend/src/lib/api/recipe-management.ts` dòng 72 ("ApiError 422" → 409) và comment dòng 37 của `RecipeFormWizard.tsx` ("409 trùng slug" → 422 validation).
  - `docs/BACKEND_REFERENCE.md`, `DESIGN_DECISIONS.md`, `PROJECT_OVERVIEW.md`, `CAU_TRA_LOI_ON_TAP.md` đã được cập nhật trước; chỉ cần đọc lại một lượt cho khớp mã.
- **Xong khi:** `grep -n "422\|409" docs/openapi.v1.json` không còn chỗ nào mâu thuẫn với Bảng 4.2.

## T6. Bổ sung kiểm thử cho các hành vi vừa đổi
- **File:** thêm vào `backend/src/tests/CulinaryBlog.Tests/` (nhóm `Recipes` và `Auth`).
- **Việc:**
  - Test ánh xạ `ConcurrencyConflictException` → 409 và `ValidationException` → 422 ở `GlobalExceptionMiddleware`.
  - Test sinh slug duy nhất: trùng một lần thì có `-2`, trùng hai lần thì có `-3`; sửa công thức không tự trùng với chính mình.
  - Test refresh token sinh ra có 64 byte (độ dài Base64Url 86) và hash 64 ký tự hex.
- **Xong khi:** `dotnet test` xanh, số test tăng lên so với T0.

## T7. Rà từng dòng Bảng 4.2 và 4.3 với mã
- **Việc:** đối chiếu thủ công từng hàng, ghi kết quả "khớp" hoặc "lệch" cạnh mỗi hàng:
  - **Xung đột đồng thời:** 409.
  - **Kiểm tra dữ liệu:** 422.
  - **Slug:** tự thêm hậu tố.
  - **Xóa công thức:** xóa mềm có khôi phục.
  - **Điều kiện xuất bản:** ít nhất 1 bước.
  - **Refresh token:** 64 byte, lưu SHA-256.
  - **Đăng nhập Google:** `idToken`.
  - **Định dạng phản hồi:** `PagedResult` phẳng.
  - **Sắp xếp:** `sort=-field`, mặc định `-createdAt`.
  - **Các mở rộng:** Engagement, quản trị người dùng, tìm kiếm mờ, giới hạn 100/10/5 mỗi phút, 503/504 từ proxy.
- **Xong khi:** mọi hàng đều "khớp". Hàng nào lệch thì sửa mã hoặc sửa báo cáo, không để hai bên khác nhau.

## T8. Chạy thử toàn hệ thống trước khi demo
- **Việc:** `docker compose up -d --build`, seed dữ liệu, `pnpm dev` hoặc `pnpm start`, rồi chạy tay các luồng:
  - đăng ký với dữ liệu sai (thấy lỗi theo trường, 422);
  - đăng nhập, soạn công thức nhiều bước, xuất bản;
  - tạo hai công thức trùng tiêu đề (slug có hậu tố);
  - sửa ở hai tab (hộp thoại xung đột, 409);
  - lưu món và đánh giá;
  - tắt Engagement rồi mở trang chi tiết (vẫn đọc được, lưu/đánh giá báo lỗi);
  - quản trị: đổi vai trò, khóa tài khoản, thử khóa chính mình hoặc quản trị viên cuối cùng (bị chặn).
- **Xong khi:** tất cả luồng chạy đúng; chụp lại ảnh demo mới nếu giao diện đổi, thay vào Chương 6 của báo cáo.

---

## Việc tùy chọn (không bắt buộc cho báo cáo)
- `BAO_CAO_DO_AN_CULINARY_BLOG.docx` còn ghi 409 cho xung đột (chữ và sơ đồ) nên khớp với kết quả sau T2, không cần đổi nếu báo cáo đó vẫn dùng.
- `docs/BAO_CAO_THIET_KE_VA_TICH_HOP_HE_THONG.md` là nguồn markdown của báo cáo cũ, đã lỗi thời; có thể xóa.
- Thêm `backend/src/CulinaryBlog.API/logs/` và `.codex-artifacts/` vào `.gitignore` cho gọn `git status`.
