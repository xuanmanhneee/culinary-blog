using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.AddRecipeStep;

internal sealed class AddRecipeStepCommandHandler : IRequestHandler<AddRecipeStepCommand, RecipeStepDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;

    public AddRecipeStepCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeStepDto> Handle(AddRecipeStepCommand command, CancellationToken ct)
    {
        var request = command.Request;
        RecipeUseCaseSupport.ValidateStep(
            request.Title, request.Description, request.TimerMinutes, request.ImageUrl);

        var recipe = await _recipes.GetByIdWithStepsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);

        var step = recipe.AddStep(
            RecipeValidation.NullIfBlank(request.Title),
            request.Description.Trim(),
            request.TimerMinutes,
            RecipeValidation.NullIfBlank(request.ImageUrl));

        _recipes.AddStep(step);
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapStep(step);
    }
}
