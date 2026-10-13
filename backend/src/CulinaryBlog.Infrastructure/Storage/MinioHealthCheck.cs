using Amazon.S3;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.Infrastructure.Storage;

public sealed class MinioHealthCheck : IHealthCheck
{
    private readonly IAmazonS3 _client;

    public MinioHealthCheck(IAmazonS3 client) => _client = client;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _client.ListBucketsAsync(cancellationToken);
            return HealthCheckResult.Healthy("MinIO is reachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("MinIO is unavailable.", exception);
        }
    }
}
