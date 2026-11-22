using System.Collections.Concurrent;
using System.Globalization;
using CulinaryBlog.API.Extensions;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace CulinaryBlog.API.Middleware;

/// <summary>
/// NFR-SEC-003: trả <c>X-RateLimit-Limit</c>, <c>X-RateLimit-Remaining</c>, <c>X-RateLimit-Reset</c> (epoch giây)
/// cho mức giới hạn chung 100 request/phút/IP. Chạy sau <c>UseRateLimiter</c> nên chỉ thấy request đã được cho qua;
/// request bị từ chối (429) được gắn header trong <c>OnRejected</c>.
/// </summary>
public sealed class RateLimitHeadersMiddleware
{
    private const int PruneThreshold = 10_000;

    /// <summary>Thời điểm bắt đầu cửa sổ hiện tại của từng IP, mô phỏng đúng fixed window của limiter chung.</summary>
    private static readonly ConcurrentDictionary<string, DateTimeOffset> WindowStarts = new();

    private readonly RequestDelegate _next;
    private readonly IOptions<RateLimiterOptions> _options;

    public RateLimitHeadersMiddleware(RequestDelegate next, IOptions<RateLimiterOptions> options) =>
        (_next, _options) = (next, options);

    public Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/health"))
        {
            var statistics = _options.Value.GlobalLimiter?.GetStatistics(context);
            if (statistics is not null)
            {
                var remaining = (int)Math.Max(0, statistics.CurrentAvailablePermits);
                var resetIn = SecondsUntilReset(context);
                context.Response.OnStarting(() =>
                {
                    Apply(context, remaining, resetIn);
                    return Task.CompletedTask;
                });
            }
        }

        return _next(context);
    }

    internal static void Apply(HttpContext context, int remaining, int resetInSeconds)
    {
        var resetAt = DateTimeOffset.UtcNow.AddSeconds(resetInSeconds).ToUnixTimeSeconds();
        var headers = context.Response.Headers;
        headers["X-RateLimit-Limit"] = RateLimitingExtensions.GeneralPermitLimit.ToString(CultureInfo.InvariantCulture);
        headers["X-RateLimit-Remaining"] = remaining.ToString(CultureInfo.InvariantCulture);
        headers["X-RateLimit-Reset"] = resetAt.ToString(CultureInfo.InvariantCulture);
    }

    private static int SecondsUntilReset(HttpContext context)
    {
        var key = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTimeOffset.UtcNow;
        var window = RateLimitingExtensions.Window;

        if (WindowStarts.Count > PruneThreshold)
        {
            foreach (var entry in WindowStarts.Where(item => item.Value + window <= now))
                WindowStarts.TryRemove(entry.Key, out _);
        }

        var start = WindowStarts.AddOrUpdate(key, now, (_, existing) => existing + window <= now ? now : existing);
        return Math.Max(1, (int)Math.Ceiling((start + window - now).TotalSeconds));
    }
}
