using System.IO;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Common.Helpers;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Application.Recipes.Services;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class UploadRecipeImageCommandHandler
    : IRequestHandler<UploadRecipeImageCommand, RecipeImageDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    private readonly IFileStorageService _storage;
    private readonly ICacheService _cache;
    private readonly IThumbnailScheduler _thumbnailScheduler;
    private readonly ILogger<UploadRecipeImageCommandHandler> _logger;

    public UploadRecipeImageCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization,
        IFileStorageService storage,
        ICacheService cache,
        IThumbnailScheduler thumbnailScheduler,
        ILogger<UploadRecipeImageCommandHandler> logger)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
        _storage = storage;
        _cache = cache;
        _thumbnailScheduler = thumbnailScheduler;
        _logger = logger;
    }

    public async Task<RecipeImageDto> Handle(UploadRecipeImageCommand request, CancellationToken cancellationToken)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(request.RecipeId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{request.RecipeId}' không tồn tại.");

        // Chỉ owner được upload ảnh cho recipe (NFR-SEC-006).
        _authorization.EnsureCanModify(recipe);

        await ImageFileValidation.ValidateMagicBytesAsync(request.File, cancellationToken);

        var url = await _storage.UploadAsync(recipe.Id, request.File, cancellationToken);
        RecipeImage image;
        try
        {
            image = recipe.AddImage(url, isPrimary: recipe.Images.Count == 0);
            _recipes.AddImage(image);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            try
            {
                await _storage.DeleteAsync(url, CancellationToken.None);
            }
            catch (Exception cleanupException)
            {
                _logger.LogWarning(cleanupException, "Could not remove orphaned upload {Url}", url);
            }

            throw;
        }
        await _cache.EvictByTagAsync("recipes", cancellationToken);
        _thumbnailScheduler.Schedule(recipe.Id, image.Id, image.OriginalUrl);

        return new RecipeImageDto(
            image.Id,
            image.OriginalUrl,
            image.MediumUrl,
            image.ThumbnailUrl,
            image.AltText,
            image.IsPrimary,
            image.OrderIndex);
    }

}
