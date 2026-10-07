using System.Threading;
using System.Threading.Tasks;
using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Storage;

public sealed class LoggingCacheService : ICacheService
{
    private readonly ILogger<LoggingCacheService> _logger;

    public LoggingCacheService(ILogger<LoggingCacheService> logger) => _logger = logger;

    public Task EvictByTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Cache eviction requested for tag {CacheTag}.", tag);
        return Task.CompletedTask;
    }
}
