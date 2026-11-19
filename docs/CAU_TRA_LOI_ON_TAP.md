# Câu trả lời ôn tập cuối kỳ - Culinary Blog

Tài liệu này được soạn theo bộ câu hỏi ôn tập, SRS v1.0.0 và mã nguồn hiện tại của dự án. Cách trả lời ưu tiên dạng vấn đáp: nêu khái niệm, liên hệ thẳng với Culinary Blog, sau đó chỉ ra quyết định thực tế trong code.

> Lưu ý quan trọng: một số tài liệu thiết kế trong repo phản ánh trạng thái cũ. Mã nguồn hiện tại dùng CQRS/MediatR, Redis, Hangfire, PostgreSQL FTS, MinIO/local storage và Next.js 16.3.4. Khi SRS, tài liệu phụ và code khác nhau, phần dưới ghi rõ lựa chọn đang được triển khai.

## PHẦN I - LÝ THUYẾT

### 1. Monolithic Architecture

Monolith đóng gói các chức năng vào một ứng dụng triển khai thống nhất. Ưu điểm là cấu trúc vận hành đơn giản, debug và test end-to-end dễ, giao dịch trong một database thuận tiện, không có độ trễ hay lỗi mạng giữa các service, phù hợp với nhóm nhỏ. Nhược điểm là khi hệ thống lớn lên, thời gian build/deploy tăng, các module dễ phụ thuộc chéo, khó scale riêng một chức năng và một lỗi nghiêm trọng có thể ảnh hưởng toàn bộ tiến trình.

Vẫn nên chọn monolith cho dự án mới khi nghiệp vụ chưa ổn định, nhóm nhỏ, lưu lượng vừa phải, cần ra sản phẩm nhanh và chưa có nhu cầu scale độc lập. Culinary Blog phù hợp với **modular monolith**: một API nhưng chia module Auth, Categories, Recipes, Search, File, Jobs; giữ boundary rõ để có thể tách service sau này nếu có số liệu chứng minh cần thiết.

### 2. Dependency Rule trong Clean Architecture

Dependency Rule yêu cầu phụ thuộc mã nguồn chỉ hướng vào lõi: `API -> Application -> Domain`, còn `Infrastructure -> Application/Domain` để cài đặt các interface. Domain không biết EF Core, HTTP, Redis hay MinIO.

Application không được import Infrastructure vì Application chứa use case và abstraction, còn Infrastructure là chi tiết thay thế được. Trong dự án, Application dùng `IRecipeRepository`, `IUnitOfWork`, `IFileStorageService`, `ICacheService`; Infrastructure mới cài bằng EF Core, MinIO và Redis. Nếu Application tham chiếu ngược Infrastructure, dependency bị đảo chiều, unit test phải kéo theo database/network, khó đổi nhà cung cấp và rất dễ tạo vòng phụ thuộc.

### 3. Khi nào dùng PUT và PATCH?

`PUT` dùng khi client gửi biểu diễn đầy đủ của tài nguyên hoặc một phần tài nguyên có hợp đồng thay thế rõ ràng; gọi lặp lại cùng payload phải cho cùng trạng thái. `PATCH` dùng cho cập nhật một phần hoặc một hành động chuyển trạng thái.

Trong Culinary Blog:

- `PUT /api/v1/recipes/{id}` cập nhật toàn bộ nhóm thông tin chính của recipe và gửi `If-Match` để chống ghi đè.
- `PUT /categories/{id}` cập nhật đầy đủ dữ liệu category theo request model.
- `PATCH /recipes/{id}/publish`, `/unpublish`, `/archive` chỉ đổi trạng thái.
- `PATCH /auth/me` chỉ thay các field hồ sơ được gửi lên.
- `PATCH /recipes/{id}/images/{imageId}` chỉ sửa metadata ảnh.

Không nên dùng PATCH chỉ vì request ngắn; tiêu chí là ngữ nghĩa cập nhật một phần/chuyển trạng thái.

### 4. Cursor-based và Offset-based pagination

Cursor pagination dùng khóa ổn định như `(createdAt, id)` làm mốc cho trang kế tiếp. Nó nhanh và ổn định hơn với bảng lớn, không bị trùng/mất item nhiều như offset khi dữ liệu được chèn giữa hai lần tải. Nhược điểm là khó nhảy thẳng đến trang 20, khó hiển thị tổng số trang và cursor phải được thiết kế theo từng kiểu sắp xếp.

Offset pagination dùng `Skip((page - 1) * pageSize).Take(pageSize)`. Nó đơn giản, hỗ trợ số trang, tổng số bản ghi và phù hợp UI hiện tại. Culinary Blog đang dùng **offset pagination** trong danh sách recipe, search và users, trả `PagedResult` có `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage`. Đây là lựa chọn hợp lý với quy mô SRS khoảng 10.000 recipe; truy vấn còn thêm `ThenBy(Id)` để thứ tự giữa các trang ổn định.

### 5. Vai trò của DTO

DTO là hợp đồng dữ liệu giữa API và client, tách khỏi entity lưu trữ. DTO giúp chỉ công khai field cần thiết, đổi tên/định dạng phù hợp JSON, tránh vòng tham chiếu navigation property, giữ API ổn định khi schema DB đổi và ngăn client ghi các field không được phép như `AuthorId`, `Status`, `RowVersion`, `SecurityStamp`.

Nếu trả entity trực tiếp, API có thể lộ dữ liệu nhạy cảm, serialize cả graph lớn, gặp vòng lặp, tạo over-posting/mass assignment và gắn chặt frontend với EF Core. Dự án hiện map entity sang `RecipeDetailDto`, `RecipeSummaryDto`, `CategoryDto`, `UserDto`; ví dụ entity dùng `PrepTime`, DTO dùng `prepTimeMinutes`.

