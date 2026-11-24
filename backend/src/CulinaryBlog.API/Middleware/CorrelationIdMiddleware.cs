using System.Diagnostics;
using System.Security.Claims;

namespace CulinaryBlog.API.Middleware;

public sealed class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-ID";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
        => (_next, _logger) = (next, logger);

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(correlationId) || correlationId.Length > 128)
            correlationId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");

        context.Response.Headers[HeaderName] = correlationId;
        var stopwatch = Stopwatch.StartNew();
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["RequestPath"] = context.Request.Path.ToString()
        }))
        {
            await _next(context);
            // Authentication runs inside _next, so resolve the user only after the pipeline has populated HttpContext.User.
            var userId = context.User.FindFirstValue("sub")
                ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? "anonymous";
            // Probe định kỳ (nginx/Docker) chỉ ghi Debug khi thành công; lỗi vẫn hiện ở Information để dễ thấy.
            var isHealthProbe = context.Request.Path.StartsWithSegments("/health")
                && context.Response.StatusCode < 400;
            _logger.Log(isHealthProbe ? LogLevel.Debug : LogLevel.Information,
                "HTTP {Method} {Path} completed with {StatusCode} in {ElapsedMs} ms for user {UserId}",
                context.Request.Method, context.Request.Path, context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds, userId);
        }
    }
}
