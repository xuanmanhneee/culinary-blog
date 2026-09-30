using CulinaryBlog.API.Endpoints;
using CulinaryBlog.Application;
using CulinaryBlog.Infrastructure;
using CulinaryBlog.Infrastructure.Persistence;
using CulinaryBlog.Infrastructure.Persistence.Seed;
using CulinaryBlog.Infrastructure.Jobs;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Keep local development logs on the console; Windows EventLog may require
// administrator permissions and can mask the original database exception.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

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

var app = builder.Build();



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

app.MapGet("/", () => "Hello World!");

app.MapRecipeEndpoints();

app.UseHangfireDashboard("/hangfire");

app.Lifetime.ApplicationStarted.Register(() =>
{
    RecurringJob.AddOrUpdate<PingJob>(
    recurringJobId: "ping-every-minute",
    methodCall: j => j.Execute("scheduled ping"),
    cronExpression: "* * * * *");
});

app.MapRecipeIngredientEndpoints();


app.Run();
