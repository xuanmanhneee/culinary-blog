using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeStep;

public sealed record DeleteRecipeStepCommand(Guid RecipeId, Guid StepId) : IRequest;

internal sealed class DeleteRecipeStepCommandHandler : IRequestHandler<DeleteRecipeStepCommand>
{
    private readonly IRecipeRepository _recipes; private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    public DeleteRecipeStepCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork, RecipeAuthorizationHandler authorization) =>
        (_recipes, _unitOfWork, _authorization) = (recipes, unitOfWork, authorization);

    public async Task Handle(DeleteRecipeStepCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithStepsAsync(command.RecipeId, ct) ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        if (!recipe.RemoveStep(command.StepId)) throw new NotFoundException(ErrorCodes.StepNotFound, $"Step '{command.StepId}' không tồn tại.");
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
