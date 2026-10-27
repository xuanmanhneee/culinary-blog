using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace CulinaryBlog.Infrastructure.Storage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly IReadOnlyDictionary<string, string> ContentTypeExtensions =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp",
            ["image/avif"] = ".avif"
        };

    private readonly string _webRoot;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LocalFileStorageService(
        IWebHostEnvironment environment,
        IHttpContextAccessor httpContextAccessor)
    {
        _webRoot = environment.WebRootPath
            ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> UploadAsync(
        Guid recipeId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!ContentTypeExtensions.TryGetValue(file.ContentType, out var extension))
            throw new InvalidDataException("Unsupported image content type.");

        await using var stream = file.OpenReadStream();
        return await UploadAsync(recipeId, stream, file.ContentType, extension, cancellationToken);
    }

    public async Task<string> UploadAsync(
        Guid recipeId,
        Stream stream,
        string contentType,
        string extension,
        CancellationToken cancellationToken)
    {
        if (!ContentTypeExtensions.Values.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new InvalidDataException("Unsupported image extension.");

        var relativeDirectory = Path.Combine("uploads", "recipes", recipeId.ToString("D"));
        var directory = Path.Combine(_webRoot, relativeDirectory);
        Directory.CreateDirectory(directory);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(directory, fileName);
        await using (var output = new FileStream(
            filePath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 81920,
            useAsync: true))
        {
            await stream.CopyToAsync(output, cancellationToken);
        }

        var relativeUrl = $"/uploads/recipes/{recipeId:D}/{fileName}";
        var request = _httpContextAccessor.HttpContext?.Request;
        return request is null
            ? relativeUrl
            : $"{request.Scheme}://{request.Host}{request.PathBase}{relativeUrl}";
    }

    public Task DeleteAsync(string url, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var path = Uri.TryCreate(url, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri.AbsolutePath
            : url;
        path = Uri.UnescapeDataString(path).Replace('\\', '/');
        if (!path.StartsWith("/uploads/", StringComparison.Ordinal))
            throw new InvalidDataException("The URL does not belong to local recipe storage.");

        var uploadsRoot = Path.GetFullPath(Path.Combine(_webRoot, "uploads"));
        var filePath = Path.GetFullPath(Path.Combine(
            _webRoot,
            path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
        if (!filePath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("The storage path is outside the uploads directory.");

        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid recipeId, string url, CancellationToken cancellationToken)
    {
        var path = Uri.TryCreate(url, UriKind.Absolute, out var absoluteUri)
            ? absoluteUri.AbsolutePath
            : url;
        path = Uri.UnescapeDataString(path).Replace('\\', '/');
        var recipePath = $"/uploads/recipes/{recipeId:D}/";
        if (!path.StartsWith(recipePath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException("The URL does not belong to the specified recipe.");

        return DeleteAsync(url, cancellationToken);
    }
}