### 6. Authentication và Authorization

Authentication trả lời “bạn là ai?”, ví dụ kiểm tra email/password hoặc Google ID token rồi cấp JWT. Authorization trả lời “bạn có được làm việc này không?”, dựa trên role, policy và quyền sở hữu tài nguyên.

- Chỉ cần authentication: xem/cập nhật hồ sơ của chính mình qua `/auth/me`, logout.
- Cần cả authentication và authorization: tạo recipe yêu cầu Author/Admin và email đã xác nhận; sửa nội dung yêu cầu owner; publish/unpublish/xóa cho owner hoặc Admin; CRUD category và quản lý user yêu cầu Admin.
- Xem recipe Published và tìm kiếm không cần đăng nhập.

### 7. Tại sao JWT là stateless?

Access token JWT mang claim và chữ ký; server xác minh chữ ký, issuer, audience, expiry mà không cần đọc session theo từng request. Vì vậy **access-token authentication** là stateless. Tuy nhiên toàn hệ thống không hoàn toàn stateless: Culinary Blog vẫn lưu refresh-token hash trong PostgreSQL để rotation, revoke và phát hiện reuse.

Ưu điểm so với session server-side: dễ scale ngang, không cần session store cho mỗi request, phù hợp API/mobile và giảm lookup. Nhược điểm: token bị đánh cắp còn dùng được tới khi hết hạn, khó revoke ngay nếu không có denylist, payload đi theo mọi request và claim có thể cũ. Session truyền thống dễ revoke và dữ liệu nằm server-side, nhưng cần shared session store khi scale và thêm một lần tra cứu. Dự án giảm rủi ro bằng access token 15 phút, refresh token 7 ngày, rotation và revoke.

### 8. Vì sao CORS không phải bảo mật API?

CORS là chính sách do **trình duyệt** thực thi để ngăn JavaScript từ origin không được phép đọc response. Nó không xác thực danh tính và không thay thế authorization, validation hay rate limiting.

Kẻ tấn công có thể gọi API bằng `curl`, Postman, server riêng hoặc ứng dụng native; các client này không bị Same-Origin Policy nên bỏ qua CORS hoàn toàn. Với “simple request”, trình duyệt còn có thể gửi request dù chặn JavaScript đọc response. Vì vậy API vẫn phải kiểm tra JWT, role/ownership, chống CSRF nếu dùng cookie, validate input và rate-limit. CORS của dự án chỉ cho frontend origin và expose `ETag`, `Location`, `Retry-After`.

### 9. Resource-based authorization

Resource-based authorization quyết định quyền dựa trên chính đối tượng được truy cập, không chỉ dựa trên role chung. Trong Culinary Blog, Author có role hợp lệ nhưng chỉ được sửa recipe khi `recipe.AuthorId == currentUserId`; Admin được bypass. Kiểm tra này nằm ở Application qua `RecipeAuthorizationHandler`, nên không thể né bằng cách gọi endpoint trực tiếp.

Ví dụ ngoài dự án: trong hệ thống lưu trữ tài liệu, nhân viên chỉ xem tài liệu do mình sở hữu hoặc được chia sẻ; Manager không mặc nhiên xem mọi tài liệu nếu chưa thuộc phòng ban/quyền chia sẻ phù hợp.

### 10. Repository Pattern phía trên EF Core

Về bản chất `DbContext` đã gần với Unit of Work và `DbSet` gần với Repository, nên không phải dự án nào cũng cần bọc thêm repository. Với Clean Architecture của Culinary Blog, repository có giá trị vì Domain/Application không tham chiếu EF Core: `IRecipeRepository` mô tả đúng truy vấn nghiệp vụ, Infrastructure triển khai bằng `CulinaryBlogDbContext`.

Về testability, handler có thể mock/fake `IRecipeRepository` mà không dựng PostgreSQL; về Dependency Inversion, use case phụ thuộc abstraction chứ không phụ thuộc EF. Đổi persistence hoặc tối ưu truy vấn nằm trong Infrastructure. Đổi lại, repository quá tổng quát dễ chỉ sao chép API của EF và làm tăng boilerplate; vì vậy dự án dùng repository theo aggregate/use case, không cố che toàn bộ LINQ.

### 11. Unit of Work giải quyết gì?

Repository quản lý truy xuất một loại aggregate, nhưng tự nó không đảm bảo nhiều thay đổi được commit cùng một giao dịch. Unit of Work theo dõi các thay đổi qua cùng DbContext và gọi `SaveChangesAsync` một lần: tất cả thành công hoặc rollback.

Ví dụ khi tạo recipe, handler tạo Recipe cùng Nutrition, Ingredients và Steps, gọi repository `AddAsync`, rồi `IUnitOfWork.SaveChangesAsync` đúng một lần. Nếu một constraint thất bại, không có tình trạng recipe được lưu nhưng các phần con bị thiếu. UoW của dự án còn chuyển `DbUpdateConcurrencyException` của EF thành exception ở tầng Application để API không phụ thuộc EF Core.

### 12. Cartesian Explosion và AsSplitQuery

Khi một câu SQL JOIN recipe với hai collection độc lập, mỗi step ghép với mỗi ingredient. Recipe có 10 steps và 15 ingredients sẽ tạo `10 x 15 = 150` rows; dữ liệu recipe bị lặp 150 lần. Nếu JOIN thêm images thì số hàng còn nhân tiếp.

