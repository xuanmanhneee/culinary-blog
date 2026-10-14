using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NpgsqlTypes;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class SearchRecipesQueryHandler : IRequestHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>>
{
    private const string TextSearchConfiguration = "vietnamese";
    private readonly IApplicationDbContext _context;

    public SearchRecipesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RecipeSummaryDto>> Handle(
        SearchRecipesQuery request,
        CancellationToken cancellationToken)
    {
        var query = _context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.Status == RecipeStatus.Published)
            .Where(recipe => EF.Property<NpgsqlTsVector>(recipe, "SearchVector")
                .Matches(EF.Functions.PlainToTsQuery(TextSearchConfiguration, request.SearchTerm)));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(recipe => EF.Property<NpgsqlTsVector>(recipe, "SearchVector")
                .Rank(EF.Functions.PlainToTsQuery(TextSearchConfiguration, request.SearchTerm)))
            .ThenBy(recipe => recipe.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(recipe => new RecipeSummaryDto
            {
                Id = recipe.Id,
                Title = recipe.Title,
                Slug = recipe.Slug,
                Description = recipe.Description,
                ThumbnailUrl = recipe.Images
                    .Where(image => image.IsPrimary)
                    .Select(image => image.OriginalUrl)
                    .FirstOrDefault(),
                Rank = EF.Property<NpgsqlTsVector>(recipe, "SearchVector")
                    .Rank(EF.Functions.PlainToTsQuery(TextSearchConfiguration, request.SearchTerm))
            })
            .ToListAsync(cancellationToken);

        return PagedResult<RecipeSummaryDto>.Create(items, totalCount, request.Page, request.PageSize);
    }
}
