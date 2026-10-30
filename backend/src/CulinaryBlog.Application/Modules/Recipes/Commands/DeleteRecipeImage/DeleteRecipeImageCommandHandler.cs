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
    private readonly IFileStorageService _storage;
    private readonly ICacheService _cache;

    public DeleteRecipeImageCommandHandler(IRecipeRepository recipes, IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization, IFileStorageService storage, ICacheService cache) =>
        (_recipes, _unitOfWork, _authorization, _storage, _cache) =
        (recipes, unitOfWork, authorization, storage, cache);

    public async Task Handle(DeleteRecipeImageCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);
        var image = recipe.FindImage(command.ImageId)
            ?? throw new NotFoundException(ErrorCodes.ImageNotFound, $"Image '{command.ImageId}' không tồn tại.");

        recipe.RemoveImage(command.ImageId);
        await _unitOfWork.SaveChangesAsync(ct);
        await _storage.DeleteAsync(image.OriginalUrl, ct);
        await _cache.EvictByTagAsync("recipes", ct);
    }
}
