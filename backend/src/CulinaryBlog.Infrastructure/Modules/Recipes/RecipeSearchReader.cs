using System.Text.RegularExpressions;
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
        var terms = Regex.Matches(searchTerm, @"[\p{L}\p{N}]+")
            .Select(match => match.Value)
            .ToArray();
        var queryText = string.Join(" & ", terms.Select(term => $"{term}:*"));

        var query = _context.Recipes.AsNoTracking()
            .Where(recipe => recipe.Status == RecipeStatus.Published)
            .Where(recipe => EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!
                .Matches(EF.Functions.ToTsQuery("simple", queryText)));

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(recipe =>
                EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!
                    .Rank(EF.Functions.ToTsQuery("simple", queryText)))
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
                EF.Property<NpgsqlTsVector>(recipe, "SearchVector")!
                    .Rank(EF.Functions.ToTsQuery("simple", queryText))))
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
