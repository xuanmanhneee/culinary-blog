using CulinaryBlog.Infrastructure.Modules.Cache;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;

namespace CulinaryBlog.Tests.Cache;

public sealed class RedisCacheServiceTests
{
    [Fact]
    public async Task RedisFailure_DegradesToCacheMissAndNoOpWrites()
    {
        var service = new RedisCacheService(
            new UnavailableCache(),
            NullLogger<RedisCacheService>.Instance);

        Assert.Null(await service.GetAsync<string>("recipes:1"));
        await service.SetAsync("recipes:1", "value", TimeSpan.FromMinutes(1), "recipes");
        await service.EvictByTagAsync("recipes");
    }

    private sealed class UnavailableCache : IDistributedCache
    {
        private static InvalidOperationException Failure() => new("Redis is unavailable.");

        public byte[]? Get(string key) => throw Failure();
        public Task<byte[]?> GetAsync(string key, CancellationToken token = default) =>
            Task.FromException<byte[]?>(Failure());
        public void Refresh(string key) => throw Failure();
        public Task RefreshAsync(string key, CancellationToken token = default) => Task.FromException(Failure());
        public void Remove(string key) => throw Failure();
        public Task RemoveAsync(string key, CancellationToken token = default) => Task.FromException(Failure());
        public void Set(string key, byte[] value, DistributedCacheEntryOptions options) => throw Failure();
        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default) =>
            Task.FromException(Failure());
    }
}
