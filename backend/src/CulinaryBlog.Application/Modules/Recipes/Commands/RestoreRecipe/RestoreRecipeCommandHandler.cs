using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.RestoreRecipe;

internal sealed class RestoreRecipeCommandHandler : IRequestHandler<RestoreRecipeCommand>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public RestoreRecipeCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task Handle(RestoreRecipeCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetDeletedByIdAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModerate(recipe);
        recipe.Restore();
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