`AsSplitQuery()` tách thành truy vấn recipe và từng collection. Nếu chỉ xét recipe, steps, ingredients thì dữ liệu logic khoảng `1 + 10 + 15 = 26` rows qua nhiều result set, tránh lặp payload khổng lồ. Đổi lại có thêm round trip/query và cần lưu ý tính nhất quán nếu dữ liệu đổi giữa các query. `RecipeRepository.WithDetails()` của dự án đang `Include` Steps, Ingredients, Images, Category, Author và dùng `AsSplitQuery()`.

### 13. React Server Components và Client Components

Server Component chạy trên server, có thể `await` dữ liệu trực tiếp, dùng secret/server API và không đưa code component đó vào JavaScript bundle của browser. Client Component có `"use client"`, được hydrate ở browser và cần cho state, effect, event handler, browser API hoặc hook client.

Trong Culinary Blog, trang Home và trang chi tiết recipe nên là RSC để fetch API, sinh metadata/JSON-LD và giảm bundle. `RecipeGallery`, trang Search tương tác, login/register, profile form, form wizard, nút đổi trạng thái và provider TanStack Query/Auth.js cần Client Component. Quy tắc là giữ cây ở server càng lâu càng tốt rồi tạo “client island” nhỏ tại điểm cần tương tác.

### 14. Auth.js cookie so với localStorage

Cookie `HttpOnly` không thể được đọc bằng `document.cookie`, nên XSS khó lấy trực tiếp token rồi gửi về máy tấn công. `localStorage` đọc được bằng mọi script chạy trong origin; XSS có thể đánh cắp token và dùng ở nơi khác. Cookie nên kèm `Secure`, `SameSite` và vẫn cần phòng CSRF nếu dùng cookie để gọi API thay mặt user.

Trong dự án, Auth.js dùng `session.strategy = "jwt"`; JWT session và refresh token backend nằm trong cookie HttpOnly đã mã hóa. Tuy nhiên callback `session` đưa **accessToken** vào session để Client Component gọi backend. Khi đó JavaScript hợp lệ của trang đọc được access token, nên XSS cũng có thể lợi dụng/đọc token này; lợi ích HttpOnly chỉ còn bảo vệ JWT session và refresh token khỏi việc đọc trực tiếp. Vì vậy access token phải ngắn hạn, không đưa refresh token ra client session, giữ CSP và chống XSS nghiêm ngặt.

### 15. Server State, Client State, URL State và Form State

- **Server State**: dữ liệu do server sở hữu, có loading/error/cache/stale, ví dụ danh sách recipe. TanStack Query phù hợp vì quản lý fetch, cache, retry, invalidation và mutation.
- **Client State**: trạng thái UI chỉ ở browser, ví dụ bước hiện tại và draft tạm của recipe wizard. Zustand phù hợp vì store nhẹ, chia sẻ giữa nhiều component mà không cần prop drilling.
- **URL State**: query tìm kiếm, category, sort, page. URL params phù hợp vì có thể bookmark, back/forward, chia sẻ link và hỗ trợ SSR.
- **Form State**: value, touched/dirty, field error, submit. React Hook Form phù hợp vì hạn chế re-render, hỗ trợ field array và tích hợp Zod.

Không nên sao chép server state vào Zustand hoặc giữ bộ lọc chỉ trong local state vì sẽ tạo hai nguồn sự thật.

### 16. Next.js Image, `sizes` và Core Web Vitals

`next/image` tạo `srcset` gồm nhiều candidate width. Trình duyệt đọc `sizes` theo media query để ước lượng chiều rộng hiển thị, kết hợp device pixel ratio rồi chọn candidate đủ nét nhưng nhỏ nhất. Nếu thiếu/sai `sizes`, browser có thể tải ảnh lớn hơn nhiều so với cần thiết, làm tăng băng thông và LCP. Khai báo kích thước/aspect ratio còn giúp giữ chỗ, giảm CLS.

Next.js 16 deprecate `priority` để tách rõ ý định:

- `preload` chèn link preload trong `<head>`, dùng cho ảnh LCP rõ ràng.
- `fetchPriority="high"` gợi ý browser ưu tiên fetch.
- `loading="eager"` tải ngay; mặc định là lazy.

Code hiện tại đã dùng `sizes`, nhưng vẫn dùng prop `priority` trong Home, RecipeCard và RecipeGallery dù package là Next.js 16.3.4; nên đổi dần sang API mới. Ngoài ra nhiều ảnh backend đang có `unoptimized`, nên Next.js không tự sinh biến thể cho các ảnh đó; thumbnail/medium hiện do Hangfire tạo.

### 17. Logging, Metrics và Distributed Tracing

- **Logging** là sự kiện chi tiết có thời gian và context: “request X lỗi 500 vì timeout”. Dùng để đọc nguyên nhân cụ thể. Dự án dùng Serilog, file/console/Seq và correlation ID.
- **Metrics** là số liệu tổng hợp theo thời gian: request rate, p95 latency, error rate, CPU, số recipe publish. Dùng để phát hiện khi nào và mức độ sự cố. Dự án dùng OpenTelemetry metrics và meter `CulinaryBlog.Recipes`.
- **Tracing** theo một request xuyên qua HTTP, EF Core và outbound HTTP bằng span. Dùng để biết thời gian nằm ở API, query DB hay MinIO. Dự án instrument ASP.NET Core, HttpClient và EF Core, có thể export OTLP.

Khi trang recipe chậm: xem metrics để xác nhận p95 tăng và endpoint nào bị ảnh hưởng; mở trace chậm để thấy span SQL/HTTP nào chiếm thời gian; cuối cùng dùng correlation/trace ID tìm log chi tiết và exception.

