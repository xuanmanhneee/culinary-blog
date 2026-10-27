using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Storage;

public sealed class MinioFileStorageService : IFileStorageService
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    private readonly IAmazonS3 _client;
    private readonly MinioOptions _options;

    public MinioFileStorageService(IAmazonS3 client, IOptions<MinioOptions> options)
    {
        _client = client;
        _options = options.Value;
    }

    public async Task<string> UploadAsync(Guid recipeId, IFormFile file, CancellationToken cancellationToken)
    {
        var extension = file.ContentType.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/avif" => ".avif",
            _ => throw new InvalidDataException("Unsupported image content type.")
        };

        await using var stream = file.OpenReadStream();
        return await UploadAsync(recipeId, stream, file.ContentType, extension, cancellationToken);
    }

    public async Task<string> UploadAsync(Guid recipeId, Stream stream, string contentType, string extension, CancellationToken cancellationToken)
    {
        if (!AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            throw new InvalidDataException("Unsupported image extension.");

        await EnsureBucketExistsAsync(cancellationToken);
        var key = $"recipes/{recipeId:D}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false
        };

        await _client.PutObjectAsync(request, cancellationToken);
        await EnsurePublicReadPolicyAsync(cancellationToken);

        var endpoint = string.IsNullOrWhiteSpace(_options.PublicEndpoint)
            ? _options.Endpoint.TrimEnd('/')
            : _options.PublicEndpoint.TrimEnd('/');
        return $"{endpoint}/{Uri.EscapeDataString(_options.BucketName)}/{Uri.EscapeDataString(key).Replace("%2F", "/", StringComparison.OrdinalIgnoreCase)}";
    }

    public async Task DeleteAsync(Guid recipeId, string objectUrl, CancellationToken cancellationToken)
    {
        var key = GetObjectKey(recipeId, objectUrl);
        await _client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key
        }, cancellationToken);
    }

    private string GetObjectKey(Guid recipeId, string objectUrl)
    {
        if (!Uri.TryCreate(objectUrl, UriKind.Absolute, out var objectUri))
            throw new InvalidDataException("The stored image URL is invalid.");

        var configuredEndpoints = new[] { _options.PublicEndpoint, _options.Endpoint }
            .Where(endpoint => !string.IsNullOrWhiteSpace(endpoint))
            .Select(endpoint => new Uri(endpoint, UriKind.Absolute));

        foreach (var endpoint in configuredEndpoints)
        {
            if (Uri.Compare(objectUri, endpoint, UriComponents.SchemeAndServer, UriFormat.SafeUnescaped,
                    StringComparison.OrdinalIgnoreCase) != 0)
            {
                continue;
            }

            var endpointPath = endpoint.AbsolutePath.TrimEnd('/');
            var prefix = $"{endpointPath}/{_options.BucketName}/recipes/{recipeId:D}/";
            var objectPath = Uri.UnescapeDataString(objectUri.AbsolutePath);
            if (!objectPath.StartsWith(prefix, StringComparison.Ordinal))
                continue;

            var fileName = objectPath[prefix.Length..];
            if (string.IsNullOrWhiteSpace(fileName)
                || fileName.Contains('/')
                || fileName is "." or ".."
                || !AllowedExtensions.Contains(Path.GetExtension(fileName), StringComparer.OrdinalIgnoreCase))
            {
                throw new InvalidDataException("The stored image URL does not identify a valid recipe object.");
            }

            return $"recipes/{recipeId:D}/{fileName}";
        }

        throw new InvalidDataException("The stored image URL does not belong to the configured MinIO endpoint.");
    }

    public async Task DeleteAsync(string url, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            throw new InvalidDataException("Invalid object storage URL.");

        var segments = uri.AbsolutePath.Trim('/').Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length != 2 ||
            !string.Equals(Uri.UnescapeDataString(segments[0]), _options.BucketName, StringComparison.Ordinal))
        {
            throw new InvalidDataException("The URL does not belong to the configured object storage bucket.");
        }

        var keySegments = Uri.UnescapeDataString(segments[1]).Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (keySegments.Length != 3
            || keySegments[0] != "recipes"
            || !Guid.TryParse(keySegments[1], out var recipeId))
        {
            throw new InvalidDataException("The URL does not identify a valid recipe object.");
        }

        await DeleteAsync(recipeId, url, cancellationToken);
    }

    private async Task EnsureBucketExistsAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _client.PutBucketAsync(new PutBucketRequest { BucketName = _options.BucketName }, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.Conflict)
        {
            // The bucket already exists and can be reused.
        }
    }

    private async Task EnsurePublicReadPolicyAsync(CancellationToken cancellationToken)
    {
        var policy = new
        {
            Version = "2012-10-17",
            Statement = new[]
            {
                new
                {
                    Effect = "Allow",
                    Principal = new { AWS = new[] { "*" } },
                    Action = new[] { "s3:GetObject" },
                    Resource = $"arn:aws:s3:::{_options.BucketName}/*"
                }
            }
        };

        await _client.PutBucketPolicyAsync(new PutBucketPolicyRequest
        {
            BucketName = _options.BucketName,
            Policy = JsonSerializer.Serialize(policy)
        }, cancellationToken);
    }
}
