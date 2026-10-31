using CulinaryBlog.API.Endpoints;
using CulinaryBlog.API.Middleware;
using CulinaryBlog.Application;
using CulinaryBlog.Infrastructure;
using CulinaryBlog.Infrastructure.Modules.BackgroundJobs;
using CulinaryBlog.Infrastructure.Modules.Persistence;
using Scalar.AspNetCore;
using CulinaryBlog.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Keep local development logs on the console; Windows EventLog may require
// administrator permissions and can mask the original database exception.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Không gọi builder.Services.AddOpenApi(): AddApiVersioning().AddOpenApi() đã đăng ký dịch vụ
// OpenAPI biết về phiên bản (AV0029).

builder.Services.AddApplicationServices();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// API versioning theo URL segment (/api/v1/...) kèm sinh tài liệu OpenAPI riêng cho mỗi phiên bản
// (đã đăng ký JWT Bearer transformer bên trong, xem ApiVersioningExtensions).
builder.Services.AddCulinaryApiVersioning();

builder.Services.AddFrontendCors(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCulinaryRateLimiting();

// RFC 7807: mọi lỗi trả về application/problem+json kèm traceId và instance.
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance ??=
            $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
    };
});

var app = builder.Build();



if (await app.InitializePersistenceAsync(args))
{
    return;
}

// Đặt đầu pipeline để bắt exception từ mọi middleware/endpoint phía sau.
app.UseMiddleware<GlobalExceptionMiddleware>();
// Response lỗi không có body (vd. 404 do sai route, 405) cũng trả về ProblemDetails.
app.UseStatusCodePages();

// Local storage ghi vào wwwroot/uploads; MinIO tự phục vụ object qua HTTP.
app.UseStaticFiles();


// Trước rate limiter và authentication: preflight OPTIONS không bị 401/429,
// và response lỗi (401, 403, 429...) vẫn có header CORS để frontend đọc được nội dung lỗi.
app.UseCors();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Bật OpenAPI & Scalar UI trong môi trường Development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().WithDocumentPerVersion();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Culinary Blog API")
               .WithTheme(ScalarTheme.Moon);
    });

}

app.UseBackgroundJobs();

// Map các Endpoints của ứng dụng
app.MapGet("/", () => "Culinary Blog API").ExcludeFromDescription();

app.MapAuthEndpoints();

app.MapRecipeEndpoints();

app.MapRecipeIngredientEndpoints();

app.MapRecipeStepEndpoints();

app.MapRecipeImageEndpoints();

app.MapCategoriesEndpoints();

app.MapHealthEndpoints();

app.Run();