### 18. Liveness và Readiness

Liveness trả lời “process có còn sống không?”. Nếu fail, orchestrator có thể restart. Readiness trả lời “instance có sẵn sàng nhận traffic không?”, thường phụ thuộc DB/cache/storage cần thiết; fail thì rút instance khỏi load balancer nhưng không nhất thiết restart.

Nếu chỉ có `/health` và coi database chậm là liveness fail, orchestrator có thể restart hàng loạt instance dù process vẫn tốt, tạo restart loop và làm DB càng quá tải. Dự án tách `/health/live` không chạy dependency check, `/health/ready` chạy check gắn tag `ready` (hiện DB), còn `/health` tổng hợp DB, Redis và MinIO.

### 19. IMemoryCache và IDistributedCache

`IMemoryCache` nằm trong RAM của từng process: rất nhanh nhưng mất khi restart và mỗi instance có một bản riêng. Với 3 instance, request qua load balancer có thể đọc ba giá trị khác nhau; invalidation trên instance A không xóa cache B/C.

`IDistributedCache` đặt dữ liệu ở store chung như Redis, nên ba instance đọc cùng giá trị và invalidation có hiệu lực toàn cụm. Đổi lại có network latency, serialize và phụ thuộc Redis. Culinary Blog dùng `IDistributedCache`/Redis, có TTL và tag invalidation; nếu Redis lỗi, `RedisCacheService` log warning rồi fallback DB thay vì làm hỏng request.

### 20. PostgreSQL Full-Text Search và cấu hình `simple`

Full-Text Search phân tích văn bản thành lexeme trong `tsvector`, phân tích truy vấn thành `tsquery`, dùng GIN index và có thể xếp hạng theo độ liên quan. Dự án tạo SearchVector bằng config `simple`, prefix query `term:*`, kết hợp `unaccent`/trigram để tìm gần đúng và không dấu.

`simple` chủ yếu lower-case và giữ token không phải stop word, nên không áp quy tắc stemming tiếng Anh lên tiếng Việt. `english` có stop-word và stemmer tiếng Anh, không hiểu hình thái tiếng Việt; vì vậy không phù hợp cho corpus tiếng Việt và có thể bỏ/biến đổi các từ tiếng Anh chen trong nội dung theo cách không mong muốn.

Điểm cần trả lời chính xác: trên PostgreSQL 16 của dự án, `to_tsvector('simple', 'phở bò')` và `to_tsvector('english', 'phở bò')` đều cho `'bò':2 'phở':1`; không phải cứ dùng `english` là hai từ này biến mất. Khác biệt thấy rõ với `the phở bò`: `simple` giữ `the`, còn `english` loại `the` là stop word. Lý do chọn `simple` là hành vi trung tính, dự đoán được cho tiếng Việt; `unaccent` mới giải quyết dấu.

## PHẦN II - BÁO CÁO VÀ GIẢI THÍCH MÃ NGUỒN

### 1. Nội dung từng thành viên đã làm

Phần này nên nói ở ngôi thứ nhất và chỉ nhận phần mình thực sự làm. Dựa trên bảng phân công và lịch sử Git hiện có, có thể trình bày ngắn như sau:

#### Phan Lê Xuân Mạnh - Nhóm trưởng

“Em dựng và tích hợp kiến trúc Clean Architecture bốn tầng, cấu hình PostgreSQL/EF Core, dependency injection và composition root. Em phụ trách các phần nền tảng và vận hành như Hangfire jobs, Redis cache, health checks, Serilog/OpenTelemetry, Docker, sitemap; đồng thời tham gia hợp nhất API/frontend, search và sửa các xung đột sau merge. Em cũng bổ sung quản trị user, hoàn thiện một số trang public và kiểm thử cho cache, search, Hangfire dashboard.”

#### Nguyễn Đình Thạch - Recipe Management

“Em phụ trách quản lý công thức: danh sách dashboard, form tạo/sửa nhiều bước, ingredients, steps, nutrition, trạng thái publish/unpublish/archive/delete, ảnh và luồng đồng bộ frontend với API. Em triển khai optimistic concurrency bằng ETag/If-Match ở phía client, TanStack Query hooks, xử lý lỗi Problem Details, các component chi tiết recipe và một phần authorization/OpenAPI/CORS.”

#### Lý Ngọc Thảo Nguyên - Search, File và SEO

“Em phụ trách Full-Text Search tiếng Việt, lọc/phân trang, giao diện search; upload ảnh và MinIO/file lifecycle; trang chi tiết, Schema.org Recipe JSON-LD và tối ưu SEO. Em cũng tham gia hoàn thiện UI quản trị user và recipe image/editor, cấu hình môi trường frontend và kiểm tra health/storage.”

#### Trần Tấn Khải - Authentication

“Em phụ trách đăng ký, đăng nhập, phân quyền, JWT và Google OAuth ở giai đoạn đầu. Phần này sau đó được cả nhóm refactor/hợp nhất sang CQRS/MediatR và Auth.js, nên khi trình bày em sẽ giải thích phần logic mình đóng góp và nêu rõ phần tích hợp cuối do nhóm cùng hoàn thiện.”

> Nên mở `git log --author="Tên" --stat` trước buổi thi và thay câu chữ bằng commit cụ thể của chính người báo cáo. Không nên nhận toàn bộ một module nếu lịch sử Git không chứng minh được.

### 2. Cách giải thích một đoạn mã giáo viên chỉ định

Dùng khung 6 ý sau, không đọc code từng dòng:

