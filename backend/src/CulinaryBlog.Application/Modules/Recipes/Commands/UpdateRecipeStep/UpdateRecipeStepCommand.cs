using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeStep;

public sealed record UpdateRecipeStepCommand(Guid RecipeId, Guid StepId, UpdateStepRequest Request) : IRequest<RecipeStepDto>;

internal sealed class UpdateRecipeStepCommandHandler : IRequestHandler<UpdateRecipeStepCommand, RecipeStepDto>
{
    private readonly IRecipeRepository _recipes; private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    public UpdateRecipeStepCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork, RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task<RecipeStepDto> Handle(UpdateRecipeStepCommand command, CancellationToken ct)
    {
        var r = command.Request;
        RecipeUseCaseSupport.ValidateStep(r.Title, r.Description, r.TimerMinutes, r.ImageUrl);
        var recipe = await _recipes.GetByIdWithStepsAsync(command.RecipeId, ct) ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        var step = recipe.FindStep(command.StepId) ?? throw new NotFoundException(ErrorCodes.StepNotFound, $"Step '{command.StepId}' không tồn tại.");
        step.Update(RecipeValidation.NullIfBlank(r.Title) ?? step.Title, r.Description.Trim(), r.TimerMinutes, RecipeValidation.NullIfBlank(r.ImageUrl));
        await _unitOfWork.SaveChangesAsync(ct);
        return RecipeUseCaseSupport.MapStep(step);
    }
}
