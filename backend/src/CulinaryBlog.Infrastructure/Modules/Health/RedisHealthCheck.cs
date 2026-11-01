using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CulinaryBlog.Infrastructure.Modules.Health;

public sealed class RedisHealthCheck : IHealthCheck
{
    private const string ProbeKey = "health:redis";
    private readonly IDistributedCache _cache;

    public RedisHealthCheck(IDistributedCache cache) => _cache = cache;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.SetStringAsync(ProbeKey, "ok", cancellationToken);
            var value = await _cache.GetStringAsync(ProbeKey, cancellationToken);
            return value == "ok"
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Redis probe returned an unexpected value.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Redis is unavailable.", ex);
        }
    }
}