1. **Vị trí/tầng:** file thuộc Domain, Application, Infrastructure hay API/frontend.
2. **Đầu vào/đầu ra:** request/command nhận gì, trả DTO/status nào.
3. **Luồng chính:** validation -> authorization -> repository/domain -> Unit of Work -> DTO/cache/job.
4. **Quy tắc nghiệp vụ:** owner/Admin, trạng thái recipe, row version, file type...
5. **Lỗi và edge case:** 400/401/403/404/409/422, cleanup file, retry.
6. **Lý do thiết kế:** Dependency Rule, testability, atomicity, performance, security.

Ví dụ nếu được hỏi `UploadRecipeImageCommandHandler`:

“Đây là handler tầng Application. Nó tải recipe kèm images, kiểm tra owner, kiểm tra magic bytes khớp MIME, rồi gọi abstraction `IFileStorageService`. Sau khi upload, aggregate thêm metadata ảnh và Unit of Work commit. Nếu lưu DB thất bại, handler cố xóa file vừa upload để tránh file mồ côi. Thành công thì evict cache recipes và enqueue thumbnail job. Application không biết MinIO hay local disk vì Infrastructure mới cài interface storage.”

Ví dụ nếu được hỏi `RecipeRepository.WithDetails()`:

“Repository nằm ở Infrastructure vì chứa EF Core. Nó Include Steps, Ingredients, Images, Category, Author và dùng `AsSplitQuery` để tránh Cartesian Explosion. Application chỉ thấy `IRecipeRepository`, không phụ thuộc `DbContext`.”

Ví dụ nếu được hỏi `auth.ts`:

“Auth.js dùng JWT session trong HttpOnly cookie. Credentials provider gọi backend login/register; Google provider gửi ID token cho backend xác minh. Callback JWT giữ access/refresh token phía server, tự gọi refresh trước khi access token hết hạn; session callback chỉ đưa access token và thông tin user cần thiết cho UI, không đưa refresh token ra JavaScript.”

### 3a. Ứng dụng có bao nhiêu module/tính năng?

Cần nói rõ cách đếm để tránh tranh luận:

- Theo **nhóm yêu cầu SRS**, có 7 nhóm: Authentication/User, Categories, Recipes, Search/Pagination, File Management, Background Jobs, Observability/Health.
- Theo **endpoint group hiện tại**, có 8 nhóm: Auth, Users, Categories, Recipes, Recipe Ingredients, Recipe Steps, Recipe Images, Health. Search nằm trong Recipes; Jobs/Cache/Observability là hạ tầng, không phải endpoint nghiệp vụ riêng.
- Frontend có các luồng chính: public discovery/search/detail/random, auth/profile, author recipe dashboard và admin category/user management.

Khi trả lời miệng: “Em xem hệ thống có 7 module chức năng theo SRS; nếu đếm endpoint group triển khai thì là 8 vì Recipe được tách Images, Ingredients, Steps và có thêm Users/Health.”

### 3b. Các mâu thuẫn đã phát hiện trong SRS/tài liệu

Các điểm đáng nhớ nhất:

1. Validation dùng 422 ở nhiều FR nhưng phụ lục/API khác dùng 400.
2. Concurrency conflict có nơi yêu cầu 409, nơi ghi 422.
3. Xóa recipe có chỗ mô tả hard delete/cascade, nhưng data model có `IsDeleted` và yêu cầu soft delete.
4. Publish có nơi chỉ yêu cầu một Step, nơi yêu cầu cả Step và Ingredient.
5. Slug trùng có nơi yêu cầu 409, nơi yêu cầu tự thêm hậu tố.
6. Body đăng ký dùng hai bộ tên khác nhau: `fullName/userName` và `displayName/userName?`.
7. Sort dùng `sort=-createdAt` ở một nơi, nơi khác dùng `sortBy/sortOrder`.
8. Response phân trang có nơi `{data, meta}`, nơi khác là `PagedResult` phẳng.
9. SRS/tài liệu ghi Next.js 14+/15, code hiện dùng Next.js 16.3.4.
10. Một tài liệu quyết định cũ nói giữ Service pattern, nhưng code cuối đã refactor sang CQRS/MediatR.
11. SRS mô tả cookie/localStorage refresh token không nhất quán với API nhận token trong body và Auth.js quản lý cookie.
12. Ping sitemap Google được yêu cầu nhưng endpoint ping đã lỗi thời; code chỉ sinh sitemap.

### 3c. Hướng giải quyết mâu thuẫn và lý do

Nguyên tắc là chọn một hợp đồng duy nhất, ghi vào decision/ADR, cập nhật OpenAPI và test theo hợp đồng đó. Code hiện đang chọn:

| Vấn đề | Quyết định trong code hiện tại | Lý do |
|---|---|---|
| Validation | 400 + RFC 7807 | Thống nhất middleware hiện tại; field errors vẫn rõ ràng |
| Concurrency | 422 | Client hiểu request đúng nhưng row version đã cũ; cần reload |
| Delete recipe | Soft delete DB, enqueue xóa file ảnh | Giữ khả năng audit/khôi phục dữ liệu; dọn object storage bất đồng bộ |
| Publish | Cần ít nhất một Step | Bám FR chi tiết và domain rule hiện tại |
| Slug trùng | 409 Conflict | Không âm thầm đổi URL do người dùng nhập tiêu đề |
| Register | `fullName`, `userName`, `email`, `password` | Khớp UI và validator hiện tại |
| Sort | `sort` với tiền tố `-` | Một tham số, dễ bookmark và validate |
| Pagination | `PagedResult<T>` phẳng | Ít nesting, frontend đã dùng trực tiếp |
| Kiến trúc use case | CQRS/MediatR + validators/behaviors | Khớp SRS và tách command/query rõ |
| Next.js | Theo package thực tế 16.3.4 | Code/package lock là nguồn sự thật triển khai |
| Sitemap ping | Không ping, chỉ sinh sitemap/robots | API ping Google không còn là cơ chế hợp lệ |

