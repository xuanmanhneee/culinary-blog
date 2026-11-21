using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetDeletedRecipes;

internal sealed class GetDeletedRecipesQueryHandler
    : IRequestHandler<GetDeletedRecipesQuery, PagedResult<RecipeListItemDto>>
{
    private readonly IRecipeRepository _recipes;
    private readonly RecipeAuthorizationHandler _authorization;

    public GetDeletedRecipesQueryHandler(IRecipeRepository recipes, RecipeAuthorizationHandler authorization) =>
        (_recipes, _authorization) = (recipes, authorization);

    public async Task<PagedResult<RecipeListItemDto>> Handle(GetDeletedRecipesQuery query, CancellationToken ct)
    {
        RecipeUseCaseSupport.ValidateQuery(new RecipeQuery(Page: query.Page, PageSize: query.PageSize));
        var ownerId = _authorization.IsAdmin ? null : _authorization.RequireUserId();
        var result = await _recipes.GetDeletedPagedAsync(query.Page, query.PageSize, ownerId, ct);
        return PagedResult<RecipeListItemDto>.Create(
            result.Items.Select(RecipeUseCaseSupport.MapListItem).ToList(),
            result.TotalCount,
            query.Page,
            query.PageSize);
    }
}
