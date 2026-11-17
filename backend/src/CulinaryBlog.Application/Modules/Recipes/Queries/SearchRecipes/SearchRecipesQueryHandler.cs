using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Common.Interfaces;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class SearchRecipesQueryHandler
    : IRequestHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>>
{
    private readonly IRecipeSearchReader _searchReader;
    private readonly ICacheService _cache;

    public SearchRecipesQueryHandler(IRecipeSearchReader searchReader, ICacheService cache) =>
        (_searchReader, _cache) = (searchReader, cache);

    public async Task<PagedResult<RecipeSummaryDto>> Handle(
        SearchRecipesQuery request,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"recipes:search:{request.SearchTerm.Trim().ToLowerInvariant()}:{request.Page}:{request.PageSize}:{request.CategoryId}:{request.Difficulty}:{request.MaxCookTime}:{request.MinServings}:{request.Sort}";
        if (await _cache.GetAsync<PagedResult<RecipeSummaryDto>>(cacheKey, cancellationToken) is { } cached)
            return cached;

        var result = await _searchReader.SearchAsync(
            request.SearchTerm, request.Page, request.PageSize, request.CategoryId,
            request.Difficulty, request.MaxCookTime, request.MinServings, request.Sort, cancellationToken);

        var response = PagedResult<RecipeSummaryDto>.Create(
            result.Items.Select(hit => new RecipeSummaryDto
            {
                Id = hit.Id,
                Title = hit.Title,
                Slug = hit.Slug,
                Description = hit.Description,
                ThumbnailUrl = hit.ThumbnailUrl,
                Rank = hit.Rank
            }).ToList(),
            result.TotalCount,
            request.Page,
            request.PageSize);
        await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(1), "recipes", cancellationToken);
        return response;
    }
}