Điểm quan trọng là không nói “SRS sai nên code muốn làm gì cũng được”; phải nói nhóm chọn phương án, ghi quyết định và cần Change Request để cập nhật baseline SRS.

### 3d. Tính năng mới so với SRS tóm tắt

Các điểm có thể xem là mở rộng hoặc chi tiết hóa ngoài danh sách FR chính:

- Trang **random recipe** “Không biết ăn gì?”.
- Module **Admin User Management**: danh sách user, đổi role, lock/unlock và xóa user có kiểm soát.
- Endpoint **confirm email** và enforcement email-confirmed trước khi Author thay đổi recipe.
- Profile UX và tự động refresh access token trong Auth.js.
- Search kết hợp FTS prefix với trigram fuzzy và unaccent, mạnh hơn yêu cầu FTS cơ bản.
- Correlation ID và recipe audit behavior cụ thể.
- Local file storage cho development, cùng abstraction với MinIO.
- API versioning/OpenAPI Scalar và ETag/If-Match được tích hợp xuyên backend-frontend.

Trang newsletter ở Home hiện mới là giao diện `action="#"`, **không được tính là tính năng đã làm**.

### 3e. Tính năng/việc chưa làm hoặc chưa hoàn chỉnh

Theo code hiện tại, các FR lõi đã có implementation, nhưng các điểm sau chưa nên tuyên bố hoàn tất tuyệt đối:

- Automated test còn mỏng: mới thấy test cho search, Redis fallback và Hangfire dashboard; chưa phủ đủ toàn bộ Auth, Categories, Recipe CRUD, authorization và integration/E2E như checklist SRS.
- Newsletter trên Home chưa có backend/subscription flow.
- Next.js 16 đã deprecate `priority`, nhưng code vẫn dùng ở vài ảnh.
- Nhiều ảnh backend dùng `unoptimized`; pipeline có thumbnail/medium nhưng frontend chưa tận dụng nhất quán mọi biến thể.
- Tài liệu README/PROJECT_OVERVIEW/DESIGN_DECISIONS có đoạn cũ, chưa đồng bộ hoàn toàn với code cuối.
- Việc xác nhận production readiness như backup/restore, load test, TLS/secret rotation và failover chưa được chứng minh chỉ bằng source hiện tại.

Lý do trình bày phù hợp: ưu tiên hoàn thiện luồng nghiệp vụ chính trong thời gian môn học; các mục còn lại cần thêm thời gian test, hạ tầng triển khai thật và cập nhật tài liệu. Không dùng lý do “không biết làm”.

## PHẦN III - GIẢI QUYẾT VẤN ĐỀ

Khi gặp tính năng mới, trả lời theo thứ tự: yêu cầu và actor -> data model -> API/use case -> authorization/validation -> frontend -> job/cache -> migration/test/observability -> ưu/nhược điểm. Mỗi tính năng phải giữ Dependency Rule: contract/use case ở Application, entity/rule ở Domain, EF/external service ở Infrastructure, route ở API.

### 1. Đăng ký nhận email khi có recipe mới

Giải pháp nhỏ nhất nhưng hoàn chỉnh:

1. Thêm entity `EmailSubscription`: Id, Email chuẩn hóa, Status, ConfirmationTokenHash, CreatedAt, ConfirmedAt, UnsubscribedAt; unique index trên email.
2. Thêm public endpoints `POST /subscriptions`, `GET /subscriptions/confirm`, `POST /subscriptions/unsubscribe`. Luôn trả thông báo chung để tránh dò email.
3. Gửi email double opt-in bằng Hangfire; chỉ người đã confirm mới nhận tin.
4. Khi recipe chuyển sang Published lần đầu, phát domain event hoặc ghi outbox event `RecipePublished`; background job lấy subscriber theo batch và gửi email. Không gửi SMTP ngay trong request publish.
5. Email có link unsubscribe ký token; rate limit form, validate email, chống spam và ghi log số gửi/thất bại.
6. Frontend nối form newsletter hiện có vào API và hiển thị trạng thái “hãy kiểm tra email”.
7. Test duplicate subscribe, token hết hạn, unsubscribe idempotent, retry và không gửi cho Draft/Archived.

Ưu điểm: tái dùng Hangfire/SMTP, request publish nhanh, retry được. Nhược điểm: eventual consistency và phải quản lý consent, bounce, spam reputation. Khi quy mô lớn mới tách nhà cung cấp email/bulk campaign; chưa cần microservice ngay.

### 2. Banner quảng cáo có thu phí

Đây là thay đổi phạm vi lớn vì SRS hiện loại trừ payment, nên trước tiên tạo Change Request, làm rõ vị trí banner, cách tính phí, duyệt nội dung, lịch chạy và báo cáo.

Thiết kế đề xuất:

