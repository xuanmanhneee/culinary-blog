using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipe;

internal sealed class DeleteRecipeCommandHandler
    : IRequestHandler<DeleteRecipeCommand>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public DeleteRecipeCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task Handle(DeleteRecipeCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        _recipes.Remove(recipe);
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
