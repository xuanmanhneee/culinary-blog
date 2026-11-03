using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Queries.GetRecipeById;

internal sealed class GetRecipeByIdQueryHandler
    : IRequestHandler<GetRecipeByIdQuery, RecipeDetailDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly RecipeAuthorizationHandler _authorization;

    public GetRecipeByIdQueryHandler(IRecipeRepository recipes, RecipeAuthorizationHandler authorization) =>
        (_recipes, _authorization) = (recipes, authorization);

    public async Task<RecipeDetailDto> Handle(GetRecipeByIdQuery query, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithDetailsAsync(query.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(query.RecipeId);
        _authorization.EnsureCanModify(recipe);
        return RecipeUseCaseSupport.MapDetail(recipe);
    }
}
