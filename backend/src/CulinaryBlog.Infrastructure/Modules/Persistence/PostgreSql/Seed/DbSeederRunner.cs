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
    public static async Task SeedCulinaryBlogDataAsync(this IServiceProvider services, bool reset = false)
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
        if (reset)
        {
            logger.LogWarning("--reset: xóa toàn bộ công thức, danh mục và tài khoản hiện có trước khi seed.");
            await ResetAsync(context);
        }

        var authors = await identitySeeder.SeedDemoAccountsAsync();
        var categories = await categorySeeder.SeedAsync();
        await recipeSeeder.SeedAsync(categories, authors);
        await categorySeeder.AssignImagesFromRecipesAsync();
        await transaction.CommitAsync();

        logger.LogInformation("=== Seed dữ liệu hoàn tất ===");
    }

    /// <summary>Xóa dữ liệu nghiệp vụ và người dùng (giữ lại bảng role) theo thứ tự khóa ngoại.</summary>
    private static async Task ResetAsync(CulinaryBlogDbContext context)
    {
        await context.RecipeImages.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.RecipeSteps.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.RecipeIngredients.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.Recipes.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.Categories.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.RefreshTokens.IgnoreQueryFilters().ExecuteDeleteAsync();
        await context.UserRoles.ExecuteDeleteAsync();
        await context.UserClaims.ExecuteDeleteAsync();
        await context.UserLogins.ExecuteDeleteAsync();
        await context.UserTokens.ExecuteDeleteAsync();
        await context.Users.ExecuteDeleteAsync();
    }
}
