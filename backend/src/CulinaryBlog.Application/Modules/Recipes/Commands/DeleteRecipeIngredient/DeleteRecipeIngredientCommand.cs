using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeIngredient;

public sealed record DeleteRecipeIngredientCommand(Guid RecipeId, Guid IngredientId) : IRequest;

internal sealed class DeleteRecipeIngredientCommandHandler : IRequestHandler<DeleteRecipeIngredientCommand>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public DeleteRecipeIngredientCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task Handle(DeleteRecipeIngredientCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithIngredientsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        if (!recipe.RemoveIngredient(command.IngredientId))
            throw new NotFoundException(ErrorCodes.IngredientNotFound, $"Ingredient '{command.IngredientId}' không tồn tại.");
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
