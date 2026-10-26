using CulinaryBlog.Application.Common.Models;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.SearchRecipes;

public class SearchRecipesQueryHandler : IRequestHandler<SearchRecipesQuery, PagedResult<RecipeSummaryDto>>
{
    private readonly IRecipeSearchReader _searchReader;

    public SearchRecipesQueryHandler(IRecipeSearchReader searchReader) => _searchReader = searchReader;

    public async Task<PagedResult<RecipeSummaryDto>> Handle(
        SearchRecipesQuery request,
        CancellationToken cancellationToken)
    {
        var result = await _searchReader.SearchAsync(
            request.SearchTerm, request.Page, request.PageSize, cancellationToken);

        return PagedResult<RecipeSummaryDto>.Create(
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
    }
}
