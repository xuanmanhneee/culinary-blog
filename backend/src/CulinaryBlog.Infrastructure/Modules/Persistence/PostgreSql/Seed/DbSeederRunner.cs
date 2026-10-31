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
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;
        var logger = provider.GetRequiredService<ILogger<CulinaryBlogDbContext>>();

        var identitySeeder = provider.GetRequiredService<IdentitySeeder>();
        var categorySeeder = provider.GetRequiredService<CategorySeeder>();
        var recipeSeeder = provider.GetRequiredService<RecipeSeeder>();

        logger.LogInformation("=== Bắt đầu seed dữ liệu Culinary Blog ===");

        var authors = await identitySeeder.SeedAuthorsAsync(count: 6);
        var categories = await categorySeeder.SeedAsync(); // >= 20 categories
        await recipeSeeder.SeedAsync(categories, authors, count: 120); // >= 100 recipes

        logger.LogInformation("=== Seed dữ liệu hoàn tất ===");
    }
}
