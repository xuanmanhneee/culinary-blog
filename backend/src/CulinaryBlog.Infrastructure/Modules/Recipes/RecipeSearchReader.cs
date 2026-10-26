using CulinaryBlog.Application.Recipes.Queries.SearchRecipes;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using NpgsqlTypes;

namespace CulinaryBlog.Infrastructure.Modules.Recipes;

public sealed class RecipeSearchReader : IRecipeSearchReader
{
    private readonly CulinaryBlogDbContext _context;

    public RecipeSearchReader(CulinaryBlogDbContext context) => _context = context;

    public async Task<(IReadOnlyList<RecipeSearchItem> Items, int TotalCount)> SearchAsync(
        string searchTerm,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var terms = searchTerm.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var tsQuery = EF.Functions.ToTsQuery("vietnamese", string.Join(" & ", terms) + ":*");

        var query = _context.Recipes.AsNoTracking()
            .Where(recipe => recipe.Status == RecipeStatus.Published)
            .Where(recipe => EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!.Matches(tsQuery));

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(recipe =>
                EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!.Rank(tsQuery))
            .ThenBy(recipe => recipe.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(recipe => new RecipeSearchItem(
                recipe.Id,
                recipe.Title,
                recipe.Slug,
                recipe.Description,
                recipe.Images
                    .Where(image => image.IsPrimary)
                    .OrderBy(image => image.OrderIndex)
                    .Select(image => image.OriginalUrl)
                    .FirstOrDefault(),
                EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!.Rank(tsQuery)))
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
