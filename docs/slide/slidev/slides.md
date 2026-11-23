---
theme: default
title: Culinary Blog - Báo cáo môn học
info: Nhóm 10 - Phát triển ứng dụng Web nâng cao
aspectRatio: 16/9
canvasWidth: 980
colorSchema: light
fonts:
  sans: Be Vietnam Pro
  serif: EB Garamond
  weights: '300,400,500,600,700'
  provider: google
transition: fade
mdc: false
layout: cover
---

<div class="cover-wrap">
  <div class="row" style="align-items:center; justify-content:space-between;">
    <div class="kicker" style="margin:0">Trường Đại học Đà Lạt · Khoa Công nghệ thông tin</div>
    <img src="/img/logo.png" style="width:54px;height:54px" />
  </div>

  <div>
    <div class="kicker">Báo cáo môn học · Phát triển ứng dụng Web nâng cao</div>
    <div class="cover-title">Culinary<br /><em>Blog</em></div>
    <div class="rule"></div>
    <div class="intro" style="font-size:17px">Xây dựng website chia sẻ công thức nấu ăn</div>
  </div>

  <div class="row" style="justify-content:space-between; align-items:flex-end;">
    <div class="team">
      <div><b>Phan Lê Xuân Mạnh</b><br />2312686</div>
      <div><b>Nguyễn Đình Thạch</b><br />2314506</div>
      <div><b>Lý Ngọc Thảo Nguyên</b><br />2312700</div>
      <div><b>Trần Tấn Khải</b><br />2312642</div>
    </div>
    <div class="small muted" style="text-align:right">
      Nhóm 10 · GVHD: Nguyễn Duy Khánh<br />Đà Lạt, tháng 11/2026
    </div>
  </div>
</div>

<!--
Chào thầy và các bạn. Nhóm 10 trình bày Culinary Blog: website chia sẻ công thức nấu ăn.
Phần của nhóm gồm: tổng quan, thiết kế hệ thống, các luồng nghiệp vụ chính, demo, kết luận.
-->

---

<div class="kicker">01 · Tổng quan đề tài</div>

# Lý do, mục tiêu và phạm vi

<p class="intro">Công thức là nội dung có cấu trúc (nguyên liệu, định lượng, các bước, ảnh) phục vụ nhiều vai trò: bài toán quản lý nội dung có phân quyền, tìm kiếm và xử lý tệp.</p>

<div class="grid cols-3 mt-2">
  <div class="card tint">
    <div class="tag">Sản phẩm</div>
    <div class="title">Website đầy đủ vai trò</div>
    <p>Khách xem, tìm, lọc; tác giả soạn và quản lý công thức; quản trị viên quản lý danh mục, người dùng; lưu món và đánh giá 1–5 sao.</p>
  </div>
  <div class="card">
    <div class="tag">Kỹ thuật</div>
    <div class="title">Kiến trúc rõ ràng</div>
    <p>Clean Architecture và CQRS để quy tắc nghiệp vụ không phân tán; tách chức năng tương tác thành dịch vụ riêng.</p>
  </div>
  <div class="card">
    <div class="tag">Học tập</div>
    <div class="title">Làm việc nhóm</div>
    <p>Git theo nhánh chức năng, thống nhất hợp đồng API, đối chiếu thiết kế với SRS và giải thích khác biệt.</p>
  </div>
</div>

<div class="callout mt-2"><b>Phạm vi:</b> ứng dụng web theo SRS v1.0.0. <b>Ngoài phạm vi:</b> bình luận, nhắn tin, thanh toán, ứng dụng di động, GraphQL.</div>

---

<div class="kicker">01 · Tổng quan đề tài</div>

# Công nghệ sử dụng

