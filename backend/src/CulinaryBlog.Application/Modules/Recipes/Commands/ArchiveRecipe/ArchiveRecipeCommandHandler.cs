using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.ArchiveRecipe;

internal sealed class ArchiveRecipeCommandHandler
    : IRequestHandler<ArchiveRecipeCommand, RecipeDetailDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public ArchiveRecipeCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeDetailDto> Handle(ArchiveRecipeCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        recipe.Archive();
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapDetail(recipe);
    }
}
