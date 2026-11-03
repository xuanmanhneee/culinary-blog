using CulinaryBlog.Application.Common.Interfaces;
using CulinaryBlog.Infrastructure.Modules.Persistence.PostgreSql;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace CulinaryBlog.Infrastructure.Modules.BackgroundJobs.Jobs;

public sealed class ThumbnailJob
{
    private readonly IFileStorageService _storage;
    private readonly CulinaryBlogDbContext _db;

    public ThumbnailJob(
        IFileStorageService storage,
        CulinaryBlogDbContext db)
    {
        _storage = storage;
        _db = db;
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [60, 300, 1800])]
    public async Task ProcessAsync(Guid recipeId, Guid imageId, string originalUrl, CancellationToken ct)
    {
        await using var source = await _storage.OpenReadAsync(originalUrl, ct);
        using var image = await Image.LoadAsync(source, ct);

        var mediumUrl = await UploadVariantAsync(image, recipeId, 800, 600, ct);
        var thumbnailUrl = await UploadVariantAsync(image, recipeId, 300, 300, ct);

        var entity = await _db.RecipeImages.FirstOrDefaultAsync(i => i.Id == imageId, ct);
        if (entity is null) return;

        entity.SetDerivedUrls(mediumUrl, thumbnailUrl);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<string> UploadVariantAsync(
        Image source,
        Guid recipeId,
        int width,
        int height,
        CancellationToken ct)
    {
        using var resized = source.Clone(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(width, height),
            Mode = ResizeMode.Crop
        }));
        await using var output = new MemoryStream();
        await resized.SaveAsJpegAsync(output, ct);
        output.Position = 0;
        return await _storage.UploadAsync(recipeId, output, "image/jpeg", ".jpg", ct);
    }
}
