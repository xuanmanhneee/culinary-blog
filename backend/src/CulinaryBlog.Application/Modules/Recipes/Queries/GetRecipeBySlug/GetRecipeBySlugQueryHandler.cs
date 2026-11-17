using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipeBySlug;

internal sealed class GetRecipeBySlugQueryHandler
    : IRequestHandler<GetRecipeBySlugQuery, RecipeDetailDto?>
{
    private readonly IRecipeRepository _recipes;
    private readonly RecipeAuthorizationHandler _authorization;
    private readonly ICacheService _cache;

    public GetRecipeBySlugQueryHandler(
        IRecipeRepository recipes,
        RecipeAuthorizationHandler authorization,
        ICacheService cache) =>
        (_recipes, _authorization, _cache) = (recipes, authorization, cache);

    public async Task<RecipeDetailDto?> Handle(GetRecipeBySlugQuery query, CancellationToken ct)
    {
        var slug = query.Slug.Trim();
        var cacheKey = $"recipes:detail:{slug.ToLowerInvariant()}";
        if (_authorization.CurrentUserId is null &&
            await _cache.GetAsync<RecipeDetailDto>(cacheKey, ct) is { } cached)
            return cached;

        var recipe = await _recipes.GetBySlugWithDetailsAsync(slug, ct);
        if (recipe is null) return null;
        _authorization.EnsureCanView(recipe);
        var response = RecipeUseCaseSupport.MapDetail(recipe);
        if (_authorization.CurrentUserId is null && recipe.Status == RecipeStatus.Published)
            await _cache.SetAsync(cacheKey, response, TimeSpan.FromMinutes(5), "recipes", ct);
        return response;
    }
}
