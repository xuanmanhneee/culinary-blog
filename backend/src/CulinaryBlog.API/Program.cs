using CulinaryBlog.API.Endpoints;
using CulinaryBlog.API.Middleware;
using CulinaryBlog.Application;
using CulinaryBlog.Infrastructure;
using CulinaryBlog.Infrastructure.Persistence;
using CulinaryBlog.Infrastructure.Persistence.Seed;
using CulinaryBlog.Infrastructure.Jobs;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using CulinaryBlog.API.Extensions;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Keep local development logs on the console; Windows EventLog may require
// administrator permissions and can mask the original database exception.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddAuthRateLimiting();

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 1. Đăng ký "nền": nơi lưu queue (PostgreSQL) + cách serialize job
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));

// 2. Đăng ký "worker": tiến trình poll queue và thực thi job
builder.Services.AddHangfireServer();

// 3. Đăng ký chính job class vào DI (để Hangfire resolve dependency của nó, ví dụ ILogger)
builder.Services.AddScoped<PingJob>();

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

app.MapOpenApi();
app.MapScalarApiReference();

// Apply schema migrations on startup, but seed only when explicitly requested.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CulinaryBlogDbContext>();
    await dbContext.Database.MigrateAsync();
}

if (args.Contains("--seed", StringComparer.OrdinalIgnoreCase))
{
    await app.Services.SeedCulinaryBlogDataAsync();
    return;
}

// Đặt đầu pipeline để bắt exception từ mọi middleware/endpoint phía sau.
app.UseMiddleware<GlobalExceptionMiddleware>();
// Response lỗi không có body (vd. 404 do sai route, 405) cũng trả về ProblemDetails.
app.UseStatusCodePages();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");

app.MapAuthEndpoints();

app.MapRecipeEndpoints();

app.MapRecipeIngredientEndpoints();

app.MapRecipeStepEndpoints();

app.MapRecipeImageEndpoints();

app.MapCategoriesEndpoints();

app.MapHealthEndpoints();

app.UseHangfireDashboard("/hangfire");

app.Lifetime.ApplicationStarted.Register(() =>
{
    RecurringJob.AddOrUpdate<PingJob>(
    recurringJobId: "ping-every-minute",
    methodCall: j => j.Execute("scheduled ping"),
    cronExpression: "* * * * *");
});

app.Run();
