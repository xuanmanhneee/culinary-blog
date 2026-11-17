using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Application.Common.Interfaces;
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
    private readonly ICacheService _cache;

    public GetRecipesQueryHandler(
        IRecipeRepository recipes,
        RecipeAuthorizationHandler authorization,
        ICacheService cache) =>
        (_recipes, _authorization, _cache) = (recipes, authorization, cache);

    public async Task<PagedResult<RecipeListItemDto>> Handle(GetRecipesQuery query, CancellationToken ct)
    {
        RecipeUseCaseSupport.ValidateQuery(query.Request);
        var request = query.Request;
        var cacheKey = $"recipes:list:{request.Page}:{request.PageSize}:{request.CategoryId}:{request.Difficulty}:{request.MinPrepTime}:{request.MaxCookTime}:{request.MinServings}:{request.Status}:{request.Sort}";
        if (_authorization.CurrentUserId is null && !request.Mine &&
            await _cache.GetAsync<PagedResult<RecipeListItemDto>>(cacheKey, ct) is { } cached)
            return cached;

        var result = await _recipes.GetPagedAsync(request.Page, request.PageSize, _authorization.IsAdmin, request.Mine,
            _authorization.CurrentUserId, request.CategoryId, request.Difficulty, request.MinPrepTime,
            request.MaxCookTime, request.MinServings, request.Status, request.Sort, ct);
        var response = PagedResult<RecipeListItemDto>.Create(result.Items.Select(RecipeUseCaseSupport.MapListItem).ToList(),
            result.TotalCount, request.Page, request.PageSize);
        if (_authorization.CurrentUserId is null && !request.Mine)
            await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(15), "recipes", ct);
        return response;
    }
}