<div class="grid mt-2" style="gap:10px">
  <div class="card row" style="align-items:center">
    <div style="width:130px"><div class="tag">Frontend</div></div>
    <div><span class="chip fill">Next.js 16 · App Router</span><span class="chip">React 19</span><span class="chip">TypeScript</span><span class="chip">Tailwind CSS</span><span class="chip">Auth.js</span><span class="chip">TanStack Query</span></div>
  </div>
  <div class="card row" style="align-items:center">
    <div style="width:130px"><div class="tag">Backend chính</div></div>
    <div><span class="chip fill">.NET 10 Minimal APIs</span><span class="chip">MediatR · CQRS</span><span class="chip">FluentValidation</span><span class="chip">ASP.NET Identity</span><span class="chip">JWT</span></div>
  </div>
  <div class="card row" style="align-items:center">
    <div style="width:130px"><div class="tag">Engagement</div></div>
    <div><span class="chip fill">.NET 10</span><span class="chip">EF Core</span><span class="chip">PostgreSQL riêng</span><span class="chip">Lưu món · Đánh giá</span></div>
  </div>
  <div class="card row" style="align-items:center">
    <div style="width:130px"><div class="tag">Dữ liệu và nền</div></div>
    <div><span class="chip fill">PostgreSQL 16 · full-text · pg_trgm</span><span class="chip">Redis</span><span class="chip">MinIO</span><span class="chip">Hangfire</span><span class="chip">Serilog + Seq</span><span class="chip">OpenTelemetry</span><span class="chip">Docker Compose · Nginx</span></div>
  </div>
</div>

---

<div class="kicker">01 · Tổng quan đề tài</div>

# Phân công theo mô-đun

<div class="grid cols-4 mt-2">
  <div class="card tint">
    <div class="tag">Kiến trúc · DevOps</div>
    <div class="title">Phan Lê Xuân Mạnh</div>
    <p>Khung kiến trúc, dữ liệu mẫu, job nền, logging, Docker, Engagement.</p>
  </div>
  <div class="card">
    <div class="tag">Recipe</div>
    <div class="title">Nguyễn Đình Thạch</div>
    <p>CRUD công thức, ảnh, nguyên liệu, các bước, biểu mẫu nhiều bước.</p>
  </div>
  <div class="card">
    <div class="tag">Search · File · SEO</div>
    <div class="title">Lý Ngọc Thảo Nguyên</div>
    <p>Tìm kiếm và lọc, tải và xử lý ảnh, tối ưu SEO.</p>
  </div>
  <div class="card">
    <div class="tag">Auth · Category</div>
    <div class="title">Trần Tấn Khải</div>
    <p>Đăng ký, đăng nhập, Google OAuth, phân quyền, danh mục.</p>
  </div>
</div>

<div class="callout mt-3">Cả bốn mô-đun đều hoàn thành; mỗi người làm cả backend lẫn frontend cho phần của mình.</div>

---

<div class="kicker">02 · Phân tích yêu cầu</div>

# Ba tác nhân, ba lớp phân quyền

<div class="grid cols-2 mt-2" style="gap:22px">
  <div class="grid" style="gap:10px">
    <div class="card"><div class="tag">Khách</div><p>Xem công thức đã xuất bản, danh mục, kết quả tìm kiếm và điểm đánh giá.</p></div>
    <div class="card"><div class="tag">Tác giả</div><p>Tạo, sửa, xuất bản, lưu trữ, xóa, khôi phục công thức của mình; quản lý ảnh, nguyên liệu, bước; lưu món, đánh giá.</p></div>
    <div class="card"><div class="tag">Quản trị viên</div><p>Xem mọi công thức, xuất bản hoặc đưa về nháp, xóa; quản lý danh mục và người dùng.</p></div>
  </div>
  <div class="grid" style="gap:10px; align-content:center">
    <div class="card dark"><div class="tag" style="color:var(--peach)">Lớp 1</div><div class="title">Theo vai trò</div><p>Author, Admin: chặn ngay tại endpoint.</p></div>
    <div class="card dark"><div class="tag" style="color:var(--peach)">Lớp 2</div><div class="title">Theo tài nguyên</div><p>Chỉ sửa công thức của mình (<code>RecipeAuthorizationHandler</code>).</p></div>
    <div class="card dark"><div class="tag" style="color:var(--peach)">Lớp 3</div><div class="title">Theo chính sách</div><p>Phải xác nhận email trước khi thao tác.</p></div>
  </div>
</div>

---

<div class="kicker">02 · Phân tích yêu cầu</div>

