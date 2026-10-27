using System.IO;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Exceptions;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Recipes.Models;
using CulinaryBlog.Domain.Common.Exceptions;
using CulinaryBlog.Domain.Common;
using CulinaryBlog.Domain.Modules.Recipes;
using CulinaryBlog.Application.Recipes.Services;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class UploadRecipeImageCommandHandler : IRequestHandler<UploadRecipeImageCommand, RecipeImageDto>
{
    private readonly IRecipeRepository _recipes;
    private readonly IUnitOfWork _unitOfWork;
    private readonly RecipeAuthorizationHandler _authorization;
    private readonly IFileStorageService _storage;
    private readonly ICacheService _cache;
    private readonly ILogger<UploadRecipeImageCommandHandler> _logger;

    public UploadRecipeImageCommandHandler(
        IRecipeRepository recipes,
        IUnitOfWork unitOfWork,
        RecipeAuthorizationHandler authorization,
        IFileStorageService storage,
        ICacheService cache,
        ILogger<UploadRecipeImageCommandHandler> logger)
    {
        _recipes = recipes;
        _unitOfWork = unitOfWork;
        _authorization = authorization;
        _storage = storage;
        _cache = cache;
        _logger = logger;
    }

    public async Task<RecipeImageDto> Handle(UploadRecipeImageCommand request, CancellationToken cancellationToken)
    {
        var recipe = await _recipes.GetByIdWithImagesAsync(request.RecipeId, cancellationToken)
            ?? throw new NotFoundException(ErrorCodes.RecipeNotFound, $"Recipe '{request.RecipeId}' không tồn tại.");

        // Chỉ owner hoặc Admin được upload ảnh cho recipe (NFR-SEC-006).
        _authorization.EnsureCanModify(recipe);

        await ValidateMagicBytesAsync(request.File, cancellationToken);

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
                await _storage.DeleteAsync(recipe.Id, url, CancellationToken.None);
            }
            catch (Exception cleanupException)
            {
                _logger.LogWarning(cleanupException, "Could not remove orphaned upload {Url}", url);
            }

            throw;
        }
        await _cache.EvictByTagAsync("recipes", cancellationToken);

        return new RecipeImageDto(
            image.Id,
            image.OriginalUrl,
            image.AltText,
            image.IsPrimary,
            image.OrderIndex);
    }

    private static async Task ValidateMagicBytesAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var bytes = new byte[12];
        var read = 0;
        while (read < bytes.Length)
        {
            var count = await stream.ReadAsync(bytes.AsMemory(read, bytes.Length - read), cancellationToken);
            if (count == 0) break;
            read += count;
        }

        var valid = file.ContentType.ToLowerInvariant() switch
        {
            "image/jpeg" => read >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            "image/png" => read >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            "image/webp" => read >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            "image/avif" => read >= 12 && bytes.AsSpan(4, 4).SequenceEqual("ftyp"u8) &&
                (bytes.AsSpan(8, 4).SequenceEqual("avif"u8) || bytes.AsSpan(8, 4).SequenceEqual("avis"u8)),
            _ => false
        };

        if (!valid)
        {
            throw new ValidationException(
                nameof(UploadRecipeImageCommand.File),
                "The file content does not match its declared image format.");
        }
    }
}
