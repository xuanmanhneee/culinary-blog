using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CulinaryBlog.Domain.Modules.Identity;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace CulinaryBlog.Tests.Integration;

/// <summary>
/// Chạy toàn bộ API thật (pipeline, DI, EF migrations, Identity) trên một PostgreSQL tạm thời trong Docker.
/// Redis không có: ứng dụng tự rơi về đọc DB. Hangfire dùng client giả để job không chạy thật nhưng vẫn quan sát được.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string Password = "Abcd@1234";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();
    private int _nextClient;

    public RecordingJobClient Jobs { get; } = new();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        // Biến môi trường được đọc ngay khi WebApplication.CreateBuilder chạy, nên ghi đè được cả các giá trị
        // mà Program đọc sớm (chuỗi kết nối, khóa JWT). ConfigureAppConfiguration thì quá muộn với các giá trị đó.
        foreach (var (key, value) in Settings())
            Environment.SetEnvironmentVariable(key, value);
        // Khởi tạo host (chạy migration) rồi tạo role mặc định mà seed demo thường tạo.
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<IdentitySeeder>().SeedRolesAsync();
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private IEnumerable<(string Key, string Value)> Settings() =>
    [
        ("ConnectionStrings__DefaultConnection", _postgres.GetConnectionString()),
        ("ConnectionStrings__Redis", "localhost:1,abortConnect=false,connectTimeout=100,syncTimeout=100,asyncTimeout=100"),
        ("Jwt__Key", "integration-test-secret-key-0123456789-abcdef"),
        ("Storage__Provider", "Local"),
        ("Services__Engagement__BaseUrl", "http://127.0.0.1:1"),
        ("Smtp__PublicWebUrl", "http://web.test"),
        ("Seq__ServerUrl", ""),
    ];

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureTestServices(services =>
        {
            // Bộ nhớ thay Redis: giữ nguyên RedisCacheService thật nhưng không phải chờ kết nối timeout.
            services.RemoveAll<Microsoft.Extensions.Caching.Distributed.IDistributedCache>();
            services.AddSingleton<Microsoft.Extensions.Caching.Distributed.IDistributedCache, Microsoft.Extensions.Caching.Distributed.MemoryDistributedCache>(
                _ => new Microsoft.Extensions.Caching.Distributed.MemoryDistributedCache(
                    Microsoft.Extensions.Options.Options.Create(new Microsoft.Extensions.Caching.Memory.MemoryDistributedCacheOptions())));
            services.AddSingleton<IBackgroundJobClient>(Jobs);
            services.AddSingleton<Microsoft.AspNetCore.Hosting.IStartupFilter, ClientIpStartupFilter>();
        });
    }

    /// <summary>Mỗi client có IP riêng nên các test không dùng chung hạn mức rate limit.</summary>
    public HttpClient NewClient(string? bearer = null)
    {
        var id = Interlocked.Increment(ref _nextClient);
        var client = CreateClient();
        client.DefaultRequestHeaders.Add(ClientIpStartupFilter.Header, $"10.{id / 65536 % 256}.{id / 256 % 256}.{id % 256}");
        if (bearer is not null) client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        return client;
    }

    public async Task<TestUser> RegisterAsync(string? prefix = null, bool admin = false, bool confirmEmail = false)
    {
        var email = $"{prefix ?? "user"}-{Guid.NewGuid():N}@example.com";
        var client = NewClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register",
            new { fullName = "Người Dùng Thử", email, userName = $"u{Guid.NewGuid():N}"[..20], password = Password });
        response.EnsureSuccessStatusCode();

        if (admin || confirmEmail)
        {
            using var scope = Services.CreateScope();
            var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = (await users.FindByEmailAsync(email))!;
            if (admin) await users.AddToRoleAsync(user, Roles.Admin);
            // Tạo công thức yêu cầu email đã xác nhận (claim email_verified nằm trong JWT lúc đăng nhập).
            if (confirmEmail) await users.ConfirmEmailAsync(user, await users.GenerateEmailConfirmationTokenAsync(user));
        }

        // Đăng nhập lại để JWT mang đúng danh sách role.
        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = Password });
        login.EnsureSuccessStatusCode();
        var body = await login.Content.ReadFromJsonAsync<JsonElement>();
        return new TestUser(
            email,
            body.GetProperty("user").GetProperty("id").GetString()!,
            body.GetProperty("accessToken").GetString()!,
            body.GetProperty("refreshToken").GetString()!);
    }

    /// <summary>Author đã xác nhận email, đủ điều kiện tạo và quản lý công thức.</summary>
    public Task<TestUser> RegisterAuthorAsync() => RegisterAsync("author", confirmEmail: true);

    public Task<TestUser> RegisterAdminAsync() => RegisterAsync("admin", admin: true);

    public async Task<JsonElement> CreateCategoryAsync(HttpClient admin, string? name = null)
    {
        var response = await admin.PostAsJsonAsync("/api/v1/categories", new { name = name ?? $"Danh mục {Guid.NewGuid():N}"[..20] });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public async Task<JsonElement> CreateRecipeAsync(HttpClient author, Guid categoryId, string? title = null)
    {
        var response = await author.PostAsJsonAsync("/api/v1/recipes", new
        {
            title = title ?? $"Món thử nghiệm {Guid.NewGuid():N}"[..24],
            description = "Mô tả món ăn dùng cho kiểm thử tích hợp.",
            categoryId,
            prepTimeMinutes = 10,
            cookTimeMinutes = 20,
            servings = 2,
            difficulty = 1
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    public static ByteArrayContent PngFile(string field = "file")
    {
        byte[] png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
        var content = new ByteArrayContent(png);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        return content;
    }
}

public sealed record TestUser(string Email, string Id, string AccessToken, string RefreshToken);

/// <summary>Gán RemoteIpAddress từ header để mỗi client test có hạn mức rate limit riêng.</summary>
internal sealed class ClientIpStartupFilter : IStartupFilter
{
    public const string Header = "X-Test-Ip";

    public Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> Configure(
        Action<Microsoft.AspNetCore.Builder.IApplicationBuilder> next) => app =>
    {
        app.Use((context, nextMiddleware) =>
        {
            if (context.Request.Headers.TryGetValue(Header, out var value) && IPAddress.TryParse(value, out var ip))
                context.Connection.RemoteIpAddress = ip;
            return nextMiddleware();
        });
        next(app);
    };
}

/// <summary>Thay Hangfire client: ghi lại job được xếp hàng thay vì chạy (không gửi mail thật).</summary>
public sealed class RecordingJobClient : IBackgroundJobClient
{
    private readonly ConcurrentQueue<Job> _jobs = new();

    public IReadOnlyCollection<Job> Jobs => _jobs.ToArray();

    public string Create(Job job, IState state)
    {
        _jobs.Enqueue(job);
        return Guid.NewGuid().ToString("N");
    }

    public bool ChangeState(string jobId, IState state, string expectedState) => true;

    /// <summary>Tìm đối số đầu tiên của job mới nhất thuộc kiểu và phương thức chỉ định.</summary>
    public IReadOnlyList<object?> LastArguments(Type jobType, string method) =>
        _jobs.Reverse().FirstOrDefault(job => job.Type == jobType && job.Method.Name == method)?.Args.ToList()
        ?? throw new InvalidOperationException($"Không có job {jobType.Name}.{method} nào được xếp hàng.");
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "api";
}
