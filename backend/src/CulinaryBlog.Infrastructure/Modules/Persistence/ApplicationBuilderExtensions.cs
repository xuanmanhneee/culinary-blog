using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CulinaryBlog.Infrastructure.Modules.Persistence;

public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Áp dụng migration khi khởi động; với --seed thì seed dữ liệu rồi kết thúc tiến trình.
    /// </summary>
    public static async Task<bool> InitializePersistenceAsync(
        this WebApplication app,
        string[] args)
    {
        await using (var scope = app.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CulinaryBlogDbContext>();
            await dbContext.Database.MigrateAsync();
        }

        if (!args.Contains("--seed", StringComparer.OrdinalIgnoreCase))
        {
            return false;
        }

        await app.Services.SeedCulinaryBlogDataAsync();
        return true;
    }
}
