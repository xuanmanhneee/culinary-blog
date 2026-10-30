using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipeBySlug;

internal sealed class GetRecipeBySlugQueryHandler
    : IRequestHandler<GetRecipeBySlugQuery, RecipeDetailDto?>
{
    private readonly IRecipeRepository _recipes;
    private readonly RecipeAuthorizationHandler _authorization;

    public GetRecipeBySlugQueryHandler(IRecipeRepository recipes, RecipeAuthorizationHandler authorization) =>
        (_recipes, _authorization) = (recipes, authorization);

    public async Task<RecipeDetailDto?> Handle(GetRecipeBySlugQuery query, CancellationToken ct)
    {
        var recipe = await _recipes.GetBySlugWithDetailsAsync(query.Slug.Trim(), ct);
        if (recipe is null) return null;
        _authorization.EnsureCanView(recipe);
        return RecipeUseCaseSupport.MapDetail(recipe);
    }
}
