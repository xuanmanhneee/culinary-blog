using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql.Seed;

/// <summary>
/// Điều phối việc seed dữ liệu: gọi IdentitySeeder -> CategorySeeder -> RecipeSeeder
/// theo đúng thứ tự vì RecipeSeeder cần Category.Id và Author.Id đã tồn tại.
/// Gọi extension method WebApplication.SeedCulinaryBlogDataAsync() từ Program.cs (API layer).
/// </summary>
public static class DbSeederRunner
{
    public static async Task SeedCulinaryBlogDataAsync(this IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var provider = scope.ServiceProvider;
        var context = provider.GetRequiredService<CulinaryBlogDbContext>();
        var logger = provider.GetRequiredService<ILogger<CulinaryBlogDbContext>>();

        var identitySeeder = provider.GetRequiredService<IdentitySeeder>();
        var categorySeeder = provider.GetRequiredService<CategorySeeder>();
        var recipeSeeder = provider.GetRequiredService<RecipeSeeder>();

        logger.LogInformation("=== Bắt đầu seed dữ liệu Culinary Blog ===");

        await using var transaction = await context.Database.BeginTransactionAsync();
        var authors = await identitySeeder.SeedDemoAccountsAsync();
        var categories = await categorySeeder.SeedAsync();
        await recipeSeeder.SeedAsync(categories, authors);
        await transaction.CommitAsync();

        logger.LogInformation("=== Seed dữ liệu hoàn tất ===");
    }
}
