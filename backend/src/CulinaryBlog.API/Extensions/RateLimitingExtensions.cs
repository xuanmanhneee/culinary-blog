using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace CulinaryBlog.API.Extensions;

/// <summary>Tên policy rate limiting, dùng ở endpoint qua <c>.RequireRateLimiting(...)</c>.</summary>
public static class RateLimitPolicies
{
    /// <summary>NFR-SEC-003: /auth/* tối đa 10 request/phút/IP.</summary>
    public const string Auth = "auth";

    /// <summary>NFR-SEC-003: upload file tối đa 5 request/phút/IP.</summary>
    public const string Upload = "upload";
}

/// <summary>
/// NFR-SEC-003: giới hạn theo IP, trả 429 kèm header Retry-After (đã expose qua CORS).
/// Ngoài policy riêng cho /auth và upload, mọi request còn chịu mức chung 100 request/phút/IP.
/// </summary>
public static class RateLimitingExtensions
{
    private const int AuthPermitLimit = 10;
    private const int GeneralPermitLimit = 100;
    private const int UploadPermitLimit = 5;

    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    /// <summary>Health check (probe của Docker/Nginx) không bị giới hạn để không làm sai readiness.</summary>
    private static bool IsUnlimited(string path) => path.StartsWith("/health", StringComparison.OrdinalIgnoreCase);

    public static IServiceCollection AddCulinaryRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Mức chung 100 request/phút/IP: áp cho cả endpoint không khai báo policy riêng.
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                IsUnlimited(context.Request.Path)
                    ? RateLimitPartition.GetNoLimiter("unlimited")
                    : RateLimitPartition.GetFixedWindowLimiter(
                        PartitionKey(context),
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = GeneralPermitLimit,
                            Window = Window,
                            QueueLimit = 0
                        }));

            options.AddPolicy(RateLimitPolicies.Auth, context =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    PartitionKey(context),
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = AuthPermitLimit,
                        Window = Window,
                        SegmentsPerWindow = 6,
                        QueueLimit = 0
                    }));

            // Áp cho endpoint upload khi module File Storage (FR-FILE-001) được map:
            // .RequireRateLimiting(RateLimitPolicies.Upload)
            options.AddPolicy(RateLimitPolicies.Upload, context =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    PartitionKey(context),
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = UploadPermitLimit,
                        Window = Window,
                        SegmentsPerWindow = 6,
                        QueueLimit = 0
                    }));

            options.OnRejected = (context, _) =>
            {
                // SlidingWindow/FixedWindow chỉ cấp metadata RetryAfter trong một số trường hợp;
                // nếu thiếu thì dùng độ dài cửa sổ (60s) để client backoff an toàn.
                var retryAfterSeconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
                    ? (int)Math.Ceiling(retryAfter.TotalSeconds)
                    : (int)Window.TotalSeconds;

                context.HttpContext.Response.Headers.RetryAfter =
                    retryAfterSeconds.ToString(CultureInfo.InvariantCulture);

                return ValueTask.CompletedTask;
            };
        });

        return services;
    }

    /// <summary>Khoá phân vùng theo IP; "unknown" cho kết nối không xác định được địa chỉ.</summary>
    private static string PartitionKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
