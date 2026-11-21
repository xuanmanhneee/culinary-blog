using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace CulinaryBlog.Infrastructure.Modules.Persistence;

public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Áp dụng migration khi khởi động; với --seed thì seed dữ liệu rồi kết thúc tiến trình (thêm --reset để xóa sạch dữ liệu cũ trước khi seed).
    /// </summary>
    public static async Task<bool> InitializePersistenceAsync(
        this WebApplication app,
        string[] args)
    {
        var seed = args.Contains("--seed", StringComparer.OrdinalIgnoreCase);
        if (seed && !app.Environment.IsDevelopment())
            throw new InvalidOperationException("Dữ liệu và tài khoản demo chỉ được seed ở môi trường Development.");

        await using (var scope = app.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CulinaryBlogDbContext>();
            await dbContext.Database.MigrateAsync();
        }

        if (!seed)
            return false;

        await app.Services.SeedCulinaryBlogDataAsync(args.Contains("--reset", StringComparer.OrdinalIgnoreCase));
        return true;
    }
}
