using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.DeleteRecipeImage;

internal sealed class DeleteRecipeImageCommandHandler : IRequestHandler<DeleteRecipeImageCommand>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    private readonly IFileDeletionScheduler _fileDeletionScheduler;
    private readonly ICacheService _cache;

    public DeleteRecipeImageCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization, IFileDeletionScheduler fileDeletionScheduler, ICacheService cache) =>
        (_recipes, _unitOfWork, _authorization, _fileDeletionScheduler, _cache) =
        (recipes, unitOfWork, authorization, fileDeletionScheduler, cache);

    public async Task Handle(DeleteRecipeImageCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        var image = recipe.FindImage(command.ImageId)
            ?? throw new NotFoundException(ErrorCodes.ImageNotFound, $"Image '{command.ImageId}' không tồn tại.");

        recipe.RemoveImage(command.ImageId);
        await _unitOfWork.SaveChangesAsync(ct);
        ScheduleImageFiles(image);
        await _cache.EvictByTagAsync("recipes", ct);
    }

    private void ScheduleImageFiles(RecipeImage image)
    {
        foreach (var url in new[] { image.OriginalUrl, image.MediumUrl, image.ThumbnailUrl }
                     .Where(url => !string.IsNullOrWhiteSpace(url))
                     .Distinct(StringComparer.Ordinal))
        {
            _fileDeletionScheduler.Schedule(url!);
        }
    }
}
