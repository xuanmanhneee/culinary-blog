using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.AddRecipeStep;

public sealed record AddRecipeStepCommand(Guid RecipeId, CreateStepRequest Request) : IRequest<RecipeStepDto>;

internal sealed class AddRecipeStepCommandHandler : IRequestHandler<AddRecipeStepCommand, RecipeStepDto>
{
    private readonly IRecipeRepository _recipes; private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    public AddRecipeStepCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork, RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeStepDto> Handle(AddRecipeStepCommand command, CancellationToken ct)
    {
        var r = command.Request;
        RecipeUseCaseSupport.ValidateStep(r.Title, r.Description, r.TimerMinutes, r.ImageUrl);
        var recipe = await _recipes.GetByIdWithStepsAsync(command.RecipeId, ct) ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        var step = recipe.AddStep(RecipeValidation.NullIfBlank(r.Title), r.Description.Trim(), r.TimerMinutes, RecipeValidation.NullIfBlank(r.ImageUrl));
        _recipes.AddStep(step);
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapStep(step);
    }
}