1. Entity `Advertiser`, `Campaign`, `Banner`, `Placement`, `Invoice/Payment`; Campaign có start/end, budget, pricing model, status và targeting cơ bản.
2. Ảnh banner dùng `IFileStorageService`; Admin duyệt trước khi Active. Validate kích thước, MIME/magic bytes, URL đích HTTPS và chặn `javascript:`/open redirect.
3. API Admin CRUD campaign/banner; API public lấy banner đang active theo placement. Cache danh sách active ở Redis theo TTL ngắn và invalidate khi cập nhật.
4. Chọn banner theo trọng số/budget, nhưng giới hạn frequency per user/session. Impression chỉ tính khi banner thực sự visible; click đi qua redirect endpoint đã validate.
5. Ghi impression/click vào queue/batch thay vì insert đồng bộ từng request; tạo báo cáo và cơ chế chống fraud/bot.
6. Tích hợp cổng thanh toán qua adapter/webhook idempotent; không lưu dữ liệu thẻ. Chỉ kích hoạt campaign sau webhook hợp lệ.
7. Frontend tạo component banner có nhãn “Quảng cáo”, responsive, không gây CLS; thêm CSP và `rel="sponsored noopener"`.
8. Test lịch chạy, budget, concurrency, webhook giả mạo/replay, quyền Admin và tải cao.

Ưu điểm của modular monolith là dùng lại Auth, storage, Redis, jobs; nhược điểm là analytics tải lớn có thể làm nặng DB chính. Khi lưu lượng thực sự cao, tách event/analytics store trước, không tách toàn bộ ngay.

### 3. RSS feed

RSS là tính năng nhẹ, không cần bảng mới:

1. Tạo route `GET /rss.xml` ở Next.js hoặc API.
2. Query các recipe Published mới nhất, giới hạn 20-50 item, sort `PublishedAt desc`.
3. Sinh RSS 2.0 XML với channel title/link/description và item gồm title, canonical URL, description, pubDate, guid, category, image enclosure nếu hợp lệ.
4. Escape XML, dùng URL tuyệt đối, content type `application/rss+xml; charset=utf-8`.
5. Cache/ISR hoặc Redis, thêm ETag/Last-Modified; invalidate/revalidate khi publish/unpublish.
6. Thêm `<link rel="alternate" type="application/rss+xml">` trong metadata và link RSS ở footer.
7. Test XML bằng validator, kiểm tra chỉ Published xuất hiện và ký tự tiếng Việt hợp lệ.

Ưu điểm: ít code, SEO/distribution tốt. Nhược điểm: feed có thể bị scrape; chỉ đưa mô tả ngắn thay vì toàn bộ nội dung nếu cần.

### 4. Chia sẻ lên Facebook, X/Twitter...

Không cần backend mới cho phiên bản đầu:

1. Bảo đảm mỗi recipe có canonical URL công khai, Open Graph/Twitter metadata, ảnh và mô tả đúng.
2. Tạo Client Component `ShareButtons`. Ưu tiên Web Share API trên mobile (`navigator.share`); fallback mở URL chia sẻ của Facebook/X bằng `window.open` với URL/text đã `encodeURIComponent`.
3. Thêm nút copy link và feedback; popup dùng `noopener,noreferrer`.
4. Không gửi access token hay dữ liệu riêng tư vào URL. Chỉ cho chia sẻ Published recipe.
5. Theo dõi click bằng analytics event nếu cần, không block navigation.
6. Test URL có dấu/ký tự đặc biệt, mobile/desktop, popup bị chặn và accessibility của button.

Ưu điểm: nhỏ, không cần SDK mạng xã hội hay quyền OAuth. Nhược điểm: không biết chắc người dùng đã đăng bài; nếu cần thống kê publish thật thì phải tích hợp API/OAuth từng nền tảng, phức tạp hơn nhiều.

### 5. Đánh giá recipe 1-5 sao

1. Thêm entity `RecipeRating`: RecipeId, UserId, Value 1-5, timestamps; unique `(RecipeId, UserId)` và index RecipeId.
2. `PUT /recipes/{id}/rating` để tạo hoặc cập nhật idempotent; `DELETE` để bỏ rating; `GET /recipes/{id}/rating-summary` trả average, count và rating của current user nếu có.
3. Chỉ user đăng nhập được đánh giá; không cho đánh giá recipe không Published. Validate 1-5 ở Application và DB check constraint.
4. Average/count có thể aggregate SQL ở quy mô hiện tại. Nếu đọc rất nhiều, lưu `RatingSum/RatingCount` hoặc cache và cập nhật atomically trong transaction.
5. UI star accessible bằng radio/button, optimistic update nhưng rollback khi lỗi; hiển thị số lượt để tránh hiểu sai average.
6. Cập nhật `aggregateRating` trong Recipe JSON-LD chỉ khi có dữ liệu thật.
7. Migration, authorization tests, duplicate/concurrency tests và test average rounding.

Ưu điểm của một rating/user là hạn chế spam và PUT idempotent. Nhược điểm: bắt buộc đăng nhập làm giảm số lượt; nếu cho Guest rating phải có cơ chế chống gian lận phức tạp hơn.

### 6. Bình luận recipe

1. Entity `Comment`: Id, RecipeId, AuthorId, Body, ParentCommentId optional, Status, timestamps, soft delete; index `(RecipeId, CreatedAt)`.
2. Endpoints: list phân trang cho Published recipe; POST comment; PATCH/DELETE của owner; Admin moderate/hide. Nếu hỗ trợ reply, giới hạn một cấp trước để tránh cây quá phức tạp.
3. Validation độ dài, trim, không nhận HTML hoặc sanitize bằng allowlist; authorization ở Application.
4. Rate limit, email-confirmed, cooldown và report/moderation để chống spam/abuse. Không render bằng `dangerouslySetInnerHTML` nếu lưu plain text.
5. UI dùng TanStack Query infinite/offset pagination, form RHF, optimistic insert có rollback.
6. Có thể enqueue notification cho author, nhưng tách khỏi request.
7. Test XSS payload, quyền sửa/xóa, comment recipe Draft, soft delete, paging và rate limit.