# Vòng đời công thức

<div class="row mt-2" style="align-items:center; justify-content:center; gap:10px">
  <div class="card center" style="width:230px"><span class="pill draft">Draft</span><p class="mt-1">Mới tạo; chỉ chủ sở hữu và quản trị viên thấy.</p></div>
  <div class="arrow">⇄</div>
  <div class="card center" style="width:230px"><span class="pill pub">Published</span><p class="mt-1">Cần ít nhất 1 bước; hiển thị công khai.</p></div>
  <div class="arrow">→</div>
  <div class="card center" style="width:230px"><span class="pill arc">Archived</span><p class="mt-1">Ẩn khỏi danh sách công khai, giữ dữ liệu.</p></div>
</div>

<div class="callout mt-2">Xóa là <b>xóa mềm</b> (<code>IsDeleted</code>) nên khôi phục được · mọi thao tác chuyển trạng thái đều <b>idempotent</b>.</div>

<div class="grid cols-3 mt-2">
  <div class="card"><div class="tag">Bảo mật</div><p>PBKDF2; access token 15 phút, refresh token 7 ngày quay vòng; giới hạn tần suất.</p></div>
  <div class="card"><div class="tag">Tin cậy dữ liệu</div><p>Không ghi đè thầm lặng khi sửa đồng thời; lỗi thống nhất theo ProblemDetails.</p></div>
  <div class="card"><div class="tag">Thay thế · SEO</div><p>Ứng dụng chỉ phụ thuộc interface; trang công khai render server, JSON-LD, sitemap.</p></div>
</div>

---

<div class="kicker">03 · Thiết kế hệ thống</div>

# Kiến trúc tổng thể

