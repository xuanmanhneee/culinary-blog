using System.Text.Json;
using CulinaryBlog.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace CulinaryBlog.Infrastructure.Modules.Cache;

public sealed class RedisCacheService : ICacheService
{
    private const string Prefix = "culinaryblog:";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IDistributedCache _cache;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IDistributedCache cache, ILogger<RedisCacheService> logger) =>
        (_cache, _logger) = (cache, logger);

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var json = await _cache.GetStringAsync(Key(key), cancellationToken);
            return json is null ? default : JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Redis cache read failed for {CacheKey}; continuing without cache", key);
            return default;
        }
    }

    public async Task SetAsync<T>(
        string key,
        T value,
        TimeSpan absoluteExpiration,
        string tag,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.SetStringAsync(
                Key(key),
                JsonSerializer.Serialize(value, JsonOptions),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = absoluteExpiration },
                cancellationToken);

            var tagKey = TagKey(tag);
            var keys = await GetKeysAsync(tagKey, cancellationToken);
            if (!keys.Contains(key, StringComparer.Ordinal))
            {
                keys.Add(key);
                await _cache.SetStringAsync(tagKey, JsonSerializer.Serialize(keys, JsonOptions), cancellationToken);
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Redis cache write failed for {CacheKey}; continuing without cache", key);
        }
    }

    public async Task EvictByTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        try
        {
            var tagKey = TagKey(tag);
            var keys = await GetKeysAsync(tagKey, cancellationToken);
            foreach (var key in keys)
                await _cache.RemoveAsync(Key(key), cancellationToken);

            await _cache.RemoveAsync(tagKey, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogWarning(exception, "Redis cache eviction failed for tag {CacheTag}; continuing without cache", tag);
        }
    }

    private async Task<List<string>> GetKeysAsync(string tagKey, CancellationToken cancellationToken)
    {
        var json = await _cache.GetStringAsync(tagKey, cancellationToken);
        return json is null
            ? []
            : JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
    }

    private static string Key(string key) => Prefix + key;
    private static string TagKey(string tag) => Prefix + "tag:" + tag;
}
