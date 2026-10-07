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
