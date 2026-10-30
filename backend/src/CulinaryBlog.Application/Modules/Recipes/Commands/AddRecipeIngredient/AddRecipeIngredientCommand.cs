using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.AddRecipeIngredient;

public sealed record AddRecipeIngredientCommand(Guid RecipeId, CreateIngredientRequest Request)
    : IRequest<RecipeIngredientDto>;

internal sealed class AddRecipeIngredientCommandHandler
    : IRequestHandler<AddRecipeIngredientCommand, RecipeIngredientDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public AddRecipeIngredientCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeIngredientDto> Handle(AddRecipeIngredientCommand command, CancellationToken ct)
    {
        var request = command.Request;
        RecipeUseCaseSupport.ValidateIngredient(request.Name, request.Quantity, request.Unit, request.Notes, request.OrderIndex);
        var recipe = await _recipes.GetByIdWithIngredientsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        var ingredient = recipe.AddIngredient(request.Name.Trim(), request.Quantity,
            RecipeValidation.NullIfBlank(request.Unit), RecipeValidation.NullIfBlank(request.Notes), request.OrderIndex);
        _recipes.AddIngredient(ingredient);
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapIngredient(ingredient);
    }
}
