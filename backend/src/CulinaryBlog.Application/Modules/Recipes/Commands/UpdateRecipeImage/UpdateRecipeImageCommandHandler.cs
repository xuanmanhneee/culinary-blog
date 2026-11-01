using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Application.Recipes.Services;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Modules.Recipes;
using MediatR;

namespace CulinaryBlog.Application.Recipes.Commands.UpdateRecipeImage;

internal sealed class UpdateRecipeImageCommandHandler
    : IRequestHandler<UpdateRecipeImageCommand, RecipeImageDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    private readonly ICacheService _cache;

    public UpdateRecipeImageCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization,
        ICacheService cache) =>
        (_recipes, _unitOfWork, _authorization, _cache) =
        (recipes, unitOfWork, authorization, cache);

    public async Task<RecipeImageDto> Handle(UpdateRecipeImageCommand command, CancellationToken ct)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(command.RecipeId, ct)
            ?? throw RecipeUseCaseSupport.RecipeNotFound(command.RecipeId);
        _authorization.EnsureCanModify(recipe);

        var image = recipe.FindImage(command.ImageId)
            ?? throw new NotFoundException(ErrorCodes.ImageNotFound, $"Image '{command.ImageId}' không tồn tại.");

        if (!recipe.UpdateImageMetadata(
                command.ImageId,
                command.Request.AltText,
                command.Request.IsPrimary,
                command.Request.OrderIndex))
            throw new NotFoundException(ErrorCodes.ImageNotFound, $"Image '{command.ImageId}' không tồn tại.");

        await _unitOfWork.SaveChangesAsync(ct);
        await _cache.EvictByTagAsync("recipes", ct);

        return new RecipeImageDto(image.Id, image.OriginalUrl, image.MediumUrl, image.ThumbnailUrl, image.AltText, image.IsPrimary, image.OrderIndex);
    }
}
