using Amazon.S3;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CulinaryBlog.Infrastructure.Modules.Health;

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
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("MinIO is unavailable.", ex);
        }
    }
}
