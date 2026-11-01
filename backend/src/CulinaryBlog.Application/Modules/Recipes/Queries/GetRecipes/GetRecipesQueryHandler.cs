using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipes;

internal sealed class GetRecipesQueryHandler
    : IRequestHandler<GetRecipesQuery, PagedResult<RecipeListItemDto>>
{
    private readonly IRecipeRepository _recipes;
    private readonly RecipeAuthorizationHandler _authorization;

    public GetRecipesQueryHandler(IRecipeRepository recipes, RecipeAuthorizationHandler authorization) =>
        (_recipes, _authorization) = (recipes, authorization);

    public async Task<PagedResult<RecipeListItemDto>> Handle(GetRecipesQuery query, CancellationToken ct)
    {
        RecipeUseCaseSupport.ValidateQuery(query.Request);
        var request = query.Request;
        var result = await _recipes.GetPagedAsync(request.Page, request.PageSize, _authorization.IsAdmin, request.Mine,
            _authorization.CurrentUserId, request.CategoryId, request.Difficulty, request.MinPrepTime,
            request.MaxCookTime, request.MinServings, request.Sort, ct);
        return PagedResult<RecipeListItemDto>.Create(result.Items.Select(RecipeUseCaseSupport.MapListItem).ToList(),
            result.TotalCount, request.Page, request.PageSize);
    }
}
