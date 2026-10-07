using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Application.Common.Models;
using CulinaryBlog.Domain.Recipes.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CulinaryBlog.Application.Recipes.Commands.UploadRecipeImage;

public sealed class UploadRecipeImageCommandHandler : IRequestHandler<UploadRecipeImageCommand, RecipeImageDto>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _storage;
    private readonly ICacheService _cache;

    public UploadRecipeImageCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser,
        IFileStorageService storage,
        ICacheService cache)
    {
        _context = context;
        _currentUser = currentUser;
        _storage = storage;
        _cache = cache;
    }

    public async Task<RecipeImageDto> Handle(UploadRecipeImageCommand request, CancellationToken cancellationToken)
    {
        var recipe = await _context.Recipes
            .Include(r => r.Images)
            .SingleOrDefaultAsync(r => r.Id == request.RecipeId && !r.IsDeleted, cancellationToken);

        if (recipe is null)
            throw new KeyNotFoundException("Recipe was not found.");

        if (!_currentUser.IsAdmin && (!_currentUser.UserId.HasValue || recipe.AuthorId != _currentUser.UserId.Value))
            throw new UnauthorizedAccessException("You are not allowed to upload images for this recipe.");

        await ValidateMagicBytesAsync(request.File, cancellationToken);

        var url = await _storage.UploadAsync(recipe.Id, request.File, cancellationToken);
        var image = new RecipeImage
        {
            Id = Guid.NewGuid(),
            RecipeId = recipe.Id,
            OriginalUrl = url,
            IsPrimary = recipe.Images.Count == 0
        };

        _context.RecipeImages.Add(image);
        await _context.SaveChangesAsync(cancellationToken);
        await _cache.EvictByTagAsync("recipes", cancellationToken);

        return new RecipeImageDto { Id = image.Id, OriginalUrl = image.OriginalUrl, IsPrimary = image.IsPrimary };
    }

    private static async Task ValidateMagicBytesAsync(Microsoft.AspNetCore.Http.IFormFile file, CancellationToken cancellationToken)
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
            throw new InvalidDataException("The file content does not match its declared image format.");
    }
}
