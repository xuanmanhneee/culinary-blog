using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Application.Common.Interfaces;
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
    private readonly IFileDeletionScheduler _fileDeletionScheduler;

    public DeleteRecipeCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization, IFileDeletionScheduler fileDeletionScheduler) =>
        (_recipes, _unitOfWork, _authorization, _fileDeletionScheduler) =
        (recipes, unitOfWork, authorization, fileDeletionScheduler);

    public async Task Handle(DeleteRecipeCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithDetailsAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        foreach (var url in recipe.Images
                     .SelectMany(image => new[] { image.OriginalUrl, image.MediumUrl, image.ThumbnailUrl })
                     .Where(url => !string.IsNullOrWhiteSpace(url))
                     .Distinct(StringComparer.Ordinal))
        {
            _fileDeletionScheduler.Schedule(url!);
        }

        recipe.SoftDelete();
        await _unitOfWork.SaveChangesAsync(ct);
    }
}