<div class="row" style="gap:20px; align-items:center; margin-top:6px">
  <div class="shot" style="flex:1.7"><img src="/img/architecture.png" /></div>
  <div style="flex:1" class="grid">
    <div class="card"><div class="tag">Cổng vào duy nhất</div><p>Nginx kết thúc TLS, chuyển <code>/*</code> tới frontend và <code>/api/*</code> tới API chính.</p></div>
    <div class="card"><div class="tag">Cụm lõi</div><p>API chính (Gateway/BFF) cùng PostgreSQL lõi; Hangfire và OpenTelemetry chạy trong tiến trình.</p></div>
    <div class="card tint"><div class="tag">Cụm Engagement</div><p>Dịch vụ riêng với PostgreSQL riêng, chỉ nhận request qua proxy nội bộ.</p></div>
  </div>
</div>

---

<div class="kicker">03 · Thiết kế hệ thống</div>

# Modular monolith thay cho phân tầng thuần

<p class="intro">Giữ <b>4 project</b> để trình biên dịch ép chiều phụ thuộc (API → Application → Domain; Infrastructure → Application/Domain), rồi chia mỗi tầng theo mô-đun: <b>Auth, Categories, Recipes, Users</b>.</p>

<table class="tbl mt-2">
  <thead><tr><th>Tiêu chí</th><th>Phân tầng thuần</th><th class="pick">Modular monolith (chọn)</th><th>Microservices toàn phần</th></tr></thead>
  <tbody>
    <tr><td>Tổ chức mã</td><td>Theo loại kỹ thuật, tính năng rải nhiều nơi</td><td class="pick">Theo nghiệp vụ trong từng tầng</td><td>Mỗi dịch vụ một project</td></tr>
    <tr><td>Ranh giới</td><td>Không rõ, dễ phụ thuộc chéo</td><td class="pick">Rõ theo thư mục mô-đun</td><td>Rõ, ép bằng mạng</td></tr>
    <tr><td>Giao dịch dữ liệu</td><td>Một CSDL, đơn giản</td><td class="pick">Một CSDL, đơn giản</td><td>Nhiều CSDL, nhất quán cuối cùng</td></tr>
    <tr><td>Vận hành, quy mô</td><td>Một ứng dụng; khó mở rộng</td><td class="pick">Một ứng dụng; phù hợp nhóm 4 người</td><td>Nhiều dịch vụ; quá nặng</td></tr>
  </tbody>
</table>

<div class="callout mt-2">Công thức + nguyên liệu + bước + ảnh là <b>một aggregate</b> cần giao dịch và kiểm soát đồng thời chung, nên không tách microservices. <span class="muted">Giới hạn hiện tại: ranh giới mô-đun ở mức thư mục, chưa ép bằng compiler (xem hướng phát triển).</span></div>

<!--
Chủ động nói giới hạn: đây là modular monolith ở mức tổ chức mã. Vẫn dùng chung một DbContext và Recipe tham chiếu trực tiếp Category, ApplicationUser.
Nếu bị hỏi: hướng phát triển là tách project theo mô-đun hoặc thêm kiểm tra kiến trúc tự động.
-->

---

<div class="kicker">03 · Thiết kế hệ thống</div>

# Tách dịch vụ Engagement

<div class="grid cols-2" style="gap:20px; margin-top:6px">
  <div>
    <h2>Chỉ tách khi đủ ba điều kiện</h2>
    <div class="grid mt-1" style="gap:8px">
      <div class="card step"><div class="num">1</div><p>Có dữ liệu <b>thuộc riêng</b> nó.</p></div>
      <div class="card step"><div class="num">2</div><p><b>Không cần giao dịch chung</b> với công thức.</p></div>
      <div class="card step"><div class="num">3</div><p>Ngừng hoạt động <b>không làm hỏng chức năng cốt lõi</b>.</p></div>
    </div>
    <h2 class="mt-2">Luồng lưu món / chấm sao</h2>
    <div class="small" style="line-height:1.9">
      <span class="chip fill">PUT /saved-recipes/{id}</span>→
      <span class="chip">API chính (proxy)</span>→
      <span class="chip">xác nhận Published qua HTTP</span>→
      <span class="chip green">upsert (UserId, RecipeId)</span>
    </div>
  </div>
  <div>
    <table class="tbl">
      <thead><tr><th>Quyết định</th><th>Được</th><th>Mất</th></tr></thead>
      <tbody>
        <tr><td>CSDL riêng</td><td>Thay đổi độc lập</td><td>Không join; dùng bản chụp</td></tr>
        <tr><td>Dùng chung JWT</td><td>Không cần dịch vụ xác thực thứ hai</td><td>Phải cấu hình cùng khóa, issuer</td></tr>
        <tr><td>Xác nhận Published qua HTTP</td><td>Không lộ công thức chưa công khai</td><td>Phụ thuộc mạng: 503/504</td></tr>
        <tr><td>Bản chụp công thức</td><td>Danh sách đã lưu không gọi API từng món</td><td>Có thể cũ đến lần làm mới</td></tr>
      </tbody>
    </table>
    <div class="callout mt-2"><b>Chức năng cốt lõi không phụ thuộc Engagement:</b> API chính chỉ định tuyến (proxy) tới nó. Engagement ngừng thì vẫn đọc và tìm công thức bình thường; chỉ phần lưu món và số sao tạm ẩn.</div>
  </div>
</div>

<!--
Nói thẳng: đây là dịch vụ tách riêng cho một bounded context, chưa phải microservices đầy đủ.
Engagement gọi ngược API chính để xác nhận công thức đã xuất bản, dùng chung khóa JWT, và lưu bản chụp dữ liệu công thức.
Hướng phát triển: đọc theo lô hoặc theo sự kiện, retry và circuit breaker, khóa bất đối xứng.
-->

---

<div class="kicker">04 · Luồng nghiệp vụ</div>

# Kiểm soát cập nhật đồng thời

<p class="intro">Hai người cùng sửa một công thức: lần lưu sau <b>không được ghi đè thầm lặng</b> thay đổi của lần lưu trước.</p>

<div class="row mt-3" style="gap:8px; align-items:stretch">
  <div class="card" style="flex:1"><div class="num">1</div><div class="title mt-1">Tải bản sửa</div><p>Nhận <code>ETag</code> = <code>RowVersion</code>.</p></div>
  <div class="arrow">→</div>
  <div class="card" style="flex:1"><div class="num">2</div><div class="title mt-1">Gửi PUT</div><p>Kèm header <code>If-Match</code>.</p></div>
  <div class="arrow">→</div>
  <div class="card" style="flex:1"><div class="num">3</div><div class="title mt-1">Kiểm tra</div><p>Dữ liệu và quyền sở hữu.</p></div>
  <div class="arrow">→</div>
  <div class="card tint" style="flex:1"><div class="num">4</div><div class="title mt-1">So sánh</div><p>EF Core đưa <code>RowVersion</code> vào điều kiện cập nhật.</p></div>
</div>

<div class="grid cols-2 mt-3" style="gap:16px">
  <div class="card" style="border-color:#b9d5c8; background:#eef6f2">
    <span class="pill pub">Khớp</span>
    <div class="title mt-1">Lưu thay đổi</div>
    <p>Trả <code>ETag</code> mới; <code>AuditInterceptor</code> đổi <code>RowVersion</code> sang giá trị mới.</p>
  </div>
  <div class="card tint">
    <span class="pill arc">Không khớp</span>
    <div class="title mt-1">409 RECIPE_CONCURRENCY_CONFLICT</div>
    <p>Giao diện hỏi tải bản mới nhất, thay các thay đổi chưa lưu trong form.</p>
  </div>
</div>

<!--
PostgreSQL không tự sinh rowversion như SQL Server, nên AuditInterceptor đổi RowVersion sang Guid mới mỗi lần lưu.
Câu UPDATE có WHERE RowVersion = giá trị cũ; không khớp dòng nào thì EF báo lỗi, chống ghi đè kể cả khi hai request đến cùng lúc.
-->

---

<div class="kicker">04 · Luồng nghiệp vụ</div>

# Phiên đăng nhập: refresh token quay vòng

<div class="grid cols-3 mt-1">
  <div class="card"><div class="num">1</div><div class="title mt-1">Đăng nhập</div><p>Cấp <b>access token 15 phút</b> và <b>refresh token 7 ngày</b> (64 byte ngẫu nhiên). Cơ sở dữ liệu chỉ lưu <b>SHA-256</b>.</p></div>
  <div class="card"><div class="num">2</div><div class="title mt-1">Làm mới</div><p>Frontend làm mới khi access token còn dưới 30 giây. Token cũ bị thu hồi, token mới được cấp (<b>quay vòng</b>).</p></div>
  <div class="card tint"><div class="num alt">3</div><div class="title mt-1">Phát hiện dùng lại</div><p>Token đã thay thế mà vẫn bị đem dùng: coi như bị lộ, <b>thu hồi mọi token đang hiệu lực</b> của người dùng.</p></div>
</div>

<div class="grid cols-2 mt-2" style="gap:16px">
  <div class="card dark"><div class="tag" style="color:var(--peach)">Vì sao an toàn</div>
    <ul><li>Lộ cơ sở dữ liệu không dùng được token (chỉ có hash).</li><li>Access token ngắn hạn giảm rủi ro khi bị đánh cắp.</li><li>Đăng xuất và đổi mật khẩu đều thu hồi refresh token.</li></ul>
  </div>
  <div class="card"><div class="tag">Lớp bảo vệ kèm theo</div>
    <p>Giới hạn theo IP: <b>10/phút</b> cho đăng nhập, <b>5/phút</b> cho tải ảnh, <b>100/phút</b> chung, trả <code>429</code> kèm <code>Retry-After</code>. Khóa tạm tài khoản khi sai mật khẩu nhiều lần.</p>
  </div>
</div>

---

<div class="kicker">04 · Luồng nghiệp vụ</div>

# Tìm kiếm tiếng Việt không dấu

<div class="row mt-2" style="gap:8px; align-items:center">
  <div class="card center" style="flex:.8"><div class="tag">Gõ</div><div class="serif" style="font-size:22px">pho</div></div>
  <div class="arrow">→</div>
  <div class="card center" style="flex:1.2"><div class="tag">Chuẩn hóa</div><p>Chữ thường, bỏ dấu, <code>đ → d</code></p></div>
  <div class="arrow">→</div>
  <div class="card center" style="flex:1.6"><div class="tag">Hai cách khớp</div><p>Full-text <code>pho:*</code> (GIN, tiền tố) <b>hoặc</b> <code>pg_trgm</code> gần giống</p></div>
  <div class="arrow">→</div>
  <div class="card center tint" style="flex:1.1"><div class="tag">Xếp hạng</div><p><code>ts_rank</code> + độ tương đồng trigram</p></div>
</div>

<div class="callout mt-2">Chỉ trả công thức <b>Published</b>; lọc theo danh mục, độ khó, thời gian nấu; sắp xếp và phân trang ổn định. Kết quả demo: gõ <b>“pho”</b> ra <b>“Phở bò tái”</b>.</div>

<div class="grid cols-3 mt-2">
  <div class="card"><div class="tag">Ảnh</div><p><code>IFileStorageService</code> (local hoặc MinIO); kiểm tra đuôi, 5 MB và magic bytes trước khi lưu.</p></div>
  <div class="card"><div class="tag">Job nền · Hangfire</div><p>Thumbnail 300×300 và 800×600, email chào mừng và đặt lại mật khẩu, bản tin hằng tuần, sitemap, dọn tệp.</p></div>
  <div class="card"><div class="tag">Quan sát</div><p>Lỗi luôn có <code>traceId</code>; Serilog → console, tệp, Seq; OpenTelemetry; <code>/health/live</code>, <code>/health/ready</code>.</p></div>
</div>

---

<div class="kicker">04 · Luồng nghiệp vụ</div>

# Chất lượng và vận hành

<div class="grid cols-3 mt-2">
  <div class="card tint">
    <div class="tag">Kiểm thử</div>
    <div class="title">Chạy trên hệ thống thật</div>
    <ul>
      <li>Test tích hợp: toàn bộ pipeline trên PostgreSQL tạm (Testcontainers)</li>
      <li>E2E Playwright: đăng ký, đăng nhập, tạo, xuất bản, tìm kiếm</li>
      <li>Test đơn vị cho handler Auth, Category, Search, lịch job</li>
    </ul>
  </div>
  <div class="card">
    <div class="tag">CI</div>
    <div class="title">GitHub Actions</div>
    <ul>
      <li>Backend: build với <code>-warnaserror</code> và chạy test</li>
      <li>Frontend: type-check, lint, build</li>
      <li>E2E chạy khi bấm tay</li>
    </ul>
  </div>
  <div class="card">
    <div class="tag">Triển khai</div>
    <div class="title">Docker Compose</div>
    <ul>
      <li>Nginx + TLS làm cổng vào, frontend, API, Engagement, PostgreSQL ×2, Redis, MinIO, Seq</li>
      <li>Bản production: bí mật từ <code>.env.production</code>, không mở cổng DB</li>
      <li>Sao lưu <code>pg_dump</code> mỗi 03:00, giữ 30 ngày</li>
    </ul>
  </div>
</div>

<div class="callout mt-2">Redis nằm sau <code>ICacheService</code>: Redis lỗi thì coi như cache miss, ứng dụng vẫn chạy. <code>SavedRecipe</code> và <code>Rating</code> có khóa duy nhất (UserId, RecipeId) nên lưu là <b>upsert</b>.</div>

---

<div class="kicker">05 · Demo sản phẩm</div>

# Demo: khu vực công khai

<div class="grid cols-2 mt-1" style="gap:20px">
  <div><div class="shot"><img src="/img/demo-search.png" /></div><div class="cap">Tìm kiếm “pho” không dấu trả về “Phở bò tái”</div></div>
  <div><div class="shot"><img src="/img/demo-detail.png" /></div><div class="cap">Trang chi tiết công thức</div></div>
</div>

<div class="callout mt-2">Điểm cần chỉ cho thầy: gõ <b>không dấu</b> vẫn ra đúng món; mỗi món có ảnh, nguyên liệu, các bước, số sao và nút lưu.</div>

<!--
LƯU Ý: ảnh chụp cũ, món “Phở bò tái” đang hiện ảnh pizza vì chụp trước khi seed ảnh riêng cho từng món.
Nên chụp lại sau khi chạy seed mới (commit “ảnh riêng cho từng món”).
-->

---

<div class="kicker">05 · Demo sản phẩm</div>

# Demo: khu vực tác giả và quản trị

<div class="grid cols-2 mt-1" style="gap:20px">
  <div><div class="shot"><img src="/img/demo-wizard.png" /></div><div class="cap">Biểu mẫu tạo công thức nhiều bước</div></div>
  <div><div class="shot"><img src="/img/demo-admin.png" /></div><div class="cap">Trang quản trị người dùng</div></div>
</div>

<div class="callout mt-2">Biểu mẫu 4 bước lưu nháp trong trình duyệt (không mất khi tải lại); quản trị viên đổi vai trò, khóa/mở khóa, xóa người dùng.</div>

---

<div class="kicker">06 · Kết luận</div>

# Kết luận và hướng phát triển

<div class="grid cols-2 mt-1" style="gap:20px">
  <div class="card tint">
    <div class="title">Đã đạt được</div>
    <ul>
      <li><b>Modular monolith</b>: bốn tầng ép chiều phụ thuộc, chia mã theo mô-đun nghiệp vụ</li>
      <li><b>Engagement</b> tách riêng; chức năng cốt lõi không phụ thuộc vào nó</li>
      <li>Cơ chế cụ thể cho phân quyền tài nguyên, sửa đồng thời, refresh token quay vòng, tìm kiếm không dấu, kiểm tra ảnh</li>
      <li>Test tích hợp, E2E và CI; triển khai bằng Docker Compose với Nginx + TLS</li>
    </ul>
  </div>
  <div class="card">
    <div class="title">Hướng phát triển</div>
    <ul>
      <li>Củng cố ranh giới mô-đun: tách project hoặc kiểm tra kiến trúc tự động</li>
      <li>Engagement đọc trạng thái theo lô hoặc qua sự kiện; retry và circuit breaker</li>
      <li>Khóa JWT bất đối xứng thay cho khóa dùng chung</li>
      <li>Lưu trữ ảnh và tìm kiếm: ứng viên tách dịch vụ tiếp theo</li>
    </ul>
  </div>
</div>

---
layout: end
---

<div class="cover-wrap" style="justify-content:center; align-items:center; text-align:center">
  <div class="kicker">Culinary Blog · Báo cáo môn học</div>
  <div class="cover-title" style="font-size:64px">Cảm ơn thầy và các bạn<br /><em>đã lắng nghe</em></div>
  <div class="rule"></div>
  <div class="intro">Rất mong nhận được câu hỏi và góp ý.</div>
  <div class="small muted mt-2">Mã nguồn: github.com/xuanmanhneee/culinary-blog</div>
</div>

---

<div class="kicker">Phụ lục</div>

# Phụ lục A · Thay đổi so với SRS gốc

<table class="tbl compact">
  <thead><tr><th>Bất cập</th><th>SRS gốc</th><th>Cách giải quyết</th></tr></thead>
  <tbody>
    <tr><td>Xung đột đồng thời</td><td>Chỗ ghi 409, chỗ ghi 422</td><td>409 <code>RECIPE_CONCURRENCY_CONFLICT</code></td></tr>
    <tr><td>Lỗi kiểm tra dữ liệu</td><td>Chỗ ghi 422, chỗ ghi 400</td><td>422 kèm lỗi từng trường; 400 cho sai cú pháp hoặc vi phạm quy tắc</td></tr>
    <tr><td>Slug trùng</td><td>409 hay tự thêm hậu tố</td><td>Tự thêm hậu tố số (-2, -3…) cho đến khi duy nhất</td></tr>
    <tr><td>Xóa công thức</td><td>Xóa cứng hay xóa mềm</td><td>Xóa mềm, có danh sách đã xóa và khôi phục</td></tr>
    <tr><td>Điều kiện xuất bản</td><td>1 bước, hay 1 bước + 1 nguyên liệu</td><td>Chỉ cần ít nhất 1 bước (<code>RECIPE_PUBLISH_INCOMPLETE</code>)</td></tr>
    <tr><td>Refresh token</td><td>512-bit hay 128-bit</td><td>64 byte ngẫu nhiên, chỉ lưu SHA-256, quay vòng khi dùng</td></tr>
    <tr><td>Định dạng phản hồi</td><td>Có chỗ bọc { data, meta }</td><td>Không bọc; danh sách trả <code>PagedResult</code> phẳng</td></tr>
    <tr><td>Tham số sắp xếp</td><td><code>sort=-field</code> và <code>sortBy/sortOrder</code></td><td>Chỉ <code>sort=-field</code>, mặc định <code>-createdAt</code></td></tr>
  </tbody>
</table>

---

<div class="kicker">Phụ lục</div>

# Phụ lục B · Ngoài SRS và chưa theo nguyên văn

<div class="grid cols-2" style="gap:20px; margin-top:6px">
  <div>
    <h2>Mở rộng ngoài SRS</h2>
    <table class="tbl">
      <tbody>
        <tr><td>Engagement</td><td>Lưu món, đánh giá 1–5 sao, điểm trung bình, tab Món đã lưu</td></tr>
        <tr><td>Quản trị người dùng</td><td>Đổi vai trò, khóa/mở khóa, xóa; không tự khóa mình, giữ admin cuối</td></tr>
        <tr><td>Tìm kiếm mờ</td><td>Full-text + pg_trgm, gõ không dấu hoặc sai nhẹ vẫn thấy</td></tr>
        <tr><td>Tài khoản</td><td>Quên/đổi mật khẩu, ảnh đại diện, nhận bản tin</td></tr>
        <tr><td>Quản lý tác vụ nền</td><td>Trang admin: xem lịch, đổi cron, chạy ngay, hẹn giờ một lần</td></tr>
      </tbody>
    </table>
  </div>
  <div>
    <h2>Chưa theo nguyên văn</h2>
    <div class="grid" style="gap:10px">
      <div class="card"><div class="tag">Nginx + TLS</div><p>Đã có trong Compose; chứng chỉ tự ký khi phát triển, dùng chứng chỉ thật khi triển khai.</p></div>
      <div class="card"><div class="tag">Ping sitemap</div><p>Bỏ vì endpoint của Google đã ngừng; vẫn sinh <code>sitemap.xml</code> hằng tuần (02:00 UTC).</p></div>
      <div class="card"><div class="tag">Google OAuth</div><p>Chỉ bật khi có Client ID ở cả frontend và backend.</p></div>
    </div>
  </div>
</div>

---

<div class="kicker">Phụ lục</div>

# Phụ lục C · Yêu cầu chức năng

<table class="tbl">
  <thead><tr><th>Nhóm</th><th>Nội dung chính</th><th>Hiện trạng</th></tr></thead>
  <tbody>
    <tr><td>FR-AUTH</td><td>Đăng ký, đăng nhập, Google OAuth, làm mới và thu hồi refresh token, hồ sơ, quên/đổi mật khẩu</td><td><span class="pill pub">Đã cài đặt</span></td></tr>
    <tr><td>FR-CAT</td><td>Danh sách, chi tiết, tạo, sửa, xóa mềm danh mục</td><td><span class="pill pub">Đã cài đặt</span></td></tr>
    <tr><td>FR-RCP</td><td>Lọc, chi tiết, bản nháp, sửa có kiểm soát đồng thời, xuất bản, lưu trữ, xóa mềm, khôi phục, ảnh, nguyên liệu, bước</td><td><span class="pill pub">Đã cài đặt</span></td></tr>
    <tr><td>FR-SRCH</td><td>Tìm kiếm toàn văn tiếng Việt không dấu, lọc, sắp xếp, phân trang</td><td><span class="pill pub">Đã cài đặt</span></td></tr>
    <tr><td>FILE · JOB · OBS</td><td>Tải ảnh có kiểm tra; email, ảnh thu nhỏ, sitemap, bản tin chạy nền; health check, log, trace</td><td><span class="pill pub">Đã cài đặt</span></td></tr>
    <tr><td>Engagement</td><td>Lưu và bỏ lưu món, đánh giá 1–5 sao</td><td><span class="pill arc">Đã cài đặt (ngoài SRS)</span></td></tr>
  </tbody>
</table>
