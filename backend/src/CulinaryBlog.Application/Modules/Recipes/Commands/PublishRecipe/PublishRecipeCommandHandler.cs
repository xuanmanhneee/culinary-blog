using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.PublishRecipe;

internal sealed class PublishRecipeCommandHandler
    : IRequestHandler<PublishRecipeCommand, RecipeDetailDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public PublishRecipeCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeDetailDto> Handle(PublishRecipeCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        recipe.Publish();
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapDetail(recipe);
    }
}
