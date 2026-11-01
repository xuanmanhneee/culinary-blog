using CulinaryBlog.Domain.Modules.Recipes;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

/// <summary>
/// Read-side contract for full-text recipe search.
/// </summary>
public interface IRecipeSearchReader
{
    Task<(IReadOnlyList<RecipeSearchItem> Items, int TotalCount)> SearchAsync(
        string searchTerm,
        int page,
        int pageSize,
        Guid? categoryId = null,
        RecipeDifficulty? difficulty = null,
        int? maxCookTime = null,
        int? minServings = null,
        CancellationToken cancellationToken = default);
}

public sealed record RecipeSearchItem(
    Guid Id,
    string Title,
    string Slug,
    string Description,
    string? ThumbnailUrl,
    double Rank);