Ưu điểm plain text + một cấp reply là an toàn và đơn giản. Nhược điểm ít tính năng rich text/thread; chỉ nâng cấp khi có yêu cầu thật.

### 7. Trang Liên hệ và form liên hệ

1. Thông tin công ty tĩnh đặt trong config/CMS đơn giản; tạo trang RSC `/contact` có metadata và semantic HTML.
2. Entity `ContactMessage`: Name, Email, Subject, Body, Status, CreatedAt, IpHash/UserId optional. Không lưu IP thô lâu hơn cần thiết.
3. Public `POST /contact-messages`; Admin list/detail/mark-resolved. DTO không cho client set Status.
4. Validate độ dài/email, trim, plain text; rate limit theo IP/email, honeypot và CAPTCHA khi spam tăng.
5. Sau khi commit DB, enqueue Hangfire gửi thông báo cho chủ kênh; request trả mã tham chiếu, không phụ thuộc SMTP.
6. Frontend dùng React Hook Form, hiển thị field errors từ RFC 7807 và trạng thái gửi thành công.
7. Thêm retention policy, quyền xem chỉ Admin, không log body/email nhạy cảm.
8. Test injection/XSS, flood, SMTP failure/retry, authorization và accessibility.

### 8. Câu hỏi thường gặp (FAQ)

Phiên bản nhỏ nhất có thể là dữ liệu tĩnh trong code nếu chỉ vài câu và ít đổi. Nếu Admin cần tự quản lý:

1. Entity `Faq`: Question, Answer, Category, OrderIndex, IsPublished, timestamps.
2. Public `GET /faqs`; Admin CRUD/reorder. Chỉ trả FAQ Published cho Guest.
3. Cache public list ở Redis/Next cache và invalidate khi Admin sửa.
4. Trang RSC `/faq`, dùng heading/button/accordion accessible, hỗ trợ deep link theo id.
5. Thêm JSON-LD `FAQPage` chỉ khi nội dung thật sự hiển thị và tuân thủ quy định search engine.
6. Validate độ dài và sanitize nếu cho rich text; nếu không cần định dạng, lưu plain text/Markdown giới hạn.
7. Migration, CRUD/authorization/cache tests và kiểm tra keyboard/screen reader.

Không nên tạo database/CMS nếu FAQ chỉ có vài câu cố định cho bài môn học; dữ liệu tĩnh là lựa chọn nhỏ hơn và đủ dùng.

### 9. Rủi ro bảo mật của form Liên hệ/Bình luận

| Rủi ro | Cách hạn chế |
|---|---|
| Stored/reflected XSS | Lưu plain text hoặc sanitize allowlist; React escape output; CSP; không dùng `dangerouslySetInnerHTML` tùy tiện |
| SQL injection | EF Core parameterized query; không ghép SQL từ input |
| Spam/DoS | Rate limiting, giới hạn body/file, timeout, honeypot/CAPTCHA, queue email |
| CSRF | SameSite cookie, anti-forgery cho cookie-auth mutation; Bearer token không tự gửi chéo origin nhưng vẫn phải kiểm tra CORS/origin phù hợp |
| Broken authorization/IDOR | Kiểm tra owner/Admin ở Application trên từng resource; không tin `authorId` từ client |
| Mass assignment | Request DTO allowlist; không bind thẳng entity/Status/UserId |
| Email/header injection | Không cho input điều khiển header SMTP; validate email/subject và dùng API thư viện |
| SSRF/open redirect | Không fetch URL do user nhập tùy ý; allowlist scheme/host, chặn private IP; validate redirect target |
| Dữ liệu nhạy cảm/log leakage | Không log body, token, password; mã hóa/TLS, retention và quyền Admin tối thiểu |
| File upload độc hại | Giới hạn size, MIME + magic bytes, random object name, không execute, scan nếu cần |
| Unicode/validation bypass | Chuẩn hóa/trim, giới hạn theo server, DB constraints; không chỉ tin validation frontend |

Nguyên tắc cuối: validation frontend chỉ cải thiện UX; mọi trust boundary phải được validate lại ở backend. CORS không thay thế authentication/authorization và CAPTCHA không thay thế rate limiting.

## Ghi nhớ nhanh trước khi thi

- Kiến trúc thực tế: modular monolith, Clean Architecture, CQRS/MediatR.
- Dependency: API/Infrastructure hướng vào Application/Domain; Domain không biết framework ngoài.
- Pagination: offset, `Skip/Take`, có stable tie-breaker bằng Id.
- Concurrency: ETag/If-Match + RowVersion; code hiện map conflict sang 422.
- Detail query: `AsSplitQuery` để tránh Cartesian Explosion.
- Auth: JWT access token stateless, refresh token stateful và rotate/revoke.
- Authorization: Author role chưa đủ; còn phải email-confirmed và owner/Admin.
- Search: PostgreSQL `simple` + prefix FTS + unaccent/trigram.
- Cache: Redis distributed, lỗi Redis thì fallback DB.
- Jobs: welcome email, delete file, resize image, sitemap 02:00 UTC.
- Frontend: RSC cho data/SEO, Client Component cho tương tác; TanStack Query/Zustand/URL/RHF đúng loại state.
- Đừng nhận newsletter là đã hoàn thành; form Home hiện chưa nối backend.

## Tài liệu kỹ thuật tham khảo

- Next.js Image (Next.js 16): https://nextjs.org/docs/pages/api-reference/components/image
- Auth.js session strategies: https://authjs.dev/concepts/session-strategies
- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
