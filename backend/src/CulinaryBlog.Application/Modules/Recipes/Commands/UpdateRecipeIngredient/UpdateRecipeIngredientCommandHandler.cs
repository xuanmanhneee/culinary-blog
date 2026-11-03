using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeIngredient;

internal sealed class UpdateRecipeIngredientCommandHandler
    : IRequestHandler<UpdateRecipeIngredientCommand, RecipeIngredientDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public UpdateRecipeIngredientCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeIngredientDto> Handle(UpdateRecipeIngredientCommand command, CancellationToken ct)
    {
        var request = command.Request;
        RecipeUseCaseSupport.ValidateIngredient(
            request.Name, request.Quantity, request.Unit, request.Notes, request.OrderIndex);

        var recipe = await _recipes.GetByIdWithIngredientsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);

        var ingredient = recipe.FindIngredient(command.IngredientId)
            ?? throw new NotFoundException(
                ErrorCodes.IngredientNotFound,
                $"Ingredient '{command.IngredientId}' không tồn tại.");

        ingredient.Update(
            request.Name.Trim(),
            request.Quantity,
            RecipeValidation.NullIfBlank(request.Unit),
            request.OrderIndex,
            RecipeValidation.NullIfBlank(request.Notes));

        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapIngredient(ingredient);
    }
}
